/**
 * MEC: Ambient weather scene (v20; earth vista v42).
 *
 * A soft, looping landscape band above the three columns. It does NOT fetch weather itself:
 * weather.js (initSky) publishes its state on `window` as a `mec:sky` event (and parks the last
 * state on globalThis.__mecSky); this module turns that reading into a mood and paints it.
 *
 *  - With a location reading: terrain from coordinates (desert vs meadow), season from month +
 *    hemisphere, sky / precipitation from the WMO (Open-Meteo) or wttr.in code refined by cloud
 *    cover, wind from mph, warmth from °F, and day / golden hour / night from solar elevation.
 *  - With a place but no reading yet: a season-only landscape for that place (no weather invented).
 *  - Without any place (v42): a calm earth vista, Earth seen from orbit at the current time of
 *    day (sunlit, sunrise or sunset over the limb, or night with city lights). No weather is shown.
 *  - prefers-reduced-motion: a single still frame (no CSS loops, no canvas loop, no SVG animation).
 *
 * Pure helpers are exported for tests (node mec.test.js); DOM wiring lives in initScene().
 * Rendering: inline SVG layers + CSS loops + one small 2D canvas for particles. No libraries.
 */

/* ---------------- pure helpers ---------------- */

/** Rough bounding boxes of arid / red-rock country (lat min, lat max, lon min, lon max). */
export const DESERT_BOXES = [
  [31, 39, -118.5, -106],   // US Southwest: Mojave, Sonoran, Colorado Plateau (Las Vegas, Phoenix, Moab)
  [26, 31, -115.5, -104],   // northern Mexico: Sonoran / Chihuahuan
  [15, 32, -17, 60],        // Sahara + Arabian Peninsula
  [-32, -19, 117, 145],     // Australian interior
  [-28, -17, -71.5, -68],   // Atacama
  [37, 46, 92, 112]         // Gobi
];

export function is_desert(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  return DESERT_BOXES.some(([a, b, c, d]) => lat >= a && lat <= b && lon >= c && lon <= d);
}

const SEASONS = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'];
/** Meteorological season by month; southern hemisphere (lat < 0) is flipped. */
export function season_for(date = new Date(), lat = 40) {
  let m = date.getMonth();
  if (typeof lat === 'number' && lat < 0) m = (m + 6) % 12;
  return SEASONS[m];
}

/** Solar elevation and hour angle in degrees (low-precision almanac formula, ±0.5°). */
export function solar_position(date, lat, lon) {
  const rad = Math.PI / 180;
  const d = date.getTime() / 86400000 - 10957.5; // days since J2000.0
  const g = (357.529 + 0.98560028 * d) * rad;
  const q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
  const e = (23.439 - 0.00000036 * d) * rad;
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)) / rad;
  const gmst = ((18.697374558 + 24.06570982441908 * d) % 24 + 24) % 24;
  let ha = gmst * 15 + lon - ra;
  ha = ((ha + 180) % 360 + 360) % 360 - 180; // −180..180, negative = morning
  const el = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha * rad)) / rad;
  return { elevation: el, hourAngle: ha };
}

/** "h:mm AM" from a local ISO string ("2026-10-05T07:16", no offset), no timezone reconversion. */
export function format_local_iso_time(iso) {
  const m = typeof iso === 'string' && /T(\d{1,2}):(\d{2})/.exec(iso);
  if (!m) return null;
  const h = +m[1], mm = m[2];
  if (h > 23 || +mm > 59) return null;
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "h:mm AM" from a Date in the browser's local time zone. */
export function format_clock(date) {
  if (!(date instanceof Date) || isNaN(date)) return null;
  const h = date.getHours(), mm = String(date.getMinutes()).padStart(2, '0');
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'AM' : 'PM'}`;
}

/**
 * NOAA sunrise equation: { sunrise, sunset } as Dates for the local calendar day of `date`
 * at lat/lon, or null during polar day/night.
 */
export function sun_times(date, lat, lon) {
  const rad = Math.PI / 180;
  const noonUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12) - lon / 15 * 3600000;
  const n = Math.round(noonUtc / 86400000 - 10957.5); // days since J2000
  const Js = n - lon / 360;
  const M = ((357.5291 + 0.98560028 * Js) % 360) * rad;
  const C = 1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M);
  const lam = ((M / rad + C + 180 + 102.9372) % 360) * rad;
  const Jt = 2451545 + Js + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * lam);
  const dec = Math.asin(Math.sin(lam) * Math.sin(23.4397 * rad));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  if (!(cosW >= -1 && cosW <= 1)) return null;
  const w = Math.acos(cosW) / rad;
  const toDate = (j) => new Date((j - 2440587.5) * 86400000);
  return { sunrise: toDate(Jt - w / 360), sunset: toDate(Jt + w / 360) };
}

/** { rise, set } display strings: Open-Meteo place-local times first, else computed, else null. */
export function sun_caption_times(sky, date = new Date()) {
  const r = format_local_iso_time(sky && (sky.sunrise || (sky.weather && sky.weather.sunrise)));
  const s = format_local_iso_time(sky && (sky.sunset || (sky.weather && sky.weather.sunset)));
  if (r && s) return { rise: r, set: s };
  if (sky && typeof sky.lat === 'number' && typeof sky.lon === 'number') {
    const t = sun_times(date, sky.lat, sky.lon);
    if (t) return { rise: format_clock(t.sunrise), set: format_clock(t.sunset) };
  }
  return null;
}

/** day / dusk (golden hour or twilight) / night from solar elevation. */
export function time_of_day(elevation) {
  if (elevation > 9) return 'day';
  if (elevation > -7) return 'dusk';
  return 'night';
}

const WTTR_SNOW = [179, 182, 185, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 350, 362, 365, 368, 371, 374, 377];
const WTTR_STORM = [200, 386, 389, 392, 395];
const WTTR_DRIZZLE = [176, 263, 266, 281, 284, 293, 296, 353];

/** Weather reading → { sky: clear|partly|overcast|fog, precip: none|drizzle|rain|snow|storm, heavy }. */
export function classify_weather(w) {
  if (!w) return null;
  const code = Number(w.code);
  let sky = 'clear', precip = 'none', heavy = false;
  if (code >= 100) {            // wttr.in / WorldWeatherOnline codes
    if (code === 113) sky = 'clear';
    else if (code === 116) sky = 'partly';
    else if (code === 119 || code === 122) sky = 'overcast';
    else if ([143, 248, 260].includes(code)) sky = 'fog';
    else if (WTTR_STORM.includes(code)) { sky = 'overcast'; precip = 'storm'; }
    else if (WTTR_SNOW.includes(code)) { sky = 'overcast'; precip = 'snow'; heavy = [230, 335, 338, 371].includes(code); }
    else if (WTTR_DRIZZLE.includes(code)) { sky = 'overcast'; precip = 'drizzle'; }
    else { sky = 'overcast'; precip = 'rain'; heavy = [305, 308, 314, 359].includes(code); }
  } else if (Number.isFinite(code)) { // WMO (Open-Meteo)
    if (code <= 1) sky = 'clear';
    else if (code === 2) sky = 'partly';
    else if (code === 3) sky = 'overcast';
    else if (code === 45 || code === 48) sky = 'fog';
    else if (code >= 51 && code <= 57) { sky = 'overcast'; precip = 'drizzle'; }
    else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { sky = 'overcast'; precip = 'rain'; heavy = code === 65 || code === 67 || code === 82; }
    else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { sky = 'overcast'; precip = 'snow'; heavy = code === 75 || code === 86; }
    else if (code >= 95) { sky = 'overcast'; precip = 'storm'; }
  }
  // Cloud cover refines the sky when it's dry and not foggy.
  if (precip === 'none' && sky !== 'fog' && typeof w.cloud === 'number') {
    sky = w.cloud < 25 ? 'clear' : w.cloud < 75 ? 'partly' : 'overcast';
  }
  return { sky, precip, heavy };
}

const OVERRIDE_TOKENS = {
  terrain: ['desert', 'meadow', 'vista'],
  season: ['spring', 'summer', 'fall', 'winter'],
  sky: ['clear', 'partly', 'overcast', 'fog'],
  precip: ['drizzle', 'rain', 'snow', 'storm'],
  time: ['day', 'dusk', 'night']
};

/** Parse a ?scene= override like "desert-rain-night" or "winter". */
export function parse_scene_override(str) {
  if (!str) return null;
  const out = {};
  for (const raw of String(str).toLowerCase().split(/[-,+ ]+/)) {
    const t = raw === 'cloudy' ? 'overcast' : raw === 'autumn' ? 'fall' : raw;
    for (const [k, list] of Object.entries(OVERRIDE_TOKENS)) if (list.includes(t)) out[k] = t;
    if (t === 'dry') out.precip = 'none';
    if (t === 'hot') out.tempF = 95;
    if (t === 'warm') out.tempF = 82;
    if (t === 'cold') out.tempF = 30;
    if (t === 'windy') out.windMph = 22;
    if (t === 'generic') out.generic = true;
  }
  return Object.keys(out).length ? out : null;
}

const CAP = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Decide the scene. Inputs:
 *   weather  : reading from weather.js (or null when there is no location weather)
 *   lat, lon : coordinates of that reading (or null when no place is set or shared)
 *   date     : now
 *   override : parse_scene_override() result (QA / preview)
 */
export function pick_scene({ weather = null, lat = null, lon = null, date = new Date(), override = null } = {}) {
  const o = override || {};
  const hasPlace = !o.generic && typeof lat === 'number' && typeof lon === 'number';
  const located = hasPlace && !!weather; // a live (or cached) reading for a place
  // Coordinates for the sun: the reading's place, else a guess from the browser's UTC offset.
  const sLat = typeof lat === 'number' ? lat : 40;
  const sLon = typeof lon === 'number' ? lon : -date.getTimezoneOffset() / 4;
  let sun = solar_position(date, sLat, sLon);
  // A forced time of day (QA preview) gets a plausible evening sun so the picture matches.
  if (o.time && time_of_day(sun.elevation) !== o.time) sun = { elevation: { day: 40, dusk: 3, night: -30 }[o.time], hourAngle: { day: 10, dusk: 78, night: 160 }[o.time] };

  const season = o.season || season_for(date, sLat);
  // Terrain follows the place even before the first reading lands (no meadow→desert flash).
  // No place at all (v42): the earth vista, never a made-up local landscape.
  const terrain = o.terrain || (!hasPlace ? 'vista' : is_desert(lat, lon) ? 'desert' : 'meadow');
  // Solar elevation at the reading's coordinates (finer than is_day: gives golden hour / twilight).
  const time = o.time || time_of_day(sun.elevation);
  if (terrain === 'vista') {
    const timeWord = time === 'dusk' ? (sun.elevation >= 0 ? 'golden hour' : 'twilight') : time === 'night' ? 'night' : 'daylight';
    return {
      key: ['vista', time].join('-'),
      located: false, hasPlace: false, terrain, season, sky: 'clear', precip: 'none', heavy: false, time,
      warm: false, cold: false, heat: false, windMph: 0, tempF: null, particles: 'none', lightning: false,
      sun: { elevation: sun.elevation, hourAngle: sun.hourAngle, morning: sun.hourAngle < 0 },
      label: `Earth vista · ${timeWord}`
    };
  }

  let sky, precip, heavy = false;
  const wx = located ? classify_weather(weather) : null;
  if (wx) ({ sky, precip, heavy } = wx);
  else {
    // Season-only defaults when there is no weather reading.
    if (terrain === 'desert') {
      sky = { spring: 'partly', summer: 'clear', fall: 'clear', winter: 'partly' }[season];
      precip = 'none';
    } else {
      sky = { spring: 'partly', summer: 'clear', fall: 'partly', winter: 'overcast' }[season];
      precip = season === 'winter' ? 'snow' : 'none';
    }
  }
  if (o.sky) sky = o.sky;
  if (o.precip) { precip = o.precip; if (precip !== 'none' && !o.sky) sky = 'overcast'; }

  const tempF = o.tempF ?? (located && typeof weather.tempF === 'number' ? weather.tempF : null);
  const windMph = o.windMph ?? (located && typeof weather.windMph === 'number' ? weather.windMph : 4);
  const warm = tempF != null ? tempF >= 75 : season === 'summer';
  const cold = tempF != null ? tempF <= 38 : season === 'winter';
  const dry = precip === 'none';
  const heat = dry && time === 'day' && sky !== 'fog' && sky !== 'overcast' && (tempF != null ? tempF >= 78 : (season === 'summer' && terrain === 'desert'));

  let particles = 'none';
  if (precip === 'rain' || precip === 'storm') particles = 'rain';
  else if (precip === 'drizzle') particles = 'drizzle';
  else if (precip === 'snow') particles = 'snow';
  else if (time === 'night') particles = (season === 'summer' || (warm && season !== 'winter')) && terrain === 'meadow' ? 'fireflies' : 'none';
  else if (sky === 'fog') particles = 'none';
  else if (terrain === 'desert') particles = 'dust';
  else particles = { spring: 'petals', summer: 'pollen', fall: 'leaves', winter: 'none' }[season];

  // Human label, e.g. "Summery desert fall · clear · golden hour"
  let place = terrain === 'desert' ? `desert ${season}` : season;
  if (terrain === 'desert' && season === 'fall' && warm) place = 'summery desert fall';
  else if (terrain === 'desert' && season === 'winter' && !cold) place = 'mild desert winter';
  else if (terrain === 'meadow') place = { spring: 'spring blossom', summer: 'green summer', fall: 'amber fall', winter: cold || precip === 'snow' ? 'winter' : 'soft grey winter' }[season];
  const skyWord = precip !== 'none'
    ? ({ drizzle: 'drizzle', rain: heavy ? 'heavy rain' : 'rain', snow: heavy ? 'heavy snow' : 'snow', storm: 'thunderstorm' }[precip])
    : ({ clear: 'clear', partly: 'drifting clouds', overcast: 'overcast', fog: 'fog' }[sky]);
  const timeWord = time === 'dusk' ? (sun.elevation >= 0 ? 'golden hour' : 'twilight') : time === 'night' ? 'night' : (heat ? 'heat shimmer' : '');
  const label = [CAP(place), skyWord, timeWord].filter(Boolean).join(' · ');

  return {
    key: [terrain, season, sky, precip, heavy ? 'heavy' : '', time, warm ? 'warm' : '', cold ? 'cold' : '', heat ? 'heat' : '', windMph > 15 ? 'windy' : ''].filter(Boolean).join('-'),
    located, hasPlace, terrain, season, sky, precip, heavy, time, warm, cold, heat, windMph, tempF,
    particles, lightning: precip === 'storm',
    sun: { elevation: sun.elevation, hourAngle: sun.hourAngle, morning: sun.hourAngle < 0 },
    label
  };
}

/* ---------------- colour helpers ---------------- */

function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function rgb2hex(r, g, b) { return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

const SKIES = {
  day: {
    clear: ['#4a77ae', '#9dbcd6', '#f2e2bf'],
    partly: ['#52759f', '#a0b6cb', '#ebdcbd'],
    overcast: ['#576074', '#8b919f', '#c4beb2'],
    fog: ['#747b89', '#a3a6ae', '#cdc8be']
  },
  dusk: {
    clear: ['#262b5e', '#8a5878', '#f1a868'],
    partly: ['#2a2f5e', '#7f5a78', '#e39c6c'],
    overcast: ['#2c3150', '#5f5568', '#b18672'],
    fog: ['#3b3f58', '#6f6a78', '#a99288']
  },
  night: {
    clear: ['#060920', '#10183c', '#29295a'],
    partly: ['#070a20', '#121a3a', '#2a2b52'],
    overcast: ['#0c0e1e', '#181c30', '#2c2d40'],
    fog: ['#10121f', '#1d2030', '#33343f']
  }
};
const HORIZON_BY_SEASON = { spring: '#f2dde2', summer: '#eee7c2', fall: '#f2d9a6', winter: '#dde2ea' };

const TERRAIN = {
  desert: { far: '#b98476', mid: '#c4683f', midShade: '#8e3f27', near: '#7a3826', ground: '#c99a62', ground2: '#a87445', grass: '#ecc77a', shrub: '#6e6b3c', strata: '#f0b48a' },
  meadow: {
    spring: { far: '#7593a6', mid: '#7fae78', near: '#5f9a5c', ground: '#6fa860', ground2: '#578c4b', grass: '#93c473', tree: ['#efb3cb', '#f6d2e0', '#e59ab8'], conifer: '#3e6b47', trunk: '#5a4636' },
    summer: { far: '#62879f', mid: '#4f8f4c', near: '#3f7d3c', ground: '#5a9a48', ground2: '#467d39', grass: '#7cb653', tree: ['#2f6e35', '#3d8441', '#28602f'], conifer: '#24502f', trunk: '#4e3b2c' },
    fall: { far: '#86788e', mid: '#ad7b3e', near: '#8a5a2c', ground: '#a87c40', ground2: '#8a6232', grass: '#d0a85a', tree: ['#dd8a2e', '#c4502c', '#e9b44c'], conifer: '#3d5a3a', trunk: '#4a3628' },
    winter: { far: '#8593ab', mid: '#c4cfdc', near: '#a9b5c6', ground: '#e2e8f0', ground2: '#c9d2de', grass: '#cdd5e0', tree: null, conifer: '#3f5a52', trunk: '#4d4552' }
  }
};

/** Earth vista palettes: space, planet surface, limb glow (shared ivory/gold/indigo mood). */
const VISTA = {
  day: { top: '#03061a', sky: '#0b1640', hor: '#24508f', ocean: '#1d4c80', ocean2: '#2f6aa3', land: '#6f8a5e', land2: '#a8926a', cloud: '#f4efe4', limb: '#9fd0ff', city: '#f1d58e' },
  dusk: { top: '#04051a', sky: '#151640', hor: '#5a3a5e', ocean: '#16284f', ocean2: '#27406e', land: '#4c5a4a', land2: '#7a6650', cloud: '#e9c2a6', limb: '#ffb27a', city: '#f1d58e' },
  night: { top: '#020309', sky: '#070b22', hor: '#14284a', ocean: '#081227', ocean2: '#0d1a36', land: '#121c30', land2: '#18233a', cloud: '#2a3350', limb: '#6fd8c6', city: '#f1d58e' }
};

/** Full palette for a scene (sky gradient + terrain tones after atmosphere tinting). */
export function palette(s) {
  if (s.terrain === 'vista') return { ...(VISTA[s.time] || VISTA.day) };
  const sk = (SKIES[s.time] || SKIES.day)[s.sky] || SKIES.day.clear;
  let [top, midSky, hor] = sk;
  if (s.time === 'day' && (s.sky === 'clear' || s.sky === 'partly')) hor = mix(hor, HORIZON_BY_SEASON[s.season], 0.45);
  if (s.precip === 'rain' || s.precip === 'drizzle') { top = mix(top, '#3a4152', 0.5); midSky = mix(midSky, '#5d6576', 0.5); hor = mix(hor, '#8e8f92', 0.5); }
  if (s.precip === 'storm') { top = mix(top, '#1d2132', 0.6); midSky = mix(midSky, '#3a3f52', 0.6); hor = mix(hor, '#6a6668', 0.55); }
  if (s.precip === 'snow') { top = mix(top, '#7a8496', 0.4); midSky = mix(midSky, '#aeb6c5', 0.45); hor = mix(hor, '#dfe3ea', 0.5); }
  if (s.warm && s.time === 'day' && s.precip === 'none') hor = mix(hor, '#f6d79a', 0.18);

  const base = s.terrain === 'desert' ? { ...TERRAIN.desert } : { ...TERRAIN.meadow[s.season] };
  if (s.terrain === 'desert' && s.season === 'winter') { base.grass = '#c9b48a'; base.shrub = '#5d6446'; }
  if (s.terrain === 'desert' && s.season === 'spring') { base.grass = '#b9c27a'; base.shrub = '#6f7d45'; }
  if (s.terrain === 'desert' && s.season === 'summer') { base.grass = '#dcc07e'; }
  if (s.precip === 'snow' || (s.season === 'winter' && s.cold && s.terrain === 'meadow')) {
    base.ground = '#e4e9f0'; base.ground2 = '#cbd4e0'; base.grass = '#d3dae4';
  }
  const tint = (c, to, t) => (Array.isArray(c) ? c.map((x) => mix(x, to, t)) : c ? mix(c, to, t) : c);
  const keys = Object.keys(base);
  const apply = (to, tFar, tNear) => keys.forEach((k) => { base[k] = tint(base[k], to, k === 'far' ? tFar : tNear); });
  if (s.sky === 'overcast' || s.precip !== 'none') apply('#7b7d86', 0.28, 0.18);
  if (s.precip === 'storm') apply('#2c3040', 0.35, 0.3);
  if (s.sky === 'fog') apply('#c3c2bf', 0.6, 0.3);
  if (s.time === 'dusk') { apply('#4d2c40', 0.38, 0.5); base.far = mix(base.far, '#d9906e', 0.18); }
  if (s.time === 'night') apply('#0d1030', 0.8, 0.86);
  // far range picks up the horizon haze
  base.far = mix(base.far, hor, s.time === 'night' ? 0.12 : 0.32);
  return { ...base, top, sky: midSky, hor };
}

/* ---------------- DOM rendering ---------------- */

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const H = 200; // world units tall; width follows the band's aspect ratio
const f1 = (n) => Math.round(n * 10) / 10;

function mesaRange(W, R, base, minTop, maxTop, gap) {
  // Flat-topped mesas and buttes with steep, slightly stepped walls.
  let x = -20, d = `M-20 ${H} L-20 ${base}`;
  while (x < W + 20) {
    const low = base - R() * 8;
    const run = gap * (0.4 + R());
    d += ` L${f1(x + run)} ${f1(low)}`;
    x += run;
    const top = minTop + R() * (maxTop - minTop);
    const wall = 6 + R() * 10;
    const step = R() < 0.5;
    const width = (R() < 0.3 ? 30 : 70) + R() * 160;
    if (step) d += ` L${f1(x + wall * 0.5)} ${f1(top + (low - top) * 0.45)} L${f1(x + wall * 0.8)} ${f1(top + (low - top) * 0.4)}`;
    d += ` L${f1(x + wall)} ${f1(top)} L${f1(x + wall + width)} ${f1(top + (R() - 0.5) * 3)}`;
    d += ` L${f1(x + wall * 2 + width)} ${f1(low)}`;
    x += wall * 2 + width;
  }
  return d + ` L${W + 20} ${H} Z`;
}

function hills(W, R, base, amp, waves) {
  const ph = [R() * 6.28, R() * 6.28, R() * 6.28];
  let d = `M-10 ${H} L-10 ${base}`;
  for (let x = -10; x <= W + 10; x += 12) {
    const y = base - amp * (0.5 + 0.3 * Math.sin(x / (W / waves) + ph[0]) + 0.15 * Math.sin(x / 61 + ph[1]) + 0.05 * Math.sin(x / 17 + ph[2]));
    d += ` L${x} ${f1(y)}`;
  }
  return d + ` L${W + 10} ${H} Z`;
}

function cloudShape(R, x, y, s, fill, op) {
  const n = 4 + Math.floor(R() * 3);
  let g = `<g opacity="${op}" fill="${fill}">`;
  for (let i = 0; i < n; i++) {
    const cx = x + (i - n / 2) * 13 * s + R() * 6 * s, cy = y - Math.sin((i / (n - 1)) * Math.PI) * 7 * s + R() * 3;
    g += `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1((16 + R() * 12) * s)}" ry="${f1((7 + R() * 5) * s)}"/>`;
  }
  return g + '</g>';
}

function cloudsSvg(W, s, P, seed) {
  if (s.terrain === 'vista') return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"></svg>`; // clouds live on the planet
  const R = rng(seed);
  const n = { clear: 2, partly: 6, overcast: 10, fog: 3 }[s.sky] || 3;
  const fill = s.time === 'night' ? '#3a3d5a' : s.time === 'dusk' ? '#e7b49a' : s.precip !== 'none' || s.sky === 'overcast' ? '#9aa0ad' : '#f5efe6';
  const baseOp = s.sky === 'clear' ? 0.28 : s.sky === 'overcast' ? 0.55 : 0.5;
  let g = '';
  if (s.sky === 'overcast' || s.precip !== 'none') {
    g += `<rect x="0" y="0" width="${W}" height="${H * 0.45}" fill="url(#sc-deck)"/>`;
  }
  for (let i = 0; i < n; i++) {
    const x = ((i + R() * 0.8) / n) * W;
    const y = 30 + R() * 55;
    const sc = s.sky === 'clear' ? 0.9 + R() * 0.5 : 0.9 + R() * 1.1;
    g += cloudShape(R, x, y, sc, fill, f1(baseOp * (0.6 + R() * 0.5)));
  }
  if (s.sky === 'clear') g = g.replace(/ry="([\d.]+)"/g, (m, v) => `ry="${f1(v * 0.45)}"`); // thin wisps
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <defs><filter id="sc-soft${seed}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${s.sky === 'clear' ? 3.5 : 2.5}"/></filter>
    <linearGradient id="sc-deck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(P.top, fill, 0.5)}" stop-opacity=".7"/><stop offset="1" stop-color="${fill}" stop-opacity="0"/></linearGradient></defs>
    <g filter="url(#sc-soft${seed})">${g}</g></svg>`;
}

function tuft(x, y, h, color, R) {
  let d = '';
  const blades = 4 + Math.floor(R() * 4);
  for (let i = 0; i < blades; i++) {
    const lean = (i - blades / 2) * (1.6 + R() * 1.4);
    const hh = h * (0.6 + R() * 0.5);
    d += `M${f1(x + i * 0.7)} ${f1(y)} q${f1(lean * 0.3)} ${f1(-hh * 0.6)} ${f1(lean)} ${f1(-hh)} `;
  }
  return `<path d="${d}" stroke="${color}" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
}

/** Earth seen from orbit: the planet's limb across the lower band, space above. */
function vistaSvg(W, s, P) {
  const R = rng(4242);
  const night = s.time === 'night', dusk = s.time === 'dusk';
  const ha = Math.max(-100, Math.min(100, s.sun.hourAngle));
  const sunLeft = s.sun.morning; // morning light comes from the left (east), evening from the right
  // Planet: a huge circle whose top edge (the limb) arcs across the band.
  const rad = Math.max(W * 1.6, 900), cx = W / 2, top = 122, cy = top + rad;
  let stars = '';
  const nStars = Math.round(W / (night ? 9 : dusk ? 13 : 22));
  for (let i = 0; i < nStars; i++) {
    const x = R() * W, y = R() * 118, r = R() < 0.1 ? 1.1 : 0.45 + R() * 0.45;
    stars += `<circle class="${R() < 0.3 ? 'sc-tw' : ''}" style="animation-delay:${f1(R() * 6)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${R() < 0.2 ? '#f1d58e' : '#f3ecdc'}" opacity="${f1((night ? 0.45 : dusk ? 0.35 : 0.2) + R() * 0.45)}"/>`;
  }
  // Land masses and cloud streaks drawn as soft blobs, clipped to the planet.
  let land = '', clouds = '', lights = '';
  for (let i = 0; i < Math.max(3, Math.round(W / 260)); i++) {
    const x = R() * W, y = top + 10 + R() * 60, rx = 40 + R() * 110, ry = 8 + R() * 16;
    land += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${R() < 0.6 ? P.land : P.land2}" opacity="${night ? 0.9 : 0.75}"/>`;
    land += `<ellipse cx="${f1(x + rx * 0.5)}" cy="${f1(y - ry * 0.4)}" rx="${f1(rx * 0.45)}" ry="${f1(ry * 0.7)}" fill="${P.land}" opacity="${night ? 0.9 : 0.6}"/>`;
    if (night) for (let k = 0; k < 14 + Math.round(R() * 18); k++) {
      const lx = x + (R() - 0.5) * rx * 1.6, ly = y + (R() - 0.5) * ry * 1.4;
      lights += `<circle cx="${f1(lx)}" cy="${f1(ly)}" r="${f1(0.6 + R() * 0.9)}" fill="${P.city}" opacity="${f1(0.5 + R() * 0.45)}"/>`;
    }
  }
  for (let i = 0; i < Math.round(W / 120); i++) {
    const x = R() * W, y = top + 6 + R() * 70, rx = 30 + R() * 90, ry = 2 + R() * 4;
    clouds += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${P.cloud}" opacity="${f1((night ? 0.18 : 0.45) + R() * 0.25)}"/>`;
  }
  // Sun: overhead in daylight, sitting on the limb at golden hour / twilight, the moon at night.
  const sunX = dusk ? (sunLeft ? W * 0.16 : W * 0.84) : W * (0.5 + (ha / 100) * 0.38);
  const sunY = dusk ? top - 1 + Math.max(-6, Math.min(4, -s.sun.elevation)) : 44;
  const body = night
    ? `<circle cx="${f1(W * 0.78)}" cy="40" r="26" fill="url(#vs-glow)"/><circle cx="${f1(W * 0.78)}" cy="40" r="6.5" fill="#f2ecd8" opacity=".9"/><circle cx="${f1(W * 0.78 + 2.8)}" cy="38.6" r="5.8" fill="${P.top}" opacity=".9"/>`
    : `<circle cx="${f1(sunX)}" cy="${f1(sunY)}" r="${dusk ? 70 : 46}" fill="url(#vs-glow)"/><circle cx="${f1(sunX)}" cy="${f1(sunY)}" r="${dusk ? 6 : 5}" fill="${dusk ? '#ffe2b0' : '#fffaf0'}"/>`;
  const shadeFrom = sunLeft ? 0 : 1; // terminator: the side away from the sun is in shadow at dusk
  return `<svg class="sc-land sc-vista" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="vs-space" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.top}"/><stop offset=".6" stop-color="${P.sky}"/><stop offset="1" stop-color="${P.hor}"/></linearGradient>
    <radialGradient id="vs-glow"><stop offset="0" stop-color="${night ? '#f2ecd8' : dusk ? '#ffcf8a' : '#fff4d6'}" stop-opacity="${night ? 0.3 : 0.75}"/><stop offset="1" stop-color="${night ? '#f2ecd8' : '#ffcf8a'}" stop-opacity="0"/></radialGradient>
    <linearGradient id="vs-term" x1="${shadeFrom}" y1="0" x2="${1 - shadeFrom}" y2="0"><stop offset="0" stop-color="#020617" stop-opacity="0"/><stop offset=".45" stop-color="#020617" stop-opacity="0"/><stop offset=".62" stop-color="#ff9a5a" stop-opacity=".18"/><stop offset=".72" stop-color="#030817" stop-opacity=".72"/><stop offset="1" stop-color="#030817" stop-opacity=".86"/></linearGradient>
    <linearGradient id="vs-limb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P.limb}" stop-opacity="${dusk && sunLeft ? 1 : 0.55}"/><stop offset=".5" stop-color="${P.limb}" stop-opacity="${dusk ? 0.45 : 0.85}"/><stop offset="1" stop-color="${P.limb}" stop-opacity="${dusk && !sunLeft ? 1 : 0.55}"/></linearGradient>
    <filter id="vs-blur" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
    <filter id="vs-soft" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>
    <clipPath id="vs-planet"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rad)}"/></clipPath>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#vs-space)"/>
  ${stars}
  <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rad + 7)}" fill="none" stroke="url(#vs-limb)" stroke-width="14" opacity="${night ? 0.18 : 0.28}" filter="url(#vs-blur)"/>
  <g clip-path="url(#vs-planet)">
    <rect x="0" y="${top - 2}" width="${W}" height="${H - top + 2}" fill="${P.ocean}"/>
    <rect x="0" y="${top - 2}" width="${W}" height="30" fill="${P.ocean2}" opacity=".7" filter="url(#vs-blur)"/>
    <g class="sc-orbit"><g filter="url(#vs-soft)">${land}</g>${lights}<g filter="url(#vs-blur)">${clouds}</g></g>
    ${dusk ? `<rect x="0" y="${top - 2}" width="${W}" height="${H - top + 2}" fill="url(#vs-term)"/>` : ''}
    <rect x="0" y="${top - 2}" width="${W}" height="10" fill="${P.limb}" opacity="${night ? 0.06 : 0.14}" filter="url(#vs-blur)"/>
  </g>
  <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rad + 0.6)}" fill="none" stroke="url(#vs-limb)" stroke-width="${night ? 1 : 1.6}" opacity="${night ? 0.55 : 0.9}"/>
  ${body}
</svg>`;
}

function landscapeSvg(W, s, P, reduced) {
  if (s.terrain === 'vista') return vistaSvg(W, s, P);
  const R = rng(20261005 + (s.terrain === 'desert' ? 7 : 0));
  const night = s.time === 'night';
  // Sun / moon position: hour angle → x across the band, elevation → height.
  const ha = Math.max(-100, Math.min(100, s.sun.hourAngle));
  const bodyX = W * (0.5 + (ha / 100) * 0.38);
  let sunY;
  if (night) sunY = 46;
  else sunY = Math.max(52, Math.min(150, 150 - Math.max(0, s.sun.elevation) * 2.4));
  const bodyColor = night ? '#f2ecd8' : s.time === 'dusk' ? '#ffcf8a' : '#fff4d6';
  const glowOp = s.sky === 'overcast' || s.precip !== 'none' ? 0.18 : s.sky === 'fog' ? 0.25 : night ? 0.35 : 0.6;
  const showDisc = !(s.sky === 'overcast' || s.precip !== 'none');
  const moonX = night ? W * 0.72 : bodyX;

  let stars = '';
  if (night && s.sky !== 'overcast' && s.precip === 'none') {
    for (let i = 0; i < Math.round(W / 14); i++) {
      const x = R() * W, y = R() * 110, r = R() < 0.12 ? 1.1 : 0.55 + R() * 0.4;
      stars += `<circle class="${R() < 0.25 ? 'sc-tw' : ''}" style="animation-delay:${f1(R() * 6)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${R() < 0.2 ? '#f1d58e' : '#f3ecdc'}" opacity="${f1(0.4 + R() * 0.5)}"/>`;
    }
  }

  let far, mid, near, extras = '', fore = '', strata = '';
  // Swaying grass / trees go in three groups (3 CSS animations, not one per tuft).
  const sway = ['', '', ''], treeSway = ['', '', ''];
  if (s.terrain === 'desert') {
    far = mesaRange(W, R, 152, 96, 126, 80);
    mid = mesaRange(W, R, 170, 118, 146, 150);
    near = hills(W, R, 186, 14, 2.2);
    // Red-rock strata: pale bands clipped to the mid mesas
    for (let i = 0; i < 3; i++) strata += `<rect x="0" y="${130 + i * 9 + R() * 3}" width="${W}" height="${1.2 + R()}" fill="${P.strata}" opacity="${night ? 0.05 : 0.22}"/>`;
    // Sparse golden grass + sage/creosote shrubs + the odd yucca
    for (let i = 0; i < Math.round(W / 26); i++) {
      const x = R() * W, y = 186 + R() * 14;
      sway[i % 3] += tuft(x, y, 5 + R() * 7, P.grass, R);
    }
    for (let i = 0; i < Math.round(W / 120); i++) {
      const x = R() * W, y = 184 + R() * 12, r = 2.5 + R() * 3.5;
      fore += `<g fill="${P.shrub}" opacity=".9"><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.6)}" ry="${f1(r)}"/><ellipse cx="${f1(x + r)}" cy="${f1(y - r * 0.4)}" rx="${f1(r)}" ry="${f1(r * 0.8)}"/></g>`;
    }
    for (let i = 0; i < Math.max(1, Math.round(W / 700)); i++) {
      const x = W * (0.15 + 0.7 * R()), y = 188 + R() * 6;
      fore += `<g stroke="${mix(P.shrub, '#1b1a14', 0.35)}" stroke-linecap="round" fill="none" opacity=".85">
        <path d="M${f1(x)} ${f1(y)} v-18 M${f1(x)} ${f1(y - 12)} q-6 -2 -7 -10 M${f1(x)} ${f1(y - 15)} q5 -1 6 -8" stroke-width="2.2"/></g>
        <g fill="${mix(P.shrub, '#1b1a14', 0.2)}"><circle cx="${f1(x)}" cy="${f1(y - 19)}" r="2.6"/><circle cx="${f1(x - 7)}" cy="${f1(y - 22)}" r="2.3"/><circle cx="${f1(x + 6)}" cy="${f1(y - 23)}" r="2.2"/></g>`;
    }
  } else {
    far = hills(W, R, 152, 46, 1.6);
    mid = hills(W, R, 170, 26, 2.6);
    near = hills(W, R, 190, 14, 3.4);
    const crowns = P.tree;
    // Trees along the mid ridge
    for (let i = 0; i < Math.round(W / 55); i++) {
      const x = R() * W, y = 152 + R() * 22, sz = 5.5 + R() * 7;
      if (R() < 0.3 || !crowns) {
        if (!crowns && R() < 0.5) { // bare winter tree
          extras += `<g stroke="${P.trunk}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".85"><path d="M${f1(x)} ${f1(y)} v-${f1(sz * 2)} M${f1(x)} ${f1(y - sz)} l-${f1(sz * 0.8)} -${f1(sz * 0.9)} M${f1(x)} ${f1(y - sz * 1.3)} l${f1(sz * 0.7)} -${f1(sz * 0.8)} M${f1(x)} ${f1(y - sz * 1.7)} l-${f1(sz * 0.4)} -${f1(sz * 0.5)}"/></g>`;
        } else { // conifer
          extras += `<path d="M${f1(x)} ${f1(y - sz * 2.6)} L${f1(x + sz)} ${f1(y)} L${f1(x - sz)} ${f1(y)} Z" fill="${P.conifer}"/>`;
          if (s.season === 'winter' || s.precip === 'snow') extras += `<path d="M${f1(x)} ${f1(y - sz * 2.6)} L${f1(x + sz * 0.35)} ${f1(y - sz * 1.7)} L${f1(x - sz * 0.35)} ${f1(y - sz * 1.7)} Z" fill="#eef2f7" opacity=".85"/>`;
        }
      } else {
        const c = crowns[Math.floor(R() * crowns.length)];
        treeSway[i % 3] += `<g><rect x="${f1(x - 0.7)}" y="${f1(y - sz * 1.2)}" width="1.4" height="${f1(sz * 1.2)}" fill="${P.trunk}"/><circle cx="${f1(x)}" cy="${f1(y - sz * 1.5)}" r="${f1(sz)}" fill="${c}"/><circle cx="${f1(x - sz * 0.6)}" cy="${f1(y - sz * 1.1)}" r="${f1(sz * 0.7)}" fill="${c}"/><circle cx="${f1(x + sz * 0.6)}" cy="${f1(y - sz * 1.2)}" r="${f1(sz * 0.75)}" fill="${c}"/></g>`;
      }
    }
    for (let i = 0; i < Math.round(W / 18); i++) {
      const x = R() * W, y = 188 + R() * 12;
      sway[i % 3] += tuft(x, y, 4 + R() * 6, P.grass, R);
    }
    if (s.season === 'spring' && !night) for (let i = 0; i < Math.round(W / 40); i++) {
      fore += `<circle cx="${f1(R() * W)}" cy="${f1(188 + R() * 12)}" r="1.1" fill="${R() < 0.5 ? '#f6d2e0' : '#f7e8a8'}"/>`;
    }
  }

  extras += treeSway.map((g, k) => (g ? `<g class="sc-sway sc-s${k}">${g}</g>` : '')).join('');
  fore = sway.map((g, k) => (g ? `<g class="sc-sway sc-s${k}">${g}</g>` : '')).join('') + fore;
  const shimmer = s.heat && !reduced;
  const fogBand = s.sky === 'fog' ? `<rect x="0" y="110" width="${W}" height="90" fill="url(#sc-fog)"/>` : '';

  return `<svg class="sc-land" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${P.top}"/><stop offset=".55" stop-color="${P.sky}"/><stop offset=".9" stop-color="${P.hor}"/>
    </linearGradient>
    <radialGradient id="sc-glow"><stop offset="0" stop-color="${bodyColor}" stop-opacity="${glowOp}"/><stop offset="1" stop-color="${bodyColor}" stop-opacity="0"/></radialGradient>
    <linearGradient id="sc-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.hor}" stop-opacity="0"/><stop offset=".7" stop-color="${P.hor}" stop-opacity="${night ? 0.08 : 0.45}"/><stop offset="1" stop-color="${P.hor}" stop-opacity="0"/></linearGradient>
    <linearGradient id="sc-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.ground}"/><stop offset="1" stop-color="${P.ground2}"/></linearGradient>
    <linearGradient id="sc-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9d6cf" stop-opacity="0"/><stop offset=".6" stop-color="#d9d6cf" stop-opacity=".55"/><stop offset="1" stop-color="#d9d6cf" stop-opacity=".2"/></linearGradient>
    <linearGradient id="sc-midfill" gradientUnits="userSpaceOnUse" x1="0" y1="125" x2="0" y2="175"><stop offset=".55" stop-color="${P.mid}"/><stop offset="1" stop-color="${P.midShade || P.mid}"/></linearGradient>
    <clipPath id="sc-midclip"><path d="${mid}"/></clipPath>
    ${shimmer ? `<filter id="sc-shimmer" x="0" y="-10%" width="100%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="1" seed="4" result="n"><animate attributeName="baseFrequency" values="0.006 0.09;0.006 0.12;0.006 0.09" dur="7s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/></filter>` : ''}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sc-sky)"/>
  ${stars}
  <circle cx="${f1(night ? moonX : bodyX)}" cy="${f1(sunY)}" r="${night ? 34 : 60}" fill="url(#sc-glow)"/>
  ${showDisc ? (night
    ? `<circle cx="${f1(moonX)}" cy="${f1(sunY)}" r="7.5" fill="${bodyColor}" opacity=".92"/><circle cx="${f1(moonX + 3.2)}" cy="${f1(sunY - 1.5)}" r="6.6" fill="${P.top}" opacity=".9"/>`
    : `<circle cx="${f1(bodyX)}" cy="${f1(sunY)}" r="${s.time === 'dusk' ? 11 : 9}" fill="${bodyColor}" opacity="${s.sky === 'fog' ? 0.5 : 0.95}"/>`) : ''}
  <g ${shimmer ? 'filter="url(#sc-shimmer)"' : ''}>
    <path d="${far}" fill="${P.far}" opacity="${s.sky === 'fog' ? 0.55 : 0.92}"/>
    <rect x="0" y="118" width="${W}" height="44" fill="url(#sc-haze)"/>
  </g>
  <path d="${mid}" fill="url(#sc-midfill)"/>
  ${s.terrain === 'desert' && !night ? `<path d="${mid}" fill="none" stroke="${P.strata}" stroke-width=".8" opacity="${s.time === 'dusk' ? 0.5 : 0.35}"/>` : ''}
  ${strata ? `<g clip-path="url(#sc-midclip)">${strata}</g>` : ''}
  ${s.terrain === 'desert' && s.time !== 'night' ? `<rect x="0" y="150" width="${W}" height="24" fill="url(#sc-haze)" opacity=".7"/>` : ''}
  ${extras}
  <path d="${near}" fill="url(#sc-ground)"/>
  ${fogBand}
  ${fore}
</svg>`;
}

/* ---------------- particles (canvas) ---------------- */

function makeParticles(kind, w, h, s, R) {
  const area = (w * h) / 60000;
  const count = {
    dust: Math.round(12 * area), pollen: Math.round(14 * area), petals: Math.round(7 * area), leaves: Math.round(6 * area),
    fireflies: Math.round(9 * area), snow: Math.round((s.heavy ? 70 : 38) * area), rain: Math.round((s.heavy || s.precip === 'storm' ? 110 : 70) * area),
    drizzle: Math.round(45 * area)
  }[kind] || 0;
  const leafColors = ['#dd8a2e', '#c4502c', '#e9b44c', '#b8692a'];
  const out = [];
  for (let i = 0; i < Math.min(count, 260); i++) {
    out.push({
      x: R() * w, y: (kind === 'dust' || kind === 'pollen') ? h * (0.45 + R() * 0.55) : R() * h, z: 0.5 + R() * 0.5, ph: R() * Math.PI * 2, r: R(),
      c: kind === 'leaves' ? leafColors[Math.floor(R() * leafColors.length)] : null
    });
  }
  return out;
}

function drawParticles(ctx, kind, ps, w, h, t, dt, s) {
  ctx.clearRect(0, 0, w, h);
  const wind = Math.min(30, s.windMph || 0);
  const drift = 4 + wind * 0.9; // px/s sideways
  for (const p of ps) {
    switch (kind) {
      case 'dust': case 'pollen': {
        p.x += (drift * p.z) * dt; p.y += Math.sin(t * 0.5 + p.ph) * 3 * dt;
        const a = (kind === 'dust' ? 0.42 : 0.4) * p.z * (0.55 + 0.45 * Math.sin(t * 0.8 + p.ph));
        const rr = 1 + p.r * 1.6;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr * 1.8);
        const col = kind === 'dust' ? '255,228,170' : '240,245,210';
        g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr * 1.8, 0, 6.283); ctx.fill();
        break;
      }
      case 'snow': {
        p.y += (14 + 22 * p.z) * dt; p.x += (Math.sin(t * 0.7 + p.ph) * 8 + drift * 0.6) * dt;
        ctx.fillStyle = `rgba(245,248,255,${0.5 + 0.4 * p.z})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 0.8 + p.r * 1.6 * p.z, 0, 6.283); ctx.fill();
        break;
      }
      case 'rain': case 'drizzle': {
        const sp = kind === 'rain' ? 300 + 180 * p.z : 150 + 80 * p.z;
        const slant = 0.12 + wind * 0.012;
        p.y += sp * dt; p.x += sp * slant * dt;
        const len = kind === 'rain' ? 9 + 7 * p.z : 5 + 3 * p.z;
        ctx.strokeStyle = `rgba(205,218,238,${(kind === 'rain' ? 0.32 : 0.26) * p.z})`;
        ctx.lineWidth = kind === 'rain' ? 1 : 0.8;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - len * slant, p.y - len); ctx.stroke();
        break;
      }
      case 'petals': case 'leaves': {
        p.y += (10 + 10 * p.z) * dt; p.x += (drift * 1.4 + Math.sin(t * 0.9 + p.ph) * 10) * dt;
        const rot = t * (0.8 + p.r) + p.ph;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(rot); ctx.scale(1, Math.abs(Math.sin(rot * 0.7)) * 0.7 + 0.3);
        ctx.fillStyle = kind === 'petals' ? `rgba(246,200,220,${0.75 * p.z})` : p.c;
        ctx.globalAlpha = kind === 'leaves' ? 0.8 * p.z : 1;
        ctx.beginPath(); ctx.ellipse(0, 0, kind === 'petals' ? 2.4 : 3.2, kind === 'petals' ? 1.5 : 1.8, 0, 0, 6.283); ctx.fill();
        ctx.restore(); ctx.globalAlpha = 1;
        break;
      }
      case 'fireflies': {
        p.x += Math.sin(t * 0.3 + p.ph) * 6 * dt; p.y += Math.cos(t * 0.27 + p.ph * 1.3) * 4 * dt;
        const a = Math.max(0, Math.sin(t * 0.9 + p.ph * 3)) * 0.85;
        const yy = h * 0.55 + (p.y % (h * 0.45));
        const g = ctx.createRadialGradient(p.x, yy, 0, p.x, yy, 5);
        g.addColorStop(0, `rgba(230,255,150,${a})`); g.addColorStop(1, 'rgba(230,255,150,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, yy, 5, 0, 6.283); ctx.fill();
        break;
      }
    }
    // Seamless wrap
    if (p.x > w + 10) p.x -= w + 20; else if (p.x < -10) p.x += w + 20;
    if (p.y > h + 16) { p.y -= h + 32; } else if (p.y < -16) p.y += h + 32;
  }
}

/* ---------------- wiring ---------------- */

function sceneOverride() {
  try { return parse_scene_override(new URLSearchParams(location.search).get('scene')); } catch { return null; }
}

export function initScene() {
  const band = document.getElementById('scene-band');
  if (!band) return;
  const params = new URLSearchParams(location.search);
  if (params.get('scene') === 'off') { band.hidden = true; return; }

  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  let sky = globalThis.__mecSky || null;
  let scene = null, lastKey = '', lastW = 0, raf = 0, visible = true;
  let particles = [], ctx = null, canvas = null, lastT = 0;

  band.innerHTML = `
    <div class="sc-layer sc-land-wrap"></div>
    <div class="sc-layer sc-clouds"><div class="sc-track"></div></div>
    <div class="sc-layer sc-flash"></div>
    <canvas class="sc-layer sc-canvas" aria-hidden="true"></canvas>
    <div class="sc-layer sc-veil"></div>
    <div class="sc-caption"><span class="sc-dot" aria-hidden="true"></span><span class="sc-text"></span></div>`;
  const landWrap = band.querySelector('.sc-land-wrap');
  const track = band.querySelector('.sc-track');
  const caption = band.querySelector('.sc-text');
  canvas = band.querySelector('canvas');
  ctx = canvas.getContext && canvas.getContext('2d');

  function compute() {
    return pick_scene({
      weather: sky && sky.weather,
      lat: sky ? sky.lat : null,
      lon: sky ? sky.lon : null,
      date: new Date(),
      override: sceneOverride()
    });
  }

  function sizeCanvas() {
    if (!ctx) return { w: 0, h: 0 };
    const r = band.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: r.width, h: r.height };
  }

  function render(force = false) {
    scene = compute();
    const reduced = mq.matches;
    const rect = band.getBoundingClientRect();
    if (!rect.width) return;
    const W = Math.round(H * rect.width / Math.max(1, rect.height));
    const key = scene.key + '|' + reduced + '|' + Math.round(scene.sun.hourAngle / 4);
    if (!force && key === lastKey && Math.abs(W - lastW) < 8) return;
    lastKey = key; lastW = W;
    const P = palette(scene);
    landWrap.innerHTML = landscapeSvg(W, scene, P, reduced);
    const c = cloudsSvg(W, scene, P, 11);
    track.innerHTML = c + c.replace(/sc-soft11/g, 'sc-soft12'); // two identical halves → seamless loop
    band.dataset.scene = scene.key;
    band.dataset.time = scene.time;
    band.dataset.terrain = scene.terrain;
    band.classList.toggle('sc-storm', scene.lightning);
    band.classList.toggle('sc-reduced', reduced);
    band.style.setProperty('--sc-cloud-dur', `${Math.round(240 / (1 + (scene.windMph || 0) / 8))}s`);
    const where = sky && scene.hasPlace ? (sky.place || '').split(',')[0] : '';
    const st = scene.hasPlace ? sun_caption_times(sky) : null;
    caption.textContent = scene.label + (where ? ` · ${where}` : '');
    if (st) { // its own no-wrap span so the times drop to a second line together on narrow screens
      const sun = document.createElement('span');
      sun.className = 'sc-sun';
      sun.textContent = `· ☀︎ ${st.rise} · ☾ ${st.set}`;
      caption.append(' ', sun);
    }
    band.setAttribute('aria-label', `Ambient scene: ${scene.label}${where ? `, ${sky.place}` : ''}${st ? `. Sunrise ${st.rise}, sunset ${st.set}` : ''}`);
    band.title = scene.located ? `Ambient scene from ${sky.place} weather` : scene.hasPlace ? `Ambient seasonal scene for ${sky.place} (no weather reading yet)` : 'Earth vista (no location set, so no local weather)';

    const { w, h } = sizeCanvas();
    particles = scene.particles === 'none' ? [] : makeParticles(scene.particles, w, h, scene, rng(77));
    cancelAnimationFrame(raf); raf = 0;
    if (ctx) {
      if (reduced || !particles.length) {
        drawParticles(ctx, scene.particles, particles, w, h, 0, 0, scene); // still frame
      } else {
        lastT = 0; loop();
      }
    }
  }

  function loop(ts) {
    raf = 0;
    if (!visible || document.visibilityState === 'hidden' || mq.matches) return;
    const now = (ts || performance.now()) / 1000;
    const dt = lastT ? Math.min(0.1, now - lastT) : 0;
    if (!lastT || dt >= 1 / 32) { // ~30 fps is plenty for ambient motion
      const r = canvas.width / Math.min(2, window.devicePixelRatio || 1);
      drawParticles(ctx, scene.particles, particles, r, canvas.height / Math.min(2, window.devicePixelRatio || 1), now, dt, scene);
      lastT = now;
    }
    raf = requestAnimationFrame(loop);
  }
  function resume() { if (!raf && particles.length && !mq.matches && visible && document.visibilityState !== 'hidden') { lastT = 0; raf = requestAnimationFrame(loop); } }

  window.addEventListener('mec:sky', (e) => { sky = e.detail; render(); });
  let rt = 0;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => render(), 150); };
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { render(); resume(); } });
  mq.addEventListener?.('change', () => render(true));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; if (visible) resume(); }).observe(band);
  }
  // Re-check every 5 minutes so golden hour / night arrive on time.
  setInterval(() => render(), 5 * 60 * 1000);
  // The calendar panel may be hidden at load (another tab); render when it becomes visible.
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(band);
  render(true);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const start = () => { try { initScene(); } catch (e) { console.warn('Ambient scene unavailable', e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}
