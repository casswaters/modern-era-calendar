/**
 * Aretoria v1 — hand-built SVG art: seven realm environments, the Axial hub backdrop,
 * advisor figures and gate glyphs. Pure string builders (no DOM access).
 * Scene layers share viewBox 0 0 1600 900 and are laid out with "xMidYMax slice",
 * so the temple stays centred on phones and desktops alike.
 */

/* ---------- small utilities ---------- */
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const W = 1600, H = 900;

function lg(id, stops, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">` +
    stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('') + `</linearGradient>`;
}
function rg(id, stops, cx = 0.5, cy = 0.5, r = 0.5) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` +
    stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('') + `</radialGradient>`;
}

/** Marble / gold gradients shared by architecture. */
function archDefs(p) {
  return lg(`${p}-marble`, [[0, '#fffdf7'], [0.55, '#e4ddd0'], [1, '#b7ae9f']]) +
    lg(`${p}-colH`, [[0, '#a99f90'], [0.3, '#f4efe4'], [0.55, '#fffdf8'], [1, '#b3a999']], 1, 0) +
    lg(`${p}-gold`, [[0, '#fff1c1'], [0.45, '#e3bf6c'], [1, '#9c7330']]) +
    lg(`${p}-goldH`, [[0, '#9c7330'], [0.4, '#f6dc94'], [0.6, '#fff1c1'], [1, '#a57b34']], 1, 0) +
    rg(`${p}-glow`, [[0, '#fff8e6', 0.9], [0.4, '#fff1c1', 0.35], [1, '#fff1c1', 0]]);
}

function ridge(rand, x0, x1, baseY, amp, step, jag = 0.5) {
  let d = `M${x0} ${H} L${x0} ${f(baseY - rand() * amp)}`;
  for (let x = x0 + step; x <= x1 + step; x += step) {
    const y = baseY - (rand() * amp) * (jag + (1 - jag) * Math.sin((x / W) * Math.PI * 2 + rand()));
    d += ` L${f(x + (rand() - 0.5) * step * 0.4)} ${f(Math.min(baseY + 10, y))}`;
  }
  return d + ` L${x1 + step} ${H} Z`;
}
function hills(rand, baseY, amp, waves, x0 = -100, x1 = 1700) {
  const n = waves * 2;
  let d = `M${x0} ${H} L${x0} ${baseY}`;
  const seg = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const xa = x0 + seg * i, xb = xa + seg;
    const peak = baseY - amp * (0.4 + rand() * 0.6) * (i % 2 ? 0.5 : 1);
    d += ` Q${f(xa + seg / 2)} ${f(peak)} ${f(xb)} ${f(baseY - amp * 0.2 * rand())}`;
  }
  return d + ` L${x1} ${H} Z`;
}
function stars(rand, n, x0, x1, y0, y1, color = '#fff', maxR = 1.6, cls = '') {
  let s = `<g class="${cls}">`;
  for (let i = 0; i < n; i++) {
    const r = 0.3 + rand() * maxR;
    s += `<circle cx="${f(x0 + rand() * (x1 - x0))}" cy="${f(y0 + rand() * (y1 - y0))}" r="${f(r)}" fill="${color}" opacity="${f(0.35 + rand() * 0.65)}"/>`;
  }
  return s + '</g>';
}
function column(x, yTop, yBot, w, p, fill) {
  const cap = w * 0.32;
  return `<rect x="${f(x - w / 2)}" y="${f(yTop + 8)}" width="${f(w)}" height="${f(yBot - yTop - 16)}" fill="${fill || `url(#${p}-colH)`}"/>` +
    `<rect x="${f(x - w / 2 - cap)}" y="${f(yTop)}" width="${f(w + cap * 2)}" height="9" fill="url(#${p}-marble)"/>` +
    `<rect x="${f(x - w / 2 - cap)}" y="${f(yBot - 9)}" width="${f(w + cap * 2)}" height="9" fill="url(#${p}-marble)"/>` +
    `<line x1="${f(x - w * 0.18)}" y1="${f(yTop + 10)}" x2="${f(x - w * 0.18)}" y2="${f(yBot - 10)}" stroke="#000" stroke-opacity=".08" stroke-width="${f(w * 0.08)}"/>` +
    `<line x1="${f(x + w * 0.2)}" y1="${f(yTop + 10)}" x2="${f(x + w * 0.2)}" y2="${f(yBot - 10)}" stroke="#000" stroke-opacity=".06" stroke-width="${f(w * 0.06)}"/>`;
}
function colonnade(x0, x1, n, yTop, yBot, w, p, fill) {
  let s = '';
  for (let i = 0; i < n; i++) s += column(x0 + ((x1 - x0) * i) / (n - 1), yTop, yBot, w, p, fill);
  return s;
}
function steps(cx, y, w, n, h, p, shrink = 18, fill) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const ww = w - i * shrink * 2;
    s += `<rect x="${f(cx - ww / 2)}" y="${f(y - (i + 1) * h)}" width="${f(ww)}" height="${f(h)}" fill="${fill || `url(#${p}-marble)`}"/>` +
      `<rect x="${f(cx - ww / 2)}" y="${f(y - (i + 1) * h)}" width="${f(ww)}" height="1.5" fill="#fff" opacity="${fill ? 0.15 : 0.6}"/>`;
  }
  return s;
}
function domeShape(cx, yBase, rx, ry, fill, extra = '') {
  return `<path d="M${cx - rx} ${yBase} A${rx} ${ry} 0 0 1 ${cx + rx} ${yBase} Z" fill="${fill}" ${extra}/>`;
}
function rotunda(cx, yBase, r, h, p, opts = {}) { // small domed temple
  const cols = opts.cols || 6;
  let s = `<rect x="${cx - r - 8}" y="${yBase - 10}" width="${(r + 8) * 2}" height="10" fill="url(#${p}-marble)"/>`;
  s += colonnade(cx - r + 6, cx + r - 6, cols, yBase - 10 - h, yBase - 10, Math.max(4, r * 0.11), p);
  s += `<rect x="${cx - r - 6}" y="${yBase - 22 - h}" width="${(r + 6) * 2}" height="12" fill="url(#${p}-marble)"/>`;
  s += domeShape(cx, yBase - 22 - h, r, r * 0.9, opts.domeFill || `url(#${p}-gold)`);
  s += `<rect x="${cx - 2}" y="${yBase - 22 - h - r * 0.9 - 16}" width="4" height="18" fill="url(#${p}-gold)"/>`;
  return s;
}
function cloudBank(rand, y, n, color, op, rMin, rMax, x0 = -100, x1 = 1700) {
  let s = `<g fill="${color}" opacity="${op}">`;
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * i) / (n - 1) + (rand() - 0.5) * 60;
    const r = rMin + rand() * (rMax - rMin);
    s += `<circle cx="${f(x)}" cy="${f(y + rand() * 30)}" r="${f(r)}"/>`;
  }
  return s + `<rect x="${x0}" y="${y + 10}" width="${x1 - x0}" height="${H - y}"/></g>`;
}
function floatingIsland(cx, cy, w, p, rand, rockA = '#3a3550', rockB = '#14121f') {
  const id = `${p}-rock${Math.round(cx)}`;
  let d = `M${cx - w / 2} ${cy}`;
  const n = 7;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = cx - w / 2 + w * t;
    const y = cy + (Math.sin(t * Math.PI) * w * 0.55) * (0.7 + rand() * 0.5);
    d += ` L${f(x)} ${f(y)}`;
  }
  d += ` L${cx + w / 2} ${cy} Z`;
  return `<defs>${lg(id, [[0, rockA], [1, rockB]])}</defs><path d="${d}" fill="url(#${id})"/>` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${w * 0.06}" fill="url(#${p}-marble)"/>`;
}

const svg = (inner, cls, par = 'xMidYMax slice') =>
  `<svg class="${cls}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false">${inner}</svg>`;

/* ========================================================================== */
/* Realm scenes                                                               */
/* Each returns { sky: css background, layers: [{ depth, html }], fog: css }   */
/* ========================================================================== */

function sceneWisdom() {
  const p = 'wis', r = rng(11);
  const sky = 'radial-gradient(60% 40% at 50% 30%, rgba(160,200,255,.28), transparent 70%), linear-gradient(180deg, #050920 0%, #0f1a45 32%, #1d3a74 58%, #4a79b0 74%, #16244a 100%)';
  const back = `<defs>${rg(`${p}-moon`, [[0, '#f4f7ff'], [0.6, '#cfdcff', 0.6], [1, '#cfdcff', 0]])}
    ${lg(`${p}-aur`, [[0, '#ff8fa3', 0], [0.2, '#ffd27a', .35], [0.4, '#9ef0c8', .35], [0.6, '#7fb8ff', .4], [0.8, '#c9a7f0', .35], [1, '#c9a7f0', 0]], 1, 0)}</defs>
    ${stars(r, 160, 0, W, 0, 520, '#eaf1ff', 1.5, 'ar-twinkle')}
    <circle cx="1250" cy="150" r="90" fill="url(#${p}-moon)" opacity=".7"/>
    <circle cx="1250" cy="150" r="34" fill="#f2f5ff"/><circle cx="1266" cy="140" r="32" fill="#16244f" opacity=".9"/>
    <g class="ar-aurora"><path d="M-50 260 C300 160 600 330 900 220 S1400 160 1700 250 L1700 330 C1400 240 1150 300 900 300 S300 250 -50 340 Z" fill="url(#${p}-aur)" opacity=".55"/></g>`;
  let forest = `<path d="${ridge(r, -100, 1700, 640, 70, 90, 0.7)}" fill="#14234a"/>`;
  for (let i = 0; i < 30; i++) {
    const x = -60 + i * 58 + r() * 30, y = 610 + r() * 40, s = 40 + r() * 46;
    if (x > 600 && x < 1000) continue;
    forest += `<rect x="${f(x - 3)}" y="${f(y)}" width="6" height="${f(s)}" fill="#0b1430"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.55)}" ry="${f(s * 0.45)}" fill="#122d5a"/>` +
      `<circle cx="${f(x - s * 0.15)}" cy="${f(y - s * 0.1)}" r="2.2" fill="#bfe3ff" class="ar-twinkle"/><circle cx="${f(x + s * 0.2)}" cy="${f(y + 4)}" r="1.6" fill="#ffe9a8"/>`;
  }
  forest += `<rect x="-100" y="700" width="1800" height="200" fill="#0c1735"/>`;
  let libs = '';
  [[330, 360, 140], [1300, 330, 160], [1080, 470, 90]].forEach(([x, y, w], i) => {
    libs += `<g class="ar-bob" style="animation-delay:${-i * 2.1}s">${floatingIsland(x, y, w, p, r, '#2a3a6a', '#0b1230')}` +
      rotunda(x, y, w * 0.26, w * 0.22, p, { cols: 4, domeFill: '#9fc4ff' }) +
      `<rect x="${x - w * 0.34}" y="${y - 22}" width="${w * 0.12}" height="18" fill="#7a5a3a"/><rect x="${x - w * 0.34}" y="${y - 24}" width="${w * 0.12}" height="3" fill="url(#${p}-gold)"/>` +
      `<circle cx="${x}" cy="${y - w * 0.2}" r="${w * 0.5}" fill="url(#${p}-glow)" opacity=".25"/></g>`;
  });
  const cx = 800, base = 760, top = 150;
  const prism = `<defs>
      ${lg(`${p}-pl`, [[0, '#e9f4ff', .95], [0.5, '#9cc8ff', .7], [1, '#3e6fb8', .6]])}
      ${lg(`${p}-pc`, [[0, '#ffffff', .98], [0.5, '#d8ecff', .85], [1, '#8fb8f0', .7]])}
      ${lg(`${p}-pr`, [[0, '#f1e6ff', .9], [0.5, '#c3a9f2', .65], [1, '#6f58b0', .6]])}
      ${lg(`${p}-beam`, [[0, '#ffffff', 0], [1, '#ffffff', .5]])}
      ${archDefs(p)}</defs>
    <circle cx="${cx}" cy="420" r="380" fill="url(#${p}-glow)" opacity=".35"/>
    <g class="ar-refract" style="transform-origin:${cx}px 230px">
      ${['#ff6b6b', '#ffb056', '#ffe27a', '#7fe0a0', '#6fb8ff', '#b48cff'].map((c, i) =>
        `<path d="M${cx} 230 L1600 ${f(60 + i * 70)} L1600 ${f(110 + i * 70)} Z" fill="${c}" opacity=".16"/>` +
        `<path d="M${cx} 250 L0 ${f(380 + i * 55)} L0 ${f(420 + i * 55)} Z" fill="${c}" opacity=".08"/>`).join('')}
    </g>
    <rect x="${cx - 3}" y="0" width="6" height="${top + 20}" fill="url(#${p}-beam)" opacity=".8"/>
    ${steps(cx, base, 420, 4, 14, p, 22)}
    <rect x="${cx - 150}" y="${base - 74}" width="300" height="18" fill="url(#${p}-gold)"/>
    <polygon points="${cx - 96},${base - 74} ${cx - 60},${top + 90} ${cx},${top} ${cx},${base - 74}" fill="url(#${p}-pl)"/>
    <polygon points="${cx},${base - 74} ${cx},${top} ${cx + 60},${top + 90} ${cx + 96},${base - 74}" fill="url(#${p}-pr)"/>
    <polygon points="${cx - 38},${base - 74} ${cx - 24},${top + 110} ${cx},${top + 30} ${cx + 24},${top + 110} ${cx + 38},${base - 74}" fill="url(#${p}-pc)" opacity=".75"/>
    <path d="M${cx} ${top} L${cx} ${base - 74}" stroke="#fff" stroke-width="2" opacity=".8" class="ar-pulse"/>
    <path d="M${cx - 60} ${top + 90} L${cx - 96} ${base - 74} M${cx + 60} ${top + 90} L${cx + 96} ${base - 74}" stroke="#fff" stroke-width="1.2" opacity=".5"/>
    <circle cx="${cx}" cy="${top + 4}" r="9" fill="#fff" class="ar-pulse"/><circle cx="${cx}" cy="${top + 4}" r="60" fill="url(#${p}-glow)" class="ar-pulse"/>
    <g opacity=".22" transform="translate(0 ${base * 2 + 8}) scale(1 -1)">
      <polygon points="${cx - 96},${base - 74} ${cx - 60},${top + 90} ${cx},${top} ${cx},${base - 74}" fill="url(#${p}-pl)"/>
      <polygon points="${cx},${base - 74} ${cx},${top} ${cx + 60},${top + 90} ${cx + 96},${base - 74}" fill="url(#${p}-pr)"/>
    </g>`;
  const lake = `<defs>${lg(`${p}-lake`, [[0, '#2e5f9e', .55], [1, '#08112b', .95]])}</defs>
    <rect x="-100" y="${base}" width="1800" height="${H - base}" fill="url(#${p}-lake)"/>
    <g class="ar-ripple" stroke="#cfe6ff" stroke-opacity=".35" fill="none">
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${200 + i * 210} ${790 + (i % 3) * 30} q40 -6 80 0" stroke-width="1.5"/>`).join('')}
    </g>
    <path d="M-100 ${H} L-100 800 C60 780 160 830 260 900 Z" fill="#081026"/><path d="M1700 ${H} L1700 790 C1540 790 1450 840 1360 900 Z" fill="#081026"/>
    ${[90, 140, 1460, 1520].map((x) => `<path d="M${x} 900 q-8 -60 4 -110" stroke="#5b8fd6" stroke-width="2" fill="none" opacity=".7"/><circle cx="${x + 4}" cy="788" r="3" fill="#bfe3ff" class="ar-twinkle"/>`).join('')}`;
  return {
    sky,
    layers: [
      { depth: 0.1, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.25, html: svg(forest, 'ar-l') },
      { depth: 0.4, html: svg(`<defs>${archDefs(p)}</defs>` + libs, 'ar-l') },
      { depth: 0.6, html: svg(prism, 'ar-l ar-l-temple') },
      { depth: 0.9, html: svg(lake, 'ar-l') }
    ],
    fog: 'linear-gradient(180deg, transparent 60%, rgba(120,170,255,.10) 85%, rgba(10,20,50,.4))'
  };
}

function sceneCourage() {
  const p = 'cou', r = rng(23);
  const sky = 'radial-gradient(50% 35% at 72% 62%, rgba(255,120,40,.35), transparent 70%), linear-gradient(180deg, #0e0607 0%, #241010 28%, #4b1a12 56%, #9a3a17 76%, #2a0e09 100%)';
  let back = `<defs>${rg(`${p}-cl`, [[0, '#4a3434'], [1, '#1a1012', 0]])}</defs>`;
  for (let i = 0; i < 22; i++) back += `<ellipse cx="${f(r() * W)}" cy="${f(60 + r() * 200)}" rx="${f(120 + r() * 200)}" ry="${f(30 + r() * 40)}" fill="url(#${p}-cl)" opacity=".8"/>`;
  back += `<g class="ar-bolt"><path d="M1180 40 L1150 140 L1178 140 L1130 260 L1200 120 L1170 120 L1210 40 Z" fill="#fff4d8"/><path d="M1180 40 L1150 140 L1178 140 L1130 260" stroke="#ffd9a0" stroke-width="10" opacity=".25" fill="none"/></g>`;
  back += `<g class="ar-bolt ar-bolt2"><path d="M330 30 L310 110 L330 110 L296 200 L350 96 L328 96 L356 30 Z" fill="#fff4d8"/></g>`;
  const far = `<path d="${ridge(r, -100, 1700, 560, 260, 70, 0.2)}" fill="#2b1311"/>
    <path d="M1180 600 L1260 400 L1300 410 L1380 600 Z" fill="#311512"/><ellipse cx="1280" cy="402" rx="30" ry="8" fill="#ff7a2a" class="ar-pulse"/>
    <path d="M1280 400 C1260 300 1320 260 1290 140" stroke="#5a3a33" stroke-width="40" fill="none" opacity=".35"/>
    ${[[1270, 410, 1230, 600], [1290, 410, 1340, 600]].map(([a, b, c, d]) => `<path d="M${a} ${b} Q${(a + c) / 2 + 10} ${(b + d) / 2} ${c} ${d}" stroke="#ff7a2a" stroke-width="3" fill="none" opacity=".8"/>`).join('')}`;
  const mid = `<defs>${lg(`${p}-lava`, [[0, '#ffd27a'], [0.5, '#ff7a2a'], [1, '#b8320c']])}</defs>
    <path d="${ridge(r, -100, 1700, 680, 180, 60, 0.15)}" fill="#1a0b0a"/>
    <path d="M520 900 C560 820 470 780 540 730 S640 690 610 660" stroke="url(#${p}-lava)" stroke-width="14" fill="none" class="ar-pulse"/>
    <path d="M1150 900 C1100 820 1190 790 1120 740 S1030 700 1060 670" stroke="url(#${p}-lava)" stroke-width="12" fill="none" class="ar-pulse" style="animation-delay:-1.4s"/>`;
  const cx = 800;
  const forge = `<defs>${archDefs(p)}
      ${lg(`${p}-obs`, [[0, '#3a302d'], [0.5, '#1a1413'], [1, '#0a0707']])}
      ${rg(`${p}-fire`, [[0, '#fff1c1'], [0.3, '#ffb347', .9], [0.7, '#ff5a1f', .4], [1, '#ff5a1f', 0]])}
      ${lg(`${p}-blade`, [[0, '#fff6e0'], [1, '#ffb070']])}</defs>
    <circle cx="${cx}" cy="560" r="330" fill="url(#${p}-fire)" opacity=".35" class="ar-pulse"/>
    ${steps(cx, 760, 520, 4, 15, p, 24, '#2a2321')}
    <path d="M560 420 L1020 420 L1060 446 L1060 480 L930 480 Q890 520 900 600 L960 600 L990 700 L610 700 L640 600 L700 600 Q710 520 670 480 L540 480 Q470 470 440 440 Q500 430 560 420 Z" fill="url(#${p}-obs)" stroke="#5a2a18" stroke-width="2"/>
    <path d="M560 432 L1040 432" stroke="#ffb347" stroke-width="2" opacity=".6"/>
    <path d="M700 480 Q740 540 730 600 M900 480 Q860 540 870 600 M620 650 L980 650" stroke="#ff7a2a" stroke-width="2.5" opacity=".75" class="ar-pulse"/>
    <path d="M760 700 L760 640 Q800 596 840 640 L840 700 Z" fill="url(#${p}-fire)"/>
    <path d="M760 700 L760 640 Q800 596 840 640 L840 700" fill="none" stroke="url(#${p}-gold)" stroke-width="4"/>
    ${[660, 940].map((x) => `<rect x="${x - 10}" y="500" width="20" height="34" rx="10" fill="#ffb347" opacity=".85" class="ar-pulse"/>`).join('')}
    <path d="M880 420 L900 330 L930 420" fill="#2a2120"/><path d="M640 420 L655 360 L675 420" fill="#2a2120"/>
    ${[540, 1060].map((x) => `<g><rect x="${x - 5}" y="300" width="10" height="330" fill="url(#${p}-blade)"/><path d="M${x - 5} 300 L${x} 270 L${x + 5} 300 Z" fill="#fff6e0"/>
        <rect x="${x - 30}" y="628" width="60" height="10" fill="url(#${p}-gold)"/><rect x="${x - 6}" y="638" width="12" height="60" fill="#3a2a1a"/><circle cx="${x}" cy="704" r="9" fill="url(#${p}-gold)"/>
        <g class="ar-flame" style="transform-origin:${x}px 300px"><path d="M${x} 230 C${x + 26} 270 ${x + 18} 300 ${x} 310 C${x - 18} 300 ${x - 26} 270 ${x} 230 Z" fill="#ff8a2a" opacity=".85"/><path d="M${x} 256 C${x + 12} 280 ${x + 8} 300 ${x} 304 C${x - 8} 300 ${x - 12} 280 ${x} 256 Z" fill="#ffe08a"/></g>
        <rect x="${x - 14}" y="300" width="28" height="330" fill="#ffb347" opacity=".12"/></g>`).join('')}`;
  const near = `<path d="M-100 900 L-100 760 C100 740 260 790 420 830 C560 860 640 900 700 900 Z" fill="#0d0606"/>
    <path d="M1700 900 L1700 740 C1500 740 1340 800 1200 840 C1080 870 1000 900 960 900 Z" fill="#0d0606"/>
    <path d="M40 820 L120 800 L210 830" stroke="#ff6a2a" stroke-width="2" fill="none" opacity=".7" class="ar-pulse"/>
    <path d="M1400 820 L1480 800 L1560 816" stroke="#ff6a2a" stroke-width="2" fill="none" opacity=".7" class="ar-pulse"/>`;
  return {
    sky,
    layers: [
      { depth: 0.08, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.22, html: svg(far, 'ar-l') },
      { depth: 0.38, html: svg(mid, 'ar-l') },
      { depth: 0.6, html: svg(forge, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'linear-gradient(180deg, rgba(20,8,8,.35), transparent 30%, transparent 70%, rgba(255,90,30,.12))'
  };
}

function sceneHumanity() {
  const p = 'hum', r = rng(37);
  const sky = 'radial-gradient(45% 30% at 50% 66%, rgba(255,214,150,.55), transparent 70%), linear-gradient(180deg, #1a2140 0%, #463a64 26%, #b0677a 50%, #f0a56c 66%, #f8d28e 74%, #36553a 100%)';
  let back = stars(r, 50, 0, W, 0, 220, '#fff', 1.2, 'ar-twinkle');
  for (let i = 0; i < 10; i++) back += `<ellipse cx="${f(r() * W)}" cy="${f(240 + r() * 200)}" rx="${f(120 + r() * 160)}" ry="${f(14 + r() * 18)}" fill="#ffc7b0" opacity="${f(0.18 + r() * 0.2)}"/>`;
  back += `<circle cx="800" cy="600" r="70" fill="#fff1c9" opacity=".75"/>`;
  let far = `<path d="${hills(r, 600, 80, 4)}" fill="#5d6a7a" opacity=".85"/><path d="${hills(r, 640, 70, 5)}" fill="#3f5e4c"/>`;
  for (let i = 0; i < 26; i++) {
    const x = -40 + i * 66 + r() * 24, y = 630 + r() * 20, s = 30 + r() * 26;
    if (x > 560 && x < 1040) continue;
    far += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.6)}" ry="${f(s * 0.7)}" fill="#2c4a39"/>` +
      `<path d="M${f(x - s * 0.4)} ${f(y)} q${f(s * 0.4)} ${f(-s * 0.5)} ${f(s * 0.8)} 0" stroke="#9ef0c8" stroke-width="1.6" fill="none" opacity=".7" class="ar-twinkle"/>`;
  }
  const mid = `<defs>${lg(`${p}-lake`, [[0, '#ffd8a0', .7], [1, '#3a5d6a', .9]])}</defs>
    <path d="M-100 700 Q400 680 800 690 T1700 700 L1700 760 L-100 760 Z" fill="url(#${p}-lake)"/>
    <path d="M760 695 L840 695 L830 760 L770 760 Z" fill="#fff1c9" opacity=".35"/>
    <path d="M120 720 Q300 600 480 712" stroke="#ffe7a8" stroke-width="3" fill="none" stroke-dasharray="6 8" opacity=".85" class="ar-dash"/>
    <path d="${hills(r, 760, 40, 3)}" fill="#2f4d33"/>`;
  const cx = 800, base = 742;
  const hearth = `<defs>${archDefs(p)}
      ${lg(`${p}-wood`, [[0, '#5a3a24'], [0.5, '#8a5a36'], [1, '#4a2e1c']], 1, 0)}
      ${rg(`${p}-fire`, [[0, '#fff3c4'], [0.35, '#ffc56a', .85], [1, '#ff8a3a', 0]])}
      ${lg(`${p}-dome`, [[0, '#d8fff0', .85], [0.6, '#7fd9b0', .45], [1, '#2f7a55', .35]])}</defs>
    <circle cx="${cx}" cy="${base - 120}" r="300" fill="url(#${p}-fire)" opacity=".5" class="ar-pulse"/>
    <ellipse cx="${cx}" cy="${base}" rx="250" ry="34" fill="url(#${p}-marble)"/>
    <ellipse cx="${cx}" cy="${base - 12}" rx="220" ry="28" fill="#efe6d4"/>
    ${[640, 700, 760, 840, 900, 960].map((x) => column(x, base - 220, base - 14, 12, p, `url(#${p}-wood)`)).join('')}
    <ellipse cx="${cx}" cy="${base - 90}" rx="120" ry="80" fill="url(#${p}-fire)" class="ar-pulse"/>
    <g stroke="#dffaff" stroke-width="2.5" fill="none" opacity=".9">
      <path d="M${cx} ${base - 40} Q${cx - 40} ${base - 130} ${cx - 70} ${base - 30}"/><path d="M${cx} ${base - 40} Q${cx + 40} ${base - 130} ${cx + 70} ${base - 30}"/>
      <path d="M${cx} ${base - 40} L${cx} ${base - 120}" stroke-width="3"/>
    </g>
    <ellipse cx="${cx}" cy="${base - 30}" rx="80" ry="12" fill="#bfeee0" opacity=".7"/>
    ${[600, 680, 920, 1000].map((x) => column(x, base - 230, base - 4, 16, p, `url(#${p}-wood)`) +
      `<path d="M${x - 8} ${base - 200} c14 20 -14 40 0 60 s-14 40 0 60 s-12 30 0 60" stroke="#6fd39a" stroke-width="2.4" fill="none"/>` +
      `<circle cx="${x + 6}" cy="${base - 150}" r="4" fill="#f2b8cf"/><circle cx="${x - 7}" cy="${base - 80}" r="3.5" fill="#f2b8cf"/>`).join('')}
    <path d="M570 ${base - 232} L1030 ${base - 232} L1012 ${base - 252} L588 ${base - 252} Z" fill="url(#${p}-wood)"/>
    <path d="M580 ${base - 236} Q800 ${base - 220} 1020 ${base - 236}" stroke="url(#${p}-gold)" stroke-width="3" fill="none"/>
    ${domeShape(cx, base - 252, 210, 170, `url(#${p}-dome)`)}
    ${[-150, -80, 0, 80, 150].map((dx) => `<path d="M${cx + dx} ${base - 252} Q${cx + dx * 0.55} ${base - 380} ${cx} ${base - 420}" stroke="url(#${p}-wood)" stroke-width="5" fill="none"/>`).join('')}
    ${[-120, -40, 40, 120].map((dx, i) => `<path d="M${cx + dx} ${base - 262} Q${cx + dx * 0.5} ${base - 340} ${cx + dx * 0.2} ${base - 400}" stroke="#9ef0e0" stroke-width="1.6" fill="none" opacity=".9" class="ar-twinkle" style="animation-delay:${-i}s"/>`).join('')}
    <g transform="translate(${cx} ${base - 440})"><circle r="16" fill="#f2b8cf"/><circle r="8" fill="#d97a9a"/><path d="M-18 6 q-14 -2 -22 8 M18 6 q14 -2 22 8" stroke="#6fd39a" stroke-width="4" fill="none"/></g>`;
  let near = `<path d="M-100 900 L-100 800 Q300 770 600 820 T1100 820 T1700 790 L1700 900 Z" fill="#20381f"/>`;
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = 820 + r() * 80;
    if (x > 560 && x < 1040 && y < 850) continue;
    const c = ['#f2b8cf', '#fff1c9', '#ffd27a', '#ffffff', '#c9a7f0'][i % 5];
    near += `<path d="M${f(x)} ${f(y + 18)} q2 -10 0 -18" stroke="#3d6b3a" stroke-width="1.4" fill="none"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(2 + r() * 3)}" fill="${c}" opacity=".9"/>`;
  }
  return {
    sky,
    layers: [
      { depth: 0.08, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.22, html: svg(far, 'ar-l') },
      { depth: 0.36, html: svg(mid, 'ar-l') },
      { depth: 0.6, html: svg(hearth, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'radial-gradient(70% 40% at 50% 80%, rgba(255,200,120,.12), transparent 70%)'
  };
}

function sceneJustice() {
  const p = 'jus', r = rng(41);
  const sky = 'radial-gradient(40% 30% at 50% 8%, rgba(255,250,230,.9), transparent 70%), linear-gradient(180deg, #3a5d8c 0%, #7c9ec6 30%, #cfdde8 56%, #f5ead0 76%, #e6d9bc 100%)';
  const back = `<defs>${lg(`${p}-ray`, [[0, '#ffffff', .55], [1, '#ffffff', 0]])}</defs>
    <circle cx="800" cy="40" r="120" fill="#fffaf0" opacity=".8"/>
    <g class="ar-rays">${[-520, -330, -160, 0, 160, 330, 520].map((dx, i) => `<path d="M${780 + dx * 0.1} 0 L${820 + dx * 0.1} 0 L${800 + dx * 1.8 + 60} 900 L${800 + dx * 1.8 - 60} 900 Z" fill="url(#${p}-ray)" opacity="${i % 2 ? 0.28 : 0.4}"/>`).join('')}</g>`;
  let city = `<defs>${archDefs(p)}</defs><g opacity=".55">`;
  for (let i = 0; i < 40; i++) {
    const x = -60 + i * 44, h = 40 + r() * 120;
    city += `<rect x="${x}" y="${f(600 - h)}" width="${f(30 + r() * 14)}" height="${f(h + 20)}" fill="#b9c4d2"/>`;
    if (i % 5 === 0) city += domeShape(x + 20, f(600 - h), 22, 20, '#c9d2dd');
    if (i % 7 === 3) city += `<rect x="${x + 12}" y="${f(600 - h - 70)}" width="10" height="70" fill="#c9d2dd"/>`;
  }
  city += `</g><rect x="-100" y="600" width="1800" height="300" fill="#d9d0bd"/>`;
  const cx = 800, base = 770;
  const hall = `<defs>${archDefs(p)}</defs>
    ${steps(cx, base, 760, 5, 14, p, 20)}
    <rect x="${cx - 330}" y="${base - 260}" width="660" height="190" fill="#e9e2d4"/>
    <rect x="${cx - 60}" y="${base - 200}" width="120" height="130" fill="#b7ad9b"/><path d="M${cx - 60} ${base - 200} Q${cx} ${base - 250} ${cx + 60} ${base - 200}" fill="#b7ad9b"/>
    ${colonnade(cx - 320, cx + 320, 10, base - 280, base - 70, 24, p)}
    <rect x="${cx - 360}" y="${base - 306}" width="720" height="28" fill="url(#${p}-marble)"/>
    <rect x="${cx - 360}" y="${base - 284}" width="720" height="4" fill="url(#${p}-gold)"/>
    <path d="M${cx - 370} ${base - 306} L${cx} ${base - 400} L${cx + 370} ${base - 306} Z" fill="url(#${p}-marble)"/>
    <path d="M${cx - 330} ${base - 312} L${cx} ${base - 388} L${cx + 330} ${base - 312} Z" fill="#ddd4c3"/>
    <g transform="translate(${cx} ${base - 340})"><circle r="16" fill="url(#${p}-gold)"/><path d="M-30 0 L30 0 M0 -14 L0 14" stroke="#8a6a2a" stroke-width="2"/></g>
    <g class="ar-sway" style="transform-origin:${cx}px 200px">
      <circle cx="${cx}" cy="200" r="70" fill="url(#${p}-glow)"/>
      <rect x="${cx - 300}" y="192" width="600" height="16" rx="8" fill="url(#${p}-gold)"/>
      <path d="M${cx - 280} 200 L${cx + 280} 200" stroke="#7a5a1e" stroke-width="1" stroke-dasharray="3 9" opacity=".7"/>
      <circle cx="${cx}" cy="200" r="26" fill="none" stroke="url(#${p}-gold)" stroke-width="6"/><circle cx="${cx}" cy="200" r="10" fill="#fffaf0"/>
      <path d="M${cx} 174 L${cx} 120 M${cx - 14} 130 L${cx} 112 L${cx + 14} 130" stroke="url(#${p}-gold)" stroke-width="5" fill="none"/>
      ${[-290, 290].map((dx) => `<g class="ar-sway-pan" style="transform-origin:${cx + dx}px 200px">
          <path d="M${cx + dx} 204 L${cx + dx - 60} 330 M${cx + dx} 204 L${cx + dx + 60} 330 M${cx + dx} 204 L${cx + dx} 330" stroke="#b08a3e" stroke-width="2"/>
          <path d="M${cx + dx - 74} 330 Q${cx + dx} 380 ${cx + dx + 74} 330 Z" fill="url(#${p}-gold)"/>
          <ellipse cx="${cx + dx}" cy="330" rx="74" ry="8" fill="#f6dc94"/></g>`).join('')}
    </g>`;
  const near = `<defs>${archDefs(p)}${lg(`${p}-floor`, [[0, '#efe8da'], [1, '#c9bfa9']])}</defs>
    <rect x="-100" y="${base}" width="1800" height="${H - base}" fill="url(#${p}-floor)"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M${800 + (i - 4) * 90} ${base} L${800 + (i - 4) * 420} 900" stroke="#b7ad9b" stroke-width="1" opacity=".55"/>`).join('')}
    <path d="M-100 830 L1700 830 M-100 870 L1700 870" stroke="#b7ad9b" stroke-width="1" opacity=".5"/>
    <rect x="${cx - 70}" y="${base}" width="140" height="${H - base}" fill="#fff" opacity=".25"/>
    ${column(60, 60, 900, 90, p)}${column(1540, 60, 900, 90, p)}
    <rect x="-100" y="40" width="300" height="34" fill="url(#${p}-marble)"/><rect x="1400" y="40" width="300" height="34" fill="url(#${p}-marble)"/>`;
  return {
    sky,
    layers: [
      { depth: 0.06, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.2, html: svg(city, 'ar-l') },
      { depth: 0.55, html: svg(hall, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'linear-gradient(180deg, rgba(255,250,235,.12), transparent 40%)'
  };
}

function sceneTemperance() {
  const p = 'tem', r = rng(53);
  const sky = 'radial-gradient(40% 26% at 50% 62%, rgba(255,252,236,.85), transparent 70%), linear-gradient(180deg, #14303d 0%, #376a78 28%, #96c4c3 52%, #e7efe4 66%, #bcd9d2 67%, #5f9a9a 82%, #2c5d63 100%)';
  let back = `<circle cx="800" cy="560" r="46" fill="#fffbea" opacity=".95"/><circle cx="800" cy="560" r="130" fill="#fffbea" opacity=".18"/>`;
  for (let i = 0; i < 9; i++) back += `<rect x="${f(r() * W - 200)}" y="${f(330 + r() * 180)}" width="${f(300 + r() * 400)}" height="${f(3 + r() * 6)}" rx="4" fill="#ffffff" opacity="${f(0.2 + r() * 0.25)}"/>`;
  const far = `<path d="M-100 604 L1700 604 L1700 900 L-100 900 Z" fill="#6aa3a3"/>
    <path d="M180 604 Q260 570 360 604 Z M1180 604 Q1280 560 1400 604 Z M1450 604 Q1500 590 1560 604 Z" fill="#4f8a8d" opacity=".8"/>
    <g class="ar-shimmer">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<rect x="${f(780 - (i % 3) * 8)}" y="${612 + i * 14}" width="${f(40 + (i % 4) * 14)}" height="3" rx="1.5" fill="#fffbea" opacity="${f(0.75 - i * 0.06)}"/>`).join('')}</g>`;
  const mid = `<defs>${lg(`${p}-sea`, [[0, '#7fb8b6'], [1, '#1d4c52']])}</defs>
    <rect x="-100" y="660" width="1800" height="240" fill="url(#${p}-sea)" opacity=".9"/>
    ${[[300, 700], [520, 730], [1080, 720], [1300, 700]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="7" fill="#e6efe4" opacity=".7"/>`).join('')}`;
  const cx = 800, base = 720;
  const veil = `<defs>${archDefs(p)}
      ${rg(`${p}-dome`, [[0, '#ffffff', .05], [0.75, '#bff3ec', .22], [1, '#8fd8d0', .55]], 0.5, 1, 1)}
      ${lg(`${p}-pool`, [[0, '#dff8f4'], [1, '#5fb0aa']])}</defs>
    ${steps(cx, base, 560, 3, 12, p, 30)}
    ${colonnade(cx - 200, cx + 200, 5, base - 210, base - 36, 9, p)}
    <ellipse cx="${cx}" cy="${base - 212}" rx="230" ry="16" fill="url(#${p}-marble)"/>
    <ellipse cx="${cx}" cy="${base - 60}" rx="90" ry="14" fill="url(#${p}-pool)" class="ar-pulse"/>
    <g class="ar-veil">
      ${domeShape(cx, base - 36, 300, 330, `url(#${p}-dome)`)}
      <path d="M${cx - 300} ${base - 36} A300 330 0 0 1 ${cx + 300} ${base - 36}" fill="none" stroke="#e8fffb" stroke-width="2" opacity=".8"/>
      ${[0, 1, 2, 3, 4].map((i) => `<path class="ar-silk" style="animation-delay:${-i * 1.7}s" d="M${cx - 290 + i * 10} ${base - 60 - i * 40} C${cx - 150} ${base - 200 - i * 50} ${cx + 120} ${base - 40 - i * 60} ${cx + 290 - i * 14} ${base - 120 - i * 40}" fill="none" stroke="#ffffff" stroke-width="${f(2.4 - i * 0.3)}" opacity="${f(0.55 - i * 0.07)}" stroke-dasharray="40 30"/>`).join('')}
    </g>
    <circle cx="${cx}" cy="${base - 260}" r="12" fill="#ffffff" opacity=".9" class="ar-pulse"/>`;
  const near = `<path d="M-100 900 L-100 790 Q120 770 300 820 Q380 850 420 900 Z" fill="#4f7f5a"/>
    <path d="M1700 900 L1700 780 Q1500 770 1320 820 Q1240 850 1200 900 Z" fill="#4f7f5a"/>
    ${[[160, 800], [240, 812], [1400, 806], [1480, 798]].map(([x, y]) => `<path d="M${x} ${y + 40} q-4 -30 6 -56 M${x + 10} ${y + 40} q6 -24 -2 -48" stroke="#8fc29a" stroke-width="2" fill="none"/>`).join('')}
    <g fill="none" stroke="#e8fffb" stroke-width="1.5">${[[620, 830], [980, 860], [800, 880]].map(([x, y], i) => `<ellipse class="ar-ring" style="animation-delay:${-i * 1.6}s; transform-origin:${x}px ${y}px" cx="${x}" cy="${y}" rx="60" ry="9"/>`).join('')}</g>`;
  return {
    sky,
    layers: [
      { depth: 0.06, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.18, html: svg(far, 'ar-l') },
      { depth: 0.32, html: svg(mid, 'ar-l') },
      { depth: 0.58, html: svg(veil, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'linear-gradient(180deg, transparent 40%, rgba(230,245,240,.22) 66%, transparent 80%)'
  };
}

function sceneTranscendence() {
  const p = 'tra', r = rng(67);
  const sky = 'radial-gradient(35% 25% at 50% 26%, rgba(255,230,255,.35), transparent 70%), linear-gradient(180deg, #040210 0%, #130a30 32%, #2b1550 58%, #694a90 78%, #cbb6e2 100%)';
  let gal = '';
  for (let arm = 0; arm < 3; arm++) {
    for (let i = 0; i < 80; i++) {
      const t = i / 80, a = arm * (Math.PI * 2 / 3) + t * Math.PI * 2.4;
      const rad = 14 + t * 260;
      const x = 800 + Math.cos(a) * rad + (r() - 0.5) * 18, y = 250 + Math.sin(a) * rad * 0.42 + (r() - 0.5) * 10;
      gal += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + r() * 2.2 * (1 - t))}" fill="${['#ffffff', '#f2d8ff', '#c9e2ff', '#ffe6b0'][i % 4]}" opacity="${f(0.4 + r() * 0.6)}"/>`;
    }
  }
  const back = `<defs>${rg(`${p}-core`, [[0, '#fff7ff'], [0.3, '#f0c9ff', .7], [1, '#a46ad8', 0]])}
      ${lg(`${p}-au1`, [[0, '#6fffd2', 0], [0.5, '#6fffd2', .4], [1, '#c9a7f0', 0]], 1, 0)}
      ${lg(`${p}-au2`, [[0, '#c9a7f0', 0], [0.5, '#ff9ee6', .35], [1, '#7fb8ff', 0]], 1, 0)}</defs>
    ${stars(r, 220, 0, W, 0, 700, '#fff', 1.6, 'ar-twinkle')}
    <g class="ar-aurora"><path d="M-100 420 C300 300 600 470 900 380 S1400 300 1700 400 L1700 440 C1400 350 1150 430 900 430 S300 360 -100 470 Z" fill="url(#${p}-au1)"/></g>
    <g class="ar-aurora ar-aurora2"><path d="M-100 360 C300 260 700 400 1000 320 S1500 260 1700 340 L1700 370 C1400 300 1150 370 900 370 S300 300 -100 400 Z" fill="url(#${p}-au2)"/></g>
    <ellipse cx="800" cy="250" rx="300" ry="130" fill="url(#${p}-core)" opacity=".6"/>
    <g class="ar-spin" style="transform-origin:800px 250px">${gal}</g>`;
  const far = cloudBank(r, 640, 22, '#d9c8ef', 0.55, 50, 110) + cloudBank(r, 690, 18, '#efe4fb', 0.7, 50, 100);
  const midT = `<defs>${archDefs(p)}</defs>
    <g class="ar-phase">${floatingIsland(330, 520, 150, p, r, '#6a5a8a', '#2a1f40')}${rotunda(330, 520, 40, 50, p, { cols: 4 })}</g>
    <g class="ar-phase" style="animation-delay:-4s">${floatingIsland(1290, 480, 170, p, r, '#6a5a8a', '#2a1f40')}${rotunda(1290, 480, 46, 58, p, { cols: 5 })}</g>
    <g class="ar-phase" style="animation-delay:-7s">${rotunda(1050, 400, 22, 28, p, { cols: 3 })}</g>`;
  const cx = 800, top = 560;
  const nebula = `<defs>${archDefs(p)}
      ${lg(`${p}-fall`, [[0, '#ffffff', .85], [1, '#c9a7f0', 0]])}</defs>
    <g class="ar-spin-slow" style="transform-origin:${cx}px ${top - 120}px" fill="none" stroke="#f3d9ff">
      ${[0, 1, 2, 3].map((i) => `<ellipse cx="${cx}" cy="${top - 120}" rx="${60 + i * 50}" ry="${24 + i * 20}" stroke-width="${f(2.4 - i * 0.4)}" opacity="${f(0.55 - i * 0.1)}" stroke-dasharray="${90 + i * 40} ${30 + i * 10}"/>`).join('')}
    </g>
    <circle cx="${cx}" cy="${top - 130}" r="220" fill="url(#${p}-glow)" opacity=".45"/>
    ${floatingIsland(cx, top, 420, p, r, '#7a6a9a', '#251a3c')}
    ${[-120, -40, 60, 140].map((dx, i) => `<rect class="ar-fall" style="animation-delay:${f(-i * 0.7)}s" x="${cx + dx}" y="${top + 40}" width="${6 + (i % 2) * 4}" height="300" fill="url(#${p}-fall)"/>`).join('')}
    ${rotunda(cx, top - 4, 120, 140, p, { cols: 8 })}
    <circle cx="${cx}" cy="${top - 120}" r="40" fill="#fff" opacity=".18" class="ar-pulse"/>`;
  const near = cloudBank(r, 820, 16, '#f6efff', 0.92, 60, 120);
  return {
    sky,
    layers: [
      { depth: 0.05, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.2, html: svg(far, 'ar-l') },
      { depth: 0.36, html: svg(midT, 'ar-l') },
      { depth: 0.58, html: svg(nebula, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'radial-gradient(80% 40% at 50% 100%, rgba(240,225,255,.25), transparent 70%)'
  };
}

function sceneShadow() {
  const p = 'sha', r = rng(79);
  const sky = 'radial-gradient(40% 30% at 50% 70%, rgba(120,90,170,.25), transparent 70%), linear-gradient(180deg, #040207 0%, #100a1a 40%, #1d1330 70%, #09060f 100%)';
  const back = `<defs>${lg(`${p}-dawn`, [[0, '#f2b8cf'], [0.5, '#f1d58e'], [1, '#6a4a7a']])}</defs>
    ${stars(r, 40, 0, W, 0, 400, '#b9a6e8', 1, 'ar-twinkle')}
    <g opacity=".7"><path d="M150 620 L150 470 Q210 400 270 470 L270 620 Z" fill="url(#${p}-dawn)" opacity=".55"/>
      <path d="M140 620 L140 466 Q210 380 280 466 L280 620" fill="none" stroke="#8a7fa6" stroke-width="6"/></g>
    <path d="M1300 560 Q1420 500 1560 560" stroke="#5a5266" stroke-width="5" fill="none"/>
    ${[1320, 1360, 1400, 1440, 1480, 1520].map((x) => `<line x1="${x}" y1="${f(560 - Math.sin(((x - 1300) / 260) * Math.PI) * 50)}" x2="${x}" y2="580" stroke="#5a5266" stroke-width="2"/>`).join('')}`;
  let drips = '';
  for (let i = 0; i < 24; i++) { const x = 1700 - i * 76; drips += ` L${x - 20} ${f(120 + r() * 160)} L${x - 40} ${f(90 + r() * 30)}`; }
  const cave = `<path d="M-100 0 L1700 0 L1700 120${drips} L-100 120 Z" fill="#07040c"/>
    <path d="M-100 900 L-100 0 L160 0 C240 200 120 400 220 560 C260 640 200 760 260 900 Z" fill="#0b0712"/>
    <path d="M1700 900 L1700 0 L1460 0 C1380 200 1500 420 1400 580 C1360 660 1420 780 1360 900 Z" fill="#0b0712"/>`;
  let thorns = '';
  for (let i = 0; i < 18; i++) {
    const x = 240 + i * 66 + r() * 20; if (x > 640 && x < 960) continue;
    const h = 40 + r() * 60;
    thorns += `<path d="M${f(x)} 640 L${f(x + 6)} ${f(640 - h)} L${f(x + 12)} 640 M${f(x + 2)} ${f(640 - h * 0.5)} L${f(x - 12)} ${f(640 - h * 0.7)} M${f(x + 9)} ${f(640 - h * 0.4)} L${f(x + 22)} ${f(640 - h * 0.6)}" stroke="#1c1428" stroke-width="5" fill="#1c1428"/>`;
  }
  const mirrors = `<defs>${lg(`${p}-mir`, [[0, '#4a3c66'], [0.5, '#a89cc8', .5], [1, '#2a2040']], 1, 1)}</defs>
    ${[[400, 520, -8], [560, 500, 6], [1060, 505, -5], [1220, 520, 9]].map(([x, y, a], i) => `<g transform="rotate(${a} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="38" ry="78" fill="url(#${p}-mir)" class="ar-shimmer" style="animation-delay:${f(-i * 1.3)}s"/><ellipse cx="${x}" cy="${y}" rx="38" ry="78" fill="none" stroke="#6b5a3a" stroke-width="5"/><path d="M${x - 20} ${y - 30} L${x + 6} ${y + 10} L${x - 4} ${y + 40}" stroke="#d8ccf2" stroke-width="1" opacity=".5" fill="none"/></g>`).join('')}
    ${thorns}`;
  const cx = 800, py = 740;
  const rings = [0, 1, 2].map((i) => {
    const rx = 360 + i * 120, ry = 70 + i * 26;
    return `<path d="M${cx - rx} ${py} A${rx} ${ry} 0 0 1 ${f(cx - rx * 0.2)} ${py - ry} M${f(cx + rx * 0.15)} ${py - ry} A${rx} ${ry} 0 0 1 ${cx + rx} ${py}" stroke="url(#${p}-obs)" stroke-width="${22 - i * 3}" fill="none"/>` +
      `<path d="M${cx - rx} ${py - 8} A${rx} ${ry} 0 0 1 ${f(cx - rx * 0.2)} ${py - ry - 8}" stroke="#8a7fa6" stroke-width="1.2" fill="none" opacity=".5"/>`;
  }).join('');
  const veil = `<defs>
      ${lg(`${p}-obs`, [[0, '#3a2e4e'], [1, '#0c0814']])}
      ${rg(`${p}-pool`, [[0, '#d8ccf2', .9], [0.5, '#6a5a9a', .7], [1, '#1a1228', .9]])}
      ${rg(`${p}-flame`, [[0, '#ffe7b0'], [0.4, '#c98aff', .55], [1, '#7a4ab0', 0]])}</defs>
    <path d="M${cx - 170} ${py - 40} L${cx - 170} ${py - 330} Q${cx} ${py - 470} ${cx + 170} ${py - 330} L${cx + 170} ${py - 40}" fill="none" stroke="url(#${p}-obs)" stroke-width="34"/>
    <path d="M${cx - 150} ${py - 330} Q${cx} ${py - 440} ${cx + 150} ${py - 330} L${cx + 150} ${py - 60} L${cx - 150} ${py - 60} Z" fill="#150e22" opacity=".85"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${cx - 150 + i * 60} ${py - 360 + Math.abs(i - 2.5) * 20} Q${cx - 140 + i * 60} ${py - 200} ${cx - 150 + i * 60} ${py - 60}" stroke="#2a1f3c" stroke-width="18" fill="none" opacity=".7" class="ar-veil-sway" style="animation-delay:${f(-i * 0.9)}s"/>`).join('')}
    <path d="M${cx - 150} ${py - 330} L${cx + 150} ${py - 200} M${cx + 150} ${py - 330} L${cx - 150} ${py - 200} M${cx} ${py - 420} L${cx} ${py - 60}" stroke="#8a7fa6" stroke-width=".8" opacity=".35"/>
    ${rings}
    <ellipse cx="${cx}" cy="${py}" rx="220" ry="44" fill="url(#${p}-pool)" class="ar-shimmer"/>
    <ellipse cx="${cx}" cy="${py}" rx="220" ry="44" fill="none" stroke="#3a2e4e" stroke-width="8"/>
    <rect x="${cx - 10}" y="${py - 46}" width="20" height="40" fill="#2a2038"/>
    <circle cx="${cx}" cy="${py - 64}" r="70" fill="url(#${p}-flame)" class="ar-flicker"/>
    <g class="ar-flame" style="transform-origin:${cx}px ${py - 48}px"><path d="M${cx} ${py - 92} C${cx + 14} ${py - 70} ${cx + 10} ${py - 52} ${cx} ${py - 48} C${cx - 10} ${py - 52} ${cx - 14} ${py - 70} ${cx} ${py - 92} Z" fill="#e7c9ff"/><path d="M${cx} ${py - 76} C${cx + 6} ${py - 64} ${cx + 4} ${py - 54} ${cx} ${py - 52} C${cx - 4} ${py - 54} ${cx - 6} ${py - 64} ${cx} ${py - 76} Z" fill="#fff4dc"/></g>`;
  let near = '';
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 9; i++) {
      const x = side ? 1700 - i * 50 - r() * 20 : -100 + i * 50 + r() * 20;
      const h = 120 + r() * 160;
      near += `<path d="M${f(x)} 900 C${f(x + 10)} ${f(900 - h * 0.5)} ${f(x - 20)} ${f(900 - h * 0.8)} ${f(x + (side ? -30 : 30))} ${f(900 - h)}" stroke="#05030a" stroke-width="${f(6 + r() * 6)}" fill="none"/>`;
      for (let k = 1; k < 4; k++) near += `<path d="M${f(x + 4)} ${f(900 - h * k * 0.22)} l${side ? -18 : 18} -10" stroke="#05030a" stroke-width="4"/>`;
    }
  }
  return {
    sky,
    layers: [
      { depth: 0.05, html: svg(back, 'ar-l ar-l-sky', 'xMidYMid slice') },
      { depth: 0.2, html: svg(cave, 'ar-l') },
      { depth: 0.36, html: svg(mirrors, 'ar-l') },
      { depth: 0.58, html: svg(veil, 'ar-l ar-l-temple') },
      { depth: 1, html: svg(near, 'ar-l') }
    ],
    fog: 'linear-gradient(180deg, rgba(10,6,18,.4), transparent 30%, transparent 55%, rgba(110,80,160,.22) 80%, rgba(10,6,18,.6))'
  };
}

/** The Axial hub: Cassidy's island shrine at sunset, deepened into a starlit nebula above. */
function sceneHub(img) {
  const r = rng(97);
  const sky = 'linear-gradient(180deg, #05061a 0%, #1a1440 40%, #3a2350 70%, #0b0a1f 100%)';
  const photo = img ? `<div class="ar-l ar-l-img" style="background-image:url('${img}')"></div>` : '';
  const veil = `<div class="ar-l ar-l-hubveil"></div>`;
  return {
    sky,
    layers: [
      { depth: 0.12, html: photo },
      { depth: 0.04, html: veil + svg(stars(r, 180, 0, W, 0, 380, '#fff', 1.5, 'ar-twinkle'), 'ar-l ar-l-sky', 'xMidYMid slice') }
    ],
    fog: 'radial-gradient(60% 30% at 50% 100%, rgba(241,213,142,.12), transparent 70%)'
  };
}

export const SCENES = {
  wisdom: sceneWisdom, courage: sceneCourage, humanity: sceneHumanity, justice: sceneJustice,
  temperance: sceneTemperance, transcendence: sceneTranscendence, shadow: sceneShadow, axial: sceneHub
};

/* ========================================================================== */
/* Realm hosts (guardians) — drawn figures, viewBox 0 0 240 480               */
/* Cassidy's own portraits are used for the virtue advisors; these drawn      */
/* figures stand in for the realm Guardians until a guardian portrait is set  */
/* (realm.guardianPortrait in aretoria-data.js), and remain the fallback.     */
/* ========================================================================== */

const FIG = {
  sophia: { aura: '#7fb8ff', robe: ['#3c5fa8', '#1c2c62', '#0d1736'], trim: '#e9e4f2', face: '#f4ead8', hair: '#e6e9f5', head: 'hair', crown: 'crystal', emblem: 'prism', pattern: 'time', pose: 'chest' },
  valorix: { aura: '#ef7a4f', robe: ['#6b6f7c', '#363944', '#121318'], trim: '#ffb347', face: '#e8d2b8', head: 'helm', emblem: 'sword', pattern: 'armor', pose: 'chest', cape: '#7a1e14', armor: true },
  amara: { aura: '#6fd39a', robe: ['#3f9a6c', '#22603f', '#0f2f22'], trim: '#f2b8cf', face: '#f1dcc8', hair: '#6a3e2a', head: 'hair', crown: 'roses', emblem: 'heart', pattern: 'vines', pose: 'chest' },
  justar: { aura: '#f1d58e', robe: ['#f3ecdc', '#c9b994', '#5d4f33'], trim: '#d9b56a', face: '#ead7bf', hair: '#d7d2c8', head: 'hair', crown: 'judge', emblem: 'scales', pattern: 'stole', pose: 'chest' },
  moder: { aura: '#8fd8d0', robe: ['#8fd8d0', '#3f8f8c', '#0f3a40'], trim: '#e8fffb', face: '#f2e6d6', hair: '#2f4a52', head: 'veil', emblem: 'orbs', pattern: 'silk', pose: 'open', silks: true },
  auria: { aura: '#c9a7f0', robe: ['#4a2a86', '#22114a', '#08051a'], trim: '#f3d9ff', face: '#efe0f4', hair: '#2a1846', head: 'hair', crown: 'stars', emblem: 'galaxy', pattern: 'stars', pose: 'chest' },
  veil: { aura: '#8a7fa6', robe: ['#2e2540', '#161022', '#07050c'], trim: '#8a7fa6', face: '#120c1c', head: 'hood', emblem: 'flame', pattern: 'cracks', pose: 'chest', hidden: true },
  irishnu: { aura: '#f1d58e', robe: ['#f6f2ea', '#cfc6e0', '#3e3766'], trim: '#d9b56a', face: '#efdcc6', head: 'hood', crown: 'circlet', emblem: 'staff', pattern: 'prism', pose: 'chest', glint: true }
};
export const FIGURE_FOR = { wisdom: 'sophia', courage: 'valorix', humanity: 'amara', justice: 'justar', temperance: 'moder', transcendence: 'auria', shadow: 'veil', irishnu: 'irishnu' };

const ROBE = 'M98 120 C84 122 74 130 72 146 C66 200 60 260 52 330 C44 400 34 440 22 476 L218 476 C206 440 196 400 188 330 C180 260 174 200 168 146 C166 130 156 122 142 120 Z';
const mirrorPath = (d) => d.replace(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g, (m, x, y) => `${f(240 - parseFloat(x))} ${y}`);
const SLEEVE_CHEST = 'M76 140 C62 170 52 218 54 256 C66 266 90 258 100 240 C108 226 112 214 112 204 C104 186 96 166 92 146 Z';
const SLEEVE_OPEN = 'M76 140 C64 170 52 204 40 236 C46 250 58 256 66 252 C72 226 84 194 94 160 Z M44 240 C40 270 46 300 56 316 C64 296 66 270 66 252 Z';

function figPattern(c, p) {
  switch (c.pattern) {
    case 'time': return `<g fill="none" stroke="${c.trim}" opacity=".28">${[0, 1, 2, 3].map((i) => `<circle cx="120" cy="${300 + i * 30}" r="${30 + i * 22}" stroke-dasharray="${4 + i * 3} 7"/>`).join('')}</g>` + stars(rng(5), 30, 40, 200, 160, 470, '#fff', 1.1);
    case 'vines': return `<g fill="none" stroke="#9ef0c8" stroke-width="1.6" opacity=".55"><path d="M90 160 C70 220 110 260 84 320 S100 420 70 470"/><path d="M150 160 C170 220 130 260 156 320 S140 420 170 470"/></g>` +
      `<g fill="#f2b8cf">${[[86, 230], [150, 260], [80, 350], [160, 380], [100, 430]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4"/>`).join('')}</g>`;
    case 'stars': return `<ellipse cx="110" cy="330" rx="70" ry="40" fill="#ff9ee6" opacity=".18"/><ellipse cx="140" cy="400" rx="60" ry="30" fill="#7fb8ff" opacity=".18"/>` + stars(rng(9), 70, 30, 210, 140, 476, '#fff', 1.4, 'ar-twinkle');
    case 'silk': return `<g fill="none" stroke="#e8fffb" opacity=".35">${[0, 1, 2, 3, 4].map((i) => `<path d="M${60 + i * 30} 150 C${80 + i * 20} 260 ${40 + i * 40} 360 ${30 + i * 45} 476"/>`).join('')}</g>`;
    case 'stole': return `<path d="M108 122 L102 476 L138 476 L132 122 Z" fill="url(#${p}-gold)" opacity=".9"/><g stroke="#8a6a2a" opacity=".6">${[200, 260, 320, 380, 440].map((y) => `<line x1="104" y1="${y}" x2="136" y2="${y}"/>`).join('')}</g>`;
    case 'prism': return `<path d="M110 122 L104 476 L136 476 L130 122 Z" fill="url(#${p}-spec)" opacity=".75"/>`;
    case 'cracks': return `<g stroke="#8a7fa6" fill="none" opacity=".3"><path d="M80 300 L100 340 L90 380 L110 430"/><path d="M160 260 L150 310 L170 350"/></g>`;
    case 'armor': return `<g stroke="#ffb347" opacity=".55" fill="none" stroke-width="1.5">${[250, 290, 330, 370, 410].map((y, i) => `<path d="M${60 - i * 4} ${y} Q120 ${y + 14} ${180 + i * 4} ${y}"/>`).join('')}</g>`;
    default: return '';
  }
}

function figCrown(c, p) {
  switch (c.crown) {
    case 'crystal': return `<g fill="#e3f0ff" stroke="#fff" stroke-width=".6">${[-26, -13, 0, 13, 26].map((dx, i) => { const h = i === 2 ? 22 : 12 + (i % 2) * 4; const y = 66 - Math.cos(dx / 30) * 6; return `<path d="M${120 + dx} ${f(y - h)} L${124 + dx} ${f(y)} L${120 + dx} ${f(y + 4)} L${116 + dx} ${f(y)} Z"/>`; }).join('')}</g><circle cx="120" cy="44" r="3" fill="#fff" class="ar-pulse"/>`;
    case 'roses': return `<path d="M96 76 Q120 58 144 76" stroke="#3f9a6c" stroke-width="4" fill="none"/>` + [[96, 76], [106, 68], [120, 64], [134, 68], [144, 76]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 2 ? 7 : 5}" fill="#f2b8cf"/><circle cx="${x}" cy="${y}" r="${i === 2 ? 3 : 2}" fill="#c9607e"/>`).join('');
    case 'judge': return `<path d="M104 76 L108 38 Q120 28 132 38 L136 76 Z" fill="url(#${p}-gold)"/><path d="M106 70 L134 70" stroke="#8a6a2a" stroke-width="2"/><circle cx="120" cy="52" r="5" fill="#fffaf0"/>`;
    case 'stars': return [-30, -18, -6, 6, 18, 30].map((dx) => { const y = 60 - Math.cos(dx / 34) * 8; return `<path d="M${120 + dx} ${f(y - 6)} L${121.5 + dx} ${f(y - 1.5)} L${126 + dx} ${f(y)} L${121.5 + dx} ${f(y + 1.5)} L${120 + dx} ${f(y + 6)} L${118.5 + dx} ${f(y + 1.5)} L${114 + dx} ${f(y)} L${118.5 + dx} ${f(y - 1.5)} Z" fill="#fff4d0" class="ar-twinkle"/>`; }).join('');
    case 'circlet': return `<path d="M104 80 Q120 74 136 80" stroke="url(#${p}-gold)" stroke-width="3" fill="none"/><circle cx="120" cy="77" r="3.5" fill="url(#${p}-spec)"/>`;
    default: return '';
  }
}

function figEmblem(c, p) {
  switch (c.emblem) {
    case 'prism': return `<circle cx="120" cy="196" r="34" fill="url(#${p}-aura)"/><path d="M120 176 L136 208 L104 208 Z" fill="#eaf4ff" stroke="#fff" stroke-width="1"/>` +
      ['#ff6b6b', '#ffb056', '#ffe27a', '#7fe0a0', '#6fb8ff', '#b48cff'].map((col, i) => `<path d="M132 198 L190 ${186 + i * 6}" stroke="${col}" stroke-width="2" opacity=".8"/>`).join('');
    case 'heart': return `<circle cx="120" cy="192" r="40" fill="url(#${p}-aura)" class="ar-pulse"/><g class="fig-spin" style="transform-origin:120px 192px">${[0, 60, 120, 180, 240, 300].map((a) => `<ellipse cx="120" cy="178" rx="5" ry="12" fill="#f2b8cf" opacity=".85" transform="rotate(${a} 120 192)"/>`).join('')}</g><circle cx="120" cy="192" r="7" fill="#fff6e0"/>`;
    case 'scales': return `<g class="ar-sway" style="transform-origin:120px 176px"><line x1="120" y1="168" x2="120" y2="214" stroke="url(#${p}-gold)" stroke-width="3"/><rect x="86" y="174" width="68" height="4" rx="2" fill="url(#${p}-gold)"/>` +
      [92, 148].map((x) => `<path d="M${x} 178 L${x - 10} 200 M${x} 178 L${x + 10} 200" stroke="#c9a04a" stroke-width="1"/><path d="M${x - 13} 200 Q${x} 210 ${x + 13} 200 Z" fill="url(#${p}-gold)"/>`).join('') + `</g>`;
    case 'orbs': return `<path d="M40 226 Q120 150 200 226" stroke="#f1d58e" stroke-width="1.2" fill="none" opacity=".7"/><circle cx="40" cy="226" r="11" fill="#ffc57a"/><circle cx="40" cy="226" r="24" fill="#ffc57a" opacity=".25" class="ar-pulse"/><circle cx="200" cy="226" r="11" fill="#9ff0ea"/><circle cx="200" cy="226" r="24" fill="#9ff0ea" opacity=".25" class="ar-pulse"/>`;
    case 'galaxy': return `<circle cx="120" cy="194" r="30" fill="url(#${p}-aura)"/><g class="fig-spin" style="transform-origin:120px 194px" fill="none" stroke="#fbe8ff" stroke-width="1.6"><path d="M120 194 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0"/></g><circle cx="120" cy="194" r="4" fill="#fff"/>`;
    case 'flame': return `<rect x="108" y="180" width="24" height="34" rx="4" fill="#2a2038" stroke="#6b5a3a" stroke-width="2"/><circle cx="120" cy="196" r="30" fill="url(#${p}-flamegl)" class="ar-flicker"/><g class="ar-flame" style="transform-origin:120px 208px"><path d="M120 186 C127 196 125 206 120 208 C115 206 113 196 120 186 Z" fill="#e7c9ff"/></g>`;
    case 'staff': return `<line x1="178" y1="96" x2="178" y2="470" stroke="url(#${p}-goldH)" stroke-width="5"/><path d="M178 70 L188 92 L178 108 L168 92 Z" fill="url(#${p}-spec)" stroke="#fff" stroke-width="1"/><circle cx="178" cy="90" r="30" fill="url(#${p}-aura)" class="ar-pulse"/><circle cx="120" cy="198" r="5" fill="#fff6dc"/>`;
    default: return '';
  }
}

function figHead(c, p) {
  const face = `<ellipse cx="120" cy="92" rx="16" ry="20" fill="url(#${p}-face)"/>`;
  const eyes = c.hidden ? `<circle cx="113" cy="94" r="1.4" fill="#b9a6e8" opacity=".7" class="ar-flicker"/><circle cx="127" cy="94" r="1.4" fill="#b9a6e8" opacity=".7" class="ar-flicker"/>` :
    c.glint
      // The Guide: the faintest lopsided smile and a small glint in one eye (only an attentive eye will notice).
      ? `<path d="M110 92 q4 3 8 0 M122 91.4 q4 2.4 8 .4" stroke="#5a4636" stroke-width="1.2" fill="none" opacity=".7"/><path d="M120 96 l-1.5 6 h3" stroke="#000" stroke-opacity=".15" fill="none"/><path d="M115 106.2 q5.5 1.6 10.6 -1.4" stroke="#a0665a" stroke-width="1" fill="none" opacity=".55"/>` +
        `<path d="M131.6 88.6 l.5 1.3 1.3 .5 -1.3 .5 -.5 1.3 -.5 -1.3 -1.3 -.5 1.3 -.5 Z" fill="#fff8e0" opacity=".85" class="ar-twinkle"/>`
      : `<path d="M110 92 q4 3 8 0 M122 92 q4 3 8 0" stroke="#5a4636" stroke-width="1.2" fill="none" opacity=".7"/><path d="M120 96 l-1.5 6 h3" stroke="#000" stroke-opacity=".15" fill="none"/><path d="M115 106 q5 2 10 0" stroke="#a0665a" stroke-width="1" fill="none" opacity=".5"/>`;
  const neck = `<rect x="113" y="106" width="14" height="18" fill="url(#${p}-face)"/>`;
  if (c.head === 'helm') {
    const mane = [[94, 70, 16], [146, 70, 16], [86, 96, 14], [154, 96, 14], [100, 54, 15], [140, 54, 15], [120, 46, 17], [80, 120, 12], [160, 120, 12]]
      .map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#3c3c4c"/>`).join('');
    return `<g>${mane}<path d="M88 58 L100 80 L92 82 L106 104" stroke="#fff4d8" stroke-width="2" fill="none" class="ar-bolt"/></g>${neck}` +
      `<path d="M100 96 C98 66 108 60 120 60 C132 60 142 66 140 96 L138 112 L102 112 Z" fill="url(#${p}-steel)"/>` +
      `<path d="M106 90 L134 90 M120 64 L120 110" stroke="#1a1a20" stroke-width="3"/><circle cx="112" cy="90" r="2.4" fill="#ffb347"/><circle cx="128" cy="90" r="2.4" fill="#ffb347"/><circle cx="112" cy="90" r="6" fill="#ff7a2a" opacity=".35"/><circle cx="128" cy="90" r="6" fill="#ff7a2a" opacity=".35"/>`;
  }
  if (c.head === 'hood') {
    return `<path d="M94 106 C88 64 104 52 120 52 C136 52 152 64 146 106 C150 122 158 130 168 140 C140 132 132 128 120 128 C108 128 100 132 72 140 C82 130 90 122 94 106 Z" fill="url(#${p}-hood)"/>${neck}${face}${eyes}` +
      `<path d="M101 112 C96 76 108 64 120 64 C132 64 144 76 139 112" fill="none" stroke="${c.trim}" stroke-width="2" opacity=".85"/>` +
      (c.hidden ? `<ellipse cx="120" cy="84" rx="18" ry="14" fill="#07040c" opacity=".7"/>` : '');
  }
  const hairBack = `<path d="M102 76 C98 58 142 58 138 76 C148 106 150 140 160 180 C142 170 130 150 120 150 C110 150 98 170 80 180 C90 140 92 106 102 76 Z" fill="${c.hair}"/>`;
  const hairFront = `<path d="M103 90 C100 64 140 64 137 90 C132 76 124 72 120 73 C112 73 106 80 103 90 Z" fill="${c.hair}"/>`;
  const veil = c.head === 'veil' ? `<path d="M96 100 C90 60 150 60 144 100 C150 150 166 200 176 250 C150 230 90 230 64 250 C74 200 90 150 96 100 Z" fill="#e8fffb" opacity=".22"/>` : '';
  return hairBack + neck + face + eyes + hairFront + veil;
}

/** Build a host figure. `prefix` keeps gradient ids unique; `portrait` crops to head + shoulders. */
export function figureSvg(key, prefix, portrait = false) {
  const c = FIG[key] || FIG.irishnu;
  const p = prefix;
  const defs = `<defs>
    ${lg(`${p}-robe`, [[0, c.robe[0]], [0.5, c.robe[1]], [0.86, c.robe[2], 0.9], [1, c.robe[2], 0]])}
    ${rg(`${p}-aura`, [[0, c.aura, 0.55], [0.5, c.aura, 0.18], [1, c.aura, 0]])}
    ${rg(`${p}-face`, [[0, '#fffaf0'], [0.6, c.face], [1, c.hidden ? '#05030a' : '#b89a80']], 0.45, 0.4, 0.7)}
    ${lg(`${p}-hood`, [[0, c.robe[0]], [1, c.robe[1]]])}
    ${lg(`${p}-steel`, [[0, '#c9ced8'], [0.5, '#7a808e'], [1, '#2e313a']])}
    ${lg(`${p}-gold`, [[0, '#fff1c1'], [0.45, '#e3bf6c'], [1, '#9c7330']])}
    ${lg(`${p}-goldH`, [[0, '#9c7330'], [0.5, '#fff1c1'], [1, '#a57b34']], 1, 0)}
    ${lg(`${p}-spec`, [[0, '#ff8fa3'], [0.2, '#ffd27a'], [0.4, '#9ef0c8'], [0.6, '#7fb8ff'], [0.8, '#c9a7f0'], [1, '#f2b8cf']])}
    ${rg(`${p}-flamegl`, [[0, '#ffe7b0', 0.8], [0.5, '#c98aff', 0.35], [1, '#7a4ab0', 0]])}
    <clipPath id="${p}-clip"><path d="${ROBE}"/></clipPath>
  </defs>`;
  const sleeve = c.pose === 'open' ? SLEEVE_OPEN : SLEEVE_CHEST;
  const hands = c.pose === 'open'
    ? `<ellipse cx="42" cy="244" rx="8" ry="6" fill="url(#${p}-face)"/><ellipse cx="198" cy="244" rx="8" ry="6" fill="url(#${p}-face)"/>`
    : (c.emblem === 'sword' ? '' : `<ellipse cx="112" cy="204" rx="8" ry="10" fill="url(#${p}-face)"/><ellipse cx="128" cy="204" rx="8" ry="10" fill="url(#${p}-face)"/>`);
  const cape = c.cape ? `<path d="M80 136 C50 220 30 360 12 476 L228 476 C210 360 190 220 160 136 Z" fill="${c.cape}" opacity=".9"/>` : '';
  const silks = c.silks ? `<g class="fig-silk"><path d="M80 140 C30 170 10 260 -10 380" stroke="#e8fffb" stroke-width="8" fill="none" opacity=".35" stroke-linecap="round"/><path d="M160 140 C210 170 230 260 250 380" stroke="#e8fffb" stroke-width="8" fill="none" opacity=".35" stroke-linecap="round"/></g>` : '';
  const armor = c.armor ? `<ellipse cx="78" cy="146" rx="24" ry="16" fill="url(#${p}-steel)"/><ellipse cx="162" cy="146" rx="24" ry="16" fill="url(#${p}-steel)"/>` +
    `<path d="M92 132 L148 132 L144 214 Q120 236 96 214 Z" fill="url(#${p}-steel)"/><path d="M114 150 L126 150 L118 176 L128 176 L110 206 L116 182 L106 182 Z" fill="#ffb347" class="ar-pulse"/>` : '';
  const sword = c.emblem === 'sword' ? `<g><rect x="116" y="226" width="8" height="200" fill="url(#${p}-goldH)" opacity=".9"/><path d="M116 426 L120 446 L124 426 Z" fill="#fff1c1"/><rect x="118.5" y="230" width="3" height="194" fill="#fff" opacity=".7"/>` +
    `<rect x="94" y="216" width="52" height="9" rx="4" fill="url(#${p}-gold)"/><rect x="115" y="190" width="10" height="27" fill="#3a2a1a"/><circle cx="120" cy="186" r="7" fill="url(#${p}-gold)"/>` +
    `<rect x="112" y="226" width="16" height="200" fill="#ffb347" opacity=".18" class="ar-pulse"/>` +
    `<ellipse cx="110" cy="200" rx="9" ry="11" fill="url(#${p}-steel)"/><ellipse cx="130" cy="200" rx="9" ry="11" fill="url(#${p}-steel)"/></g>` : '';
  const halo = c.hidden
    ? `<g class="fig-halo" fill="none" stroke="#8a7fa6" stroke-width="1.4" opacity=".55"><path d="M80 80 A42 42 0 0 1 150 56"/><path d="M160 90 A42 42 0 0 1 120 134"/><path d="M96 126 A42 42 0 0 1 78 96"/></g>`
    : `<g class="fig-halo" fill="none" stroke="${c.emblem === 'sword' ? '#ffcf8a' : '#f1d58e'}" stroke-width="1.2" opacity=".75"><circle cx="120" cy="92" r="46"/><circle cx="106" cy="92" r="30"/><circle cx="134" cy="92" r="30"/><circle cx="120" cy="78" r="30"/><circle cx="120" cy="106" r="30"/></g>`;
  const orbit = `<g transform="translate(120 260) scale(1 .28)"><circle r="96" fill="none" stroke="${c.trim}" stroke-width="2.4" opacity=".35"/><g class="fig-spin"><circle cx="96" cy="0" r="9" fill="#fff" opacity=".9"/></g></g>`;
  const body = `<g class="fig-body">${cape}${silks}<path d="${ROBE}" fill="url(#${p}-robe)"/>` +
    `<g clip-path="url(#${p}-clip)">${figPattern(c, p)}<path d="M100 200 C96 300 86 400 80 476 M140 200 C144 300 154 400 160 476 M120 240 L120 476" stroke="#000" stroke-opacity=".18" stroke-width="2" fill="none"/></g>` +
    `<path d="M98 120 Q120 150 142 120" stroke="${c.trim}" stroke-width="2.2" fill="none"/>` +
    (c.armor ? '' : `<path d="M66 236 Q120 250 174 236" stroke="${c.trim}" stroke-width="2.4" fill="none" opacity=".85"/>`) +
    armor +
    `<path d="${sleeve}" fill="url(#${p}-robe)"/><path d="${mirrorPath(sleeve)}" fill="url(#${p}-robe)"/>` +
    `<path d="${sleeve}" fill="none" stroke="${c.trim}" stroke-width="1.2" opacity=".6"/><path d="${mirrorPath(sleeve)}" fill="none" stroke="${c.trim}" stroke-width="1.2" opacity=".6"/>` +
    sword + hands + figEmblem(c, p) + figHead(c, p) + figCrown(c, p) + `</g>`;
  const inner = defs + `<ellipse class="fig-aura" cx="120" cy="230" rx="130" ry="240" fill="url(#${p}-aura)"/>` + halo + body + orbit;
  const vb = portrait ? '62 30 116 116' : '-20 0 280 480';
  return `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" class="fig fig-${key}">${inner}</svg>`;
}

/* ---------- gate glyphs (also used as realm emblems) ---------- */
export function gateGlyph(id) {
  const s = 'fill="none" stroke="#fff8e6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const g = {
    wisdom: `<path ${s} d="M20 6 L32 30 L8 30 Z"/><path ${s} d="M26 22 L38 18 M27 25 L38 25" opacity=".7"/>`,
    courage: `<path ${s} d="M8 14 L32 14 L34 18 L26 18 Q23 22 25 28 L15 28 Q17 22 14 18 L6 18 Z"/><path ${s} d="M20 4 l-3 6 h6 l-3 6" opacity=".9"/>`,
    humanity: `<path ${s} d="M20 32 C4 22 8 8 20 14 C32 8 36 22 20 32 Z"/>`,
    justice: `<path ${s} d="M20 6 V32 M8 12 H32 M8 12 L4 22 H12 Z M32 12 L28 22 H36 Z M14 32 H26"/>`,
    temperance: `<path ${s} d="M6 28 A14 14 0 0 1 34 28 Z"/><path ${s} d="M6 33 q4 -3 8 0 t8 0 t8 0" opacity=".8"/>`,
    transcendence: `<path ${s} d="M20 20 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -10 0 a8 8 0 1 1 16 0 a11 11 0 1 1 -22 0"/>`,
    shadow: `<path ${s} d="M20 8 C26 16 25 24 20 27 C15 24 14 16 20 8 Z"/><ellipse ${s} cx="20" cy="32" rx="12" ry="3"/>`
  }[id] || `<circle ${s} cx="20" cy="20" r="10"/>`;
  return `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">${g}</svg>`;
}
