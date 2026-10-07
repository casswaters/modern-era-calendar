/**
 * MEC: Local sky (location + weather) helpers.
 * Weather: Open-Meteo (free, no API key, CORS-enabled).
 * Fallback weather: wttr.in JSON (free, no key, CORS) if Open-Meteo is down or rate-limited.
 * Place names: BigDataCloud client reverse geocode (free, no key), Nominatim, then wttr.in nearest area.
 * Home location (v42): typed in Profile, looked up with Open-Meteo geocoding (free, no key, CORS).
 * Pure helpers are exported for tests; the DOM wiring lives in initSky().
 *
 * v42: there is no built-in default place. Order: this device's location (when shared), then the
 * Profile home location, then none. With none, no weather is fetched or shown: the scene paints a
 * neutral earth vista and the strip asks for a location. Weather is never invented.
 */

export const HOME_KEY = 'mec-log-home';   // JSON { q, name, lat, lon } from Profile
export const NO_PLACE = 'No location set';
export const SET_HINT = 'Set a location for local weather';

const STORE_KEY = 'mec-sky-v1';
const OPTIN_KEY = 'mec-geo-optin';
const MAX_AGE_MS = 30 * 60 * 1000; // refresh weather every 30 min

/** WMO weather interpretation codes → [label, day icon, night icon]. */
const WMO = {
  0: ['Clear', '☀️', '🌙'],
  1: ['Mostly clear', '🌤️', '🌙'],
  2: ['Partly cloudy', '⛅', '☁️'],
  3: ['Overcast', '☁️', '☁️'],
  45: ['Fog', '🌫️', '🌫️'],
  48: ['Freezing fog', '🌫️', '🌫️'],
  51: ['Light drizzle', '🌦️', '🌧️'],
  53: ['Drizzle', '🌦️', '🌧️'],
  55: ['Heavy drizzle', '🌧️', '🌧️'],
  56: ['Freezing drizzle', '🌧️', '🌧️'],
  57: ['Freezing drizzle', '🌧️', '🌧️'],
  61: ['Light rain', '🌦️', '🌧️'],
  63: ['Rain', '🌧️', '🌧️'],
  65: ['Heavy rain', '🌧️', '🌧️'],
  66: ['Freezing rain', '🌧️', '🌧️'],
  67: ['Freezing rain', '🌧️', '🌧️'],
  71: ['Light snow', '🌨️', '🌨️'],
  73: ['Snow', '🌨️', '🌨️'],
  75: ['Heavy snow', '❄️', '❄️'],
  77: ['Snow grains', '🌨️', '🌨️'],
  80: ['Rain showers', '🌦️', '🌧️'],
  81: ['Rain showers', '🌧️', '🌧️'],
  82: ['Violent showers', '⛈️', '⛈️'],
  85: ['Snow showers', '🌨️', '🌨️'],
  86: ['Heavy snow showers', '❄️', '❄️'],
  95: ['Thunderstorm', '⛈️', '⛈️'],
  96: ['Thunderstorm, hail', '⛈️', '⛈️'],
  99: ['Thunderstorm, hail', '⛈️', '⛈️']
};

export function weather_label(code, isDay = true) {
  const w = WMO[code];
  if (!w) return { label: 'Weather', icon: '✦' };
  return { label: w[0], icon: isDay ? w[1] : w[2] };
}

export function open_meteo_url(lat, lon) {
  const p = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,apparent_temperature,weather_code,is_day,cloud_cover,precipitation,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,sunrise,sunset',
    temperature_unit: 'fahrenheit',
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '1'
  });
  return `https://api.open-meteo.com/v1/forecast?${p.toString()}`;
}

/** Normalize an Open-Meteo forecast response into a small reading object. */
export function parse_open_meteo(json) {
  const c = json && json.current;
  if (!c || typeof c.temperature_2m !== 'number') throw new Error('No current weather');
  const d = json.daily || {};
  const { label, icon } = weather_label(c.weather_code, c.is_day !== 0);
  return {
    tempF: Math.round(c.temperature_2m),
    feelsF: typeof c.apparent_temperature === 'number' ? Math.round(c.apparent_temperature) : null,
    hiF: Array.isArray(d.temperature_2m_max) ? Math.round(d.temperature_2m_max[0]) : null,
    loF: Array.isArray(d.temperature_2m_min) ? Math.round(d.temperature_2m_min[0]) : null,
    code: c.weather_code,
    label,
    icon,
    // Extra fields for the ambient scene (scene.js). Older cached readings may lack them.
    isDay: c.is_day !== 0,
    cloud: typeof c.cloud_cover === 'number' ? Math.round(c.cloud_cover) : null,
    precipIn: typeof c.precipitation === 'number' ? c.precipitation : null,
    windMph: typeof c.wind_speed_10m === 'number' ? Math.round(c.wind_speed_10m) : null,
    // Place-local ISO strings (no offset) from timezone=auto, e.g. "2026-10-05T07:16".
    sunrise: Array.isArray(d.sunrise) && typeof d.sunrise[0] === 'string' ? d.sunrise[0] : null,
    sunset: Array.isArray(d.sunset) && typeof d.sunset[0] === 'string' ? d.sunset[0] : null
  };
}

/** wttr.in (WorldWeatherOnline) condition code → icon. */
function wttr_icon(code, isDay) {
  const c = Number(code);
  if (c === 113) return isDay ? '☀️' : '🌙';
  if (c === 116) return isDay ? '⛅' : '☁️';
  if (c === 119 || c === 122) return '☁️';
  if ([143, 248, 260].includes(c)) return '🌫️';
  if ([200, 386, 389, 392, 395].includes(c)) return '⛈️';
  if ([179, 227, 230, 323, 326, 329, 332, 335, 338, 368, 371].includes(c)) return '🌨️';
  if ([176, 263, 266, 353].includes(c)) return isDay ? '🌦️' : '🌧️';
  return '🌧️';
}

export function wttr_url(lat, lon) {
  return `https://wttr.in/${lat.toFixed(4)},${lon.toFixed(4)}?format=j1`;
}

/** Normalize a wttr.in ?format=j1 response. `hour` = local hour for day/night icon. */
export function parse_wttr(json, hour = new Date().getHours()) {
  const c = json && json.current_condition && json.current_condition[0];
  if (!c || c.temp_F == null) throw new Error('No current weather');
  const day = json.weather && json.weather[0];
  const isDay = hour >= 6 && hour < 19;
  const desc = (c.weatherDesc && c.weatherDesc[0] && c.weatherDesc[0].value || 'Weather').trim();
  const label = /^sunny$/i.test(desc) && !isDay ? 'Clear' : desc.charAt(0).toUpperCase() + desc.slice(1).toLowerCase();
  const num = (v) => (v == null || v === '' || isNaN(+v) ? null : Math.round(+v));
  return {
    tempF: num(c.temp_F),
    feelsF: num(c.FeelsLikeF),
    hiF: day ? num(day.maxtempF) : null,
    loF: day ? num(day.mintempF) : null,
    code: Number(c.weatherCode),
    label,
    icon: wttr_icon(c.weatherCode, isDay),
    isDay,
    cloud: num(c.cloudcover),
    precipIn: c.precipInches == null || c.precipInches === '' || isNaN(+c.precipInches) ? null : +c.precipInches,
    windMph: num(c.windspeedMiles)
  };
}

export function place_from_wttr(json) {
  const a = json && json.nearest_area && json.nearest_area[0];
  if (!a) return '';
  const v = (k) => (a[k] && a[k][0] && a[k][0].value) || '';
  const country = v('country');
  const cc = /united states/i.test(country) ? 'US' : '';
  return format_place({ city: v('areaName').replace(/^Saint /, 'St. '), region: v('region'), country, countryCode: cc });
}

const US_STATES = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO',
  Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY',
  Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH',
  'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY',
  'Puerto Rico': 'PR'
};

/** "City, ST" for the US, "City, Region" or "City, Country" elsewhere. */
export function format_place({ city, region, country, countryCode } = {}) {
  const cc = (countryCode || '').toUpperCase();
  if (!city && !region) return country || '';
  if (cc === 'US') {
    const st = US_STATES[region] || region;
    return city ? (st ? `${city}, ${st}` : city) : st;
  }
  if (city && region && region !== city) return `${city}, ${region}`;
  if (city && country) return `${city}, ${country}`;
  return city || region || country || '';
}

export function place_from_bigdatacloud(j) {
  return format_place({
    city: j.city || j.locality,
    region: j.principalSubdivision,
    country: j.countryName,
    countryCode: j.countryCode
  });
}

export function place_from_nominatim(j) {
  const a = (j && j.address) || {};
  return format_place({
    city: a.city || a.town || a.village || a.hamlet || a.suburb || a.county,
    region: a.state,
    country: a.country,
    countryCode: a.country_code
  });
}

/* ---------------- home location (v42) ---------------- */

export function geocode_url(name, count = 10) {
  const p = new URLSearchParams({ name: String(name || '').trim(), count: String(count), language: 'en', format: 'json' });
  return `https://geocoding-api.open-meteo.com/v1/search?${p.toString()}`;
}

const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Best Open-Meteo geocoding result for a typed query such as "Denver", "Portland, Maine",
 * "Portland, OR" or "York, UK". Qualifiers after the first comma must match the region,
 * state abbreviation, country or country code. Populated places beat parks and peaks.
 * Returns { name, lat, lon } or null.
 */
export function pick_geocode(json, query) {
  const list = (json && Array.isArray(json.results) ? json.results : []).filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number');
  if (!list.length) return null;
  const quals = String(query || '').split(',').slice(1).map(norm).filter(Boolean);
  const abbr = (r) => (String(r.country_code || '').toUpperCase() === 'US' ? US_STATES[r.admin1] || '' : '');
  const matches = (r) => quals.every((q) => [r.admin1, r.admin2, r.country, r.country_code, abbr(r), r.country_code === 'GB' ? 'uk' : '', r.country_code === 'US' ? 'usa' : ''].map(norm).some((v) => v && (v === q || (q.length > 3 && v.startsWith(q)))));
  const pool = quals.length ? list.filter(matches) : list;
  if (!pool.length) return null;
  const score = (r) => (/^PPL/.test(r.feature_code || '') ? 2e9 : 0) + (r.population || 0);
  const best = pool.slice().sort((a, b) => score(b) - score(a))[0];
  const name = format_place({ city: best.name, region: best.admin1, country: best.country, countryCode: best.country_code }) || best.name;
  return { name, lat: Math.round(best.latitude * 1e4) / 1e4, lon: Math.round(best.longitude * 1e4) / 1e4 };
}

/** Look up a typed place. Resolves { q, name, lat, lon } or null (not found). Throws on network errors. */
export async function geocode_place(query) {
  const q = String(query || '').replace(/[\u0000-\u001f<>{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!q) return null;
  const first = q.split(',')[0].trim();
  const hit = pick_geocode(await fetchJson(geocode_url(first || q)), q);
  return hit ? { q, ...hit } : null;
}

/** Validates a stored home location (JSON string or object). */
export function parse_home(raw) {
  let h = raw;
  if (typeof raw === 'string') { try { h = JSON.parse(raw); } catch { return null; } }
  if (!h || typeof h !== 'object') return null;
  const lat = Number(h.lat), lon = Number(h.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const name = String(h.name || '').replace(/[\u0000-\u001f<>{}]/g, '').trim().slice(0, 80);
  return { q: String(h.q || name).slice(0, 80), name: name || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, lat, lon };
}

export function read_home() {
  try { return parse_home(localStorage.getItem(HOME_KEY)); } catch { return null; }
}

/**
 * Starting sky state from the cached state and the home location (pure, for tests).
 * A shared device location is kept; anything else follows the home location, or none.
 * Pre-v42 caches of the old built-in default ("fallback") are dropped.
 */
export function sky_state_for(cached, home) {
  const c = cached && typeof cached === 'object' ? cached : null;
  if (c && c.source === 'device' && Number.isFinite(c.lat) && Number.isFinite(c.lon)) return c;
  if (home) {
    const same = c && c.source === 'home' && Math.abs(c.lat - home.lat) < 0.01 && Math.abs(c.lon - home.lon) < 0.01;
    return { place: home.name, lat: home.lat, lon: home.lon, source: 'home', weather: same ? c.weather || null : null, fetchedAt: same ? c.fetchedAt || 0 : 0 };
  }
  return { place: '', lat: null, lon: null, source: 'none', weather: null, fetchedAt: 0 };
}

async function fetchJson(url, timeoutMs = 8000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, { signal: ctrl?.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    if (t) clearTimeout(t);
  }
}

export async function reverse_geocode(lat, lon) {
  try {
    const j = await fetchJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    const name = place_from_bigdatacloud(j);
    if (name) return name;
  } catch { /* fall through */ }
  try {
    const j = await fetchJson(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lat}&lon=${lon}`);
    const name = place_from_nominatim(j);
    if (name) return name;
  } catch { /* fall through */ }
  try {
    const name = place_from_wttr(await fetchJson(wttr_url(lat, lon)));
    if (name) return name;
  } catch { /* fall through */ }
  return null;
}

/** Open-Meteo first; wttr.in if Open-Meteo errors or rate-limits. */
export async function fetch_weather(lat, lon) {
  try {
    return parse_open_meteo(await fetchJson(open_meteo_url(lat, lon)));
  } catch (e) {
    return parse_wttr(await fetchJson(wttr_url(lat, lon), 10000));
  }
}

/* ---------------- DOM wiring ---------------- */

/**
 * Share the current sky state (place + coords + latest reading) with other modules. The ambient
 * scene (scene.js) listens for this instead of fetching weather a second time. The last state is
 * also parked on globalThis so a listener that loads later can pick it up immediately.
 */
function emitSky(state) {
  const detail = {
    place: state.source === 'none' ? '' : state.place || '',
    lat: state.source === 'none' ? null : state.lat, lon: state.source === 'none' ? null : state.lon,
    source: state.source || 'none',
    weather: state.weather || null,
    fetchedAt: state.fetchedAt || 0,
    sunrise: (state.weather && state.weather.sunrise) || null,
    sunset: (state.weather && state.weather.sunset) || null
  };
  try {
    globalThis.__mecSky = detail;
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('mec:sky', { detail }));
    }
  } catch { /* ignore */ }
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
}
function save(obj) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch { /* ignore */ }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 15 * 60 * 1000 }
    );
  });
}

async function permissionState() {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const s = await navigator.permissions.query({ name: 'geolocation' });
    return s.state; // granted | prompt | denied
  } catch { return 'unknown'; }
}

function moved(a, b) {
  if (!a || !b) return true;
  return Math.abs(a.lat - b.lat) > 0.05 || Math.abs(a.lon - b.lon) > 0.05; // ~5 km
}

export function initSky() {
  const el = {
    icon: document.getElementById('sky-icon'),
    place: document.getElementById('sky-place'),
    cond: document.getElementById('sky-cond'),
    hilo: document.getElementById('sky-hilo'),
    temp: document.getElementById('sky-temp'),
    btn: document.getElementById('sky-locate'),
    set: document.getElementById('sky-set')
  };
  if (!el.place) return;

  let state = sky_state_for(load(), read_home());
  save(state);
  const noPlace = () => state.source === 'none';
  /** Back to the home location (or none) when the device location is not in use. */
  function fromHome() { state = sky_state_for(state.source === 'device' ? null : state, read_home()); save(state); }

  function setPlace(name, note) {
    el.place.innerHTML = '';
    const pin = document.createElement('span');
    pin.className = 'pin'; pin.setAttribute('aria-hidden', 'true');
    pin.textContent = state.source === 'device' ? '⌖' : '◈';
    el.place.append(pin, document.createTextNode(name));
    el.place.title = note || name;
  }

  function paint(note = '') {
    if (el.set) el.set.hidden = !noPlace();
    if (noPlace()) { // no place: no numbers, just a gentle prompt
      setPlace(NO_PLACE, note || SET_HINT);
      el.icon.textContent = '✦';
      el.temp.textContent = ''; el.temp.hidden = true;
      el.cond.textContent = '';
      el.cond.hidden = true;
      el.hilo.textContent = '';
      emitSky(state);
      return;
    }
    el.cond.hidden = false;
    setPlace(state.place || NO_PLACE, note);
    const w = state.weather;
    el.temp.hidden = !w;
    if (w) {
      el.icon.textContent = w.icon;
      el.temp.textContent = `${w.tempF}°F`;
      el.cond.textContent = w.label + (note ? ` · ${note}` : '');
      const bits = [];
      if (w.hiF != null && w.loF != null) bits.push(`H ${w.hiF}° · L ${w.loF}°`);
      if (w.feelsF != null && Math.abs(w.feelsF - w.tempF) >= 3) bits.push(`feels ${w.feelsF}°`);
      el.hilo.textContent = bits.join(' · ');
    } else {
      el.icon.textContent = '✦';
      el.temp.textContent = '';
      el.cond.textContent = note || 'Weather unavailable';
      el.hilo.textContent = '';
    }
    emitSky(state);
  }

  async function refreshWeather(force = false) {
    if (noPlace()) { paint(); return; } // nothing to look up
    const fresh = state.weather && state.fetchedAt && (Date.now() - state.fetchedAt < MAX_AGE_MS);
    if (fresh && !force) { paint(); return; }
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      paint(state.weather ? 'offline · last reading' : 'Offline');
      return;
    }
    try {
      state.weather = await fetch_weather(state.lat, state.lon);
      state.fetchedAt = Date.now();
      save(state);
      paint();
    } catch {
      paint(state.weather ? 'last reading' : 'Weather unavailable');
    }
  }

  async function useDevice({ fromTap = false } = {}) {
    if (fromTap) { el.cond.hidden = false; el.cond.textContent = 'Locating…'; if (el.set) el.set.hidden = true; }
    try {
      const pos = await getPosition();
      try { localStorage.setItem(OPTIN_KEY, '1'); } catch { /* ignore */ }
      el.btn.hidden = true;
      const changed = moved(pos, state) || state.source !== 'device';
      state.lat = pos.lat; state.lon = pos.lon; state.source = 'device';
      if (changed || !state.place) {
        const name = await reverse_geocode(pos.lat, pos.lon);
        state.place = name || `${pos.lat.toFixed(2)}°, ${pos.lon.toFixed(2)}°`;
      }
      save(state);
      await refreshWeather(changed);
    } catch (err) {
      // Denied, timed out or unsupported: the home location from Profile, else no place (no weather shown)
      const denied = err && err.code === 1;
      if (denied) {
        try { localStorage.removeItem(OPTIN_KEY); } catch { /* ignore */ }
        el.btn.hidden = true;
        if (state.source === 'device') fromHome();
      } else {
        el.btn.hidden = false;
      }
      await refreshWeather(false);
      if (fromTap) window.dispatchEvent(new CustomEvent('mec:locate-result', { detail: { ok: false, denied } }));
      if (denied) el.place.title = noPlace()
        ? 'Location permission denied. Enable location for this site in your browser settings, or set a home location in Profile.'
        : `Location permission denied. Showing your home location, ${state.place}.`;
    }
  }

  el.btn?.addEventListener('click', () => useDevice({ fromTap: true }));
  // Profile asks to use this device's location, or saved / cleared the home location.
  window.addEventListener('mec:locate', () => useDevice({ fromTap: true }));
  const homeChanged = () => { if (state.source !== 'device') { fromHome(); refreshWeather(true); } };
  window.addEventListener('mec:home', homeChanged);
  window.addEventListener('storage', (e) => { if (e.key === HOME_KEY || e.key === null) homeChanged(); });

  // First paint from cache (or the no-place prompt) immediately, then refresh.
  paint();
  (async () => {
    const perm = await permissionState();
    const optedIn = (() => { try { return localStorage.getItem(OPTIN_KEY) === '1'; } catch { return false; } })();
    if (perm === 'granted' || (optedIn && perm !== 'denied')) {
      await useDevice();
    } else {
      if (perm === 'denied' && state.source === 'device') fromHome();
      el.btn.hidden = perm === 'denied' || !('geolocation' in navigator);
      await refreshWeather(false);
    }
  })();

  // Keep it current while the app stays open / when it comes back to the foreground.
  setInterval(() => refreshWeather(false), MAX_AGE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshWeather(false);
  });
  window.addEventListener('online', () => refreshWeather(true));
}
