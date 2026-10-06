/**
 * Aretoria v1 — the enterable portal (lazy-loaded from portal.js on "Enter the Realms").
 * Full-screen overlay #aretoria: cinematic entry over Cassidy's island shrine, the Axial
 * hub (the one whole that holds every realm), seven realm environments, each hosted by its
 * Guardian (drawn figure, or a portrait from assets/aretoria/guardians/ once one is set),
 * Cassidy's own portraits as virtue advisors, a Hall of Virtues and his Creed.
 * All dialogue is scripted (no AI, no network beyond loading images from this site).
 *
 * v25: the opening and closing narration lines stay up for readMs(text) (≈4 s + 60 ms per
 * character) with a "tap to continue" hint; click/tap anywhere, Enter or Space advances,
 * Esc or ✕ leaves at once.
 * v26: painted guardian portraits, Irishnu the Guide portrait, and realm painted backdrops
 * (lazy-loaded; drawn SVG / CSS scenes remain the fallback).
 * v27: Axial hub uses its own painted floating-island backdrop (realms/axial.jpg); the
 * entry cinematic still flies through the shrine photo (SHRINE_IMAGE).
 */
import {
  REALMS, GUIDE, HUB, CREED, OPENING, CLOSING, VIRTUES, SHRINE_IMAGE,
  reflectionKey, isoDate, tokenContext, fillTokens, readMs,
  advisorsFor, advisorDialogue, advisorTitle, advisorKey, virtueBySlug,
  guardianRole, guardianLine, guardianPortraitPath, irishnuPortraitPath, realmBackdropPath
} from './aretoria-data.js?v=27';
import { SCENES, figureSvg, FIGURE_FOR, gateGlyph } from './aretoria-art.js?v=27';

const VERSION = 27;
const MET_KEY = 'mec-aretoria:met-irishnu';
const reducedMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const reduced = () => reducedMQ.matches;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const realmById = (id) => REALMS.find((r) => r.id === id);
const HUB_ORDER = ['courage', 'justice', 'humanity', 'temperance', 'wisdom', 'transcendence']; // warm → violet (spectrum order)

let root = null;
let S = {
  open: false, view: 'axial', pushed: false, returnFocus: null,
  dlg: null, typing: null, raf: 0, fx: null,
  px: 0, py: 0, tx: 0, ty: 0, introTimer: [], outroTimer: null, lastT: 0,
  badPortraits: new Set()
};
const coarse = () => !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
const continueText = () => (coarse() ? 'Tap to continue' : 'Click or press Enter to continue');
const HINT_DELAY_MS = 1200; // the "continue" hint fades in shortly after a narration line appears
const $ = (sel) => root.querySelector(sel);

/* ---------- CSS (lazy) ---------- */
function ensureCss() {
  if (document.getElementById('aretoria-css')) return Promise.resolve();
  return new Promise((res) => {
    const l = document.createElement('link');
    l.id = 'aretoria-css'; l.rel = 'stylesheet'; l.href = `aretoria.css?v=${VERSION}`;
    l.onload = () => res(); l.onerror = () => res();
    document.head.appendChild(l);
    setTimeout(res, 2500);
  });
}

/* ---------- storage ---------- */
function todayIso() { return isoDate(new Date()); }
function realmDone(id) {
  const prefix = reflectionKey(todayIso(), id);
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === prefix || k.startsWith(prefix + ':')) return true;
    }
  } catch { /* storage unavailable */ }
  return false;
}
function readKey(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } }
function writeKey(k, v) {
  try { if (v.trim()) localStorage.setItem(k, v); else localStorage.removeItem(k); return true; } catch { return false; }
}

/* ---------- DOM skeleton ---------- */
function build() {
  root = document.createElement('div');
  root.id = 'aretoria';
  root.className = 'ar';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Aretoria');
  root.hidden = true;
  root.innerHTML = `
    <div class="ar-world" aria-hidden="true">
      <div class="ar-sky"></div>
      <div class="ar-layers"></div>
      <canvas class="ar-fx"></canvas>
      <div class="ar-fog"></div>
    </div>
    <div class="ar-hubui" hidden></div>
    <div class="ar-realmui" hidden></div>
    <div class="ar-stage" hidden></div>
    <header class="ar-top">
      <button type="button" class="ar-btn ar-back" hidden aria-label="Back to the Axial hub">‹ <span>Axial hub</span></button>
      <div class="ar-title"><div class="ar-title-main"></div><div class="ar-title-sub"></div></div>
      <button type="button" class="ar-btn ar-x" aria-label="Leave Aretoria">✕</button>
    </header>
    <div class="ar-lore" hidden></div>
    <div class="ar-hint" aria-live="polite"></div>
    <section class="ar-dlg" hidden aria-live="polite">
      <div class="ar-dlg-portrait"></div>
      <div class="ar-dlg-body">
        <div class="ar-dlg-name"></div>
        <div class="ar-dlg-text"></div>
        <textarea class="ar-dlg-input" rows="2" hidden></textarea>
        <div class="ar-dlg-status"></div>
        <div class="ar-dlg-choices"></div>
      </div>
      <button type="button" class="ar-btn ar-dlg-close" aria-label="Close conversation">✕</button>
    </section>
    <section class="ar-panel ar-hall" hidden aria-label="Hall of Virtues"></section>
    <section class="ar-panel ar-creed" hidden aria-label="${esc(CREED.title)}"></section>
    <div class="ar-flash"></div>
    <div class="ar-intro" hidden tabindex="-1" aria-label="Entering Aretoria">
      <div class="ar-intro-img"></div>
      <div class="ar-intro-rush"></div>
      <svg class="ar-intro-arch" viewBox="0 0 120 170" aria-hidden="true"><defs><linearGradient id="ar-ig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1c1"/><stop offset=".5" stop-color="#e3bf6c"/><stop offset="1" stop-color="#9c7330"/></linearGradient></defs>
        <path d="M10 168 L10 60 A50 50 0 0 1 110 60 L110 168" fill="none" stroke="url(#ar-ig)" stroke-width="5"/><path d="M20 168 L20 62 A40 40 0 0 1 100 62 L100 168" fill="none" stroke="#fff1c1" stroke-width="1.2" opacity=".7"/></svg>
      <p class="ar-intro-line" aria-live="polite"></p>
      <div class="ar-intro-flare"></div>
      <div class="ar-narr-hint" aria-hidden="true"></div>
      <button type="button" class="ar-btn ar-narr-x" aria-label="Leave Aretoria">✕</button>
    </div>
    <div class="ar-outro" hidden>
      <p aria-live="polite"></p>
      <div class="ar-narr-hint" aria-hidden="true"></div>
      <button type="button" class="ar-btn ar-narr-x" aria-label="Leave Aretoria now">✕</button>
    </div>`;
  document.body.appendChild(root);

  $('.ar-x').addEventListener('click', () => close());
  $('.ar-back').addEventListener('click', () => travel('axial'));
  $('.ar-dlg-close').addEventListener('click', () => closeDialogue());
  $('.ar-dlg-text').addEventListener('click', () => finishTyping());
  // Narration lines: a tap/click anywhere advances; their own ✕ leaves at once.
  $('.ar-intro').addEventListener('click', (e) => {
    if (e.target.closest('.ar-narr-x')) { e.stopPropagation(); return exitNow(); }
    advanceIntro();
  });
  $('.ar-outro').addEventListener('click', (e) => {
    if (e.target.closest('.ar-narr-x')) { e.stopPropagation(); return finishOutro(); }
    leaveOutro();
  });
  // The stage never scrolls (a focused edge figure could otherwise nudge it sideways on phones).
  root.addEventListener('scroll', () => { if (root.scrollLeft || root.scrollTop) { root.scrollLeft = 0; root.scrollTop = 0; } });
  // Long advisor rows scroll sideways with an ordinary mouse wheel.
  root.addEventListener('wheel', (e) => {
    const row = e.target.closest && e.target.closest('.ar-adv-row');
    if (!row || row.scrollWidth <= row.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault(); row.scrollLeft += e.deltaY;
  }, { passive: false });
  // On document (capture) so Esc still works after focus falls back to <body>.
  document.addEventListener('keydown', (e) => { if (S.open) { onKey(e); if (e.key === 'Escape') e.stopPropagation(); } }, true);
  root.addEventListener('pointermove', (e) => {
    S.tx = (e.clientX / window.innerWidth) * 2 - 1;
    S.ty = (e.clientY / window.innerHeight) * 2 - 1;
  });
  window.addEventListener('deviceorientation', (e) => {
    if (!S.open || e.gamma == null) return;
    S.tx = Math.max(-1, Math.min(1, e.gamma / 25));
    S.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
  });
  window.addEventListener('resize', () => { if (S.open) { layoutHub(); S.fx && S.fx.resize(); } });
  window.addEventListener('popstate', () => {
    if (S.open && S.pushed) { S.pushed = false; close({ fromPop: true }); }
  });
  document.addEventListener('visibilitychange', () => {
    if (!S.open) return;
    if (document.hidden) cancelAnimationFrame(S.raf); else startLoop();
  });

  root.addEventListener('click', (e) => {
    const gate = e.target.closest('.ar-gate');
    if (gate) return travel(gate.dataset.realm, gate);
    const act = e.target.closest('[data-act]');
    if (act) return action(act.dataset.act, act);
    const adv = e.target.closest('.ar-adv');
    if (adv) return openAdvisor(adv.dataset.slug);
    const choice = e.target.closest('.ar-choice');
    if (choice) return choose(+choice.dataset.i);
    const vcard = e.target.closest('.ar-vcard');
    if (vcard) return hallPick(vcard.dataset.slug);
    const filt = e.target.closest('.ar-filter');
    if (filt) return renderHall(filt.dataset.realm);
  });
}

function action(act, el) {
  if (act === 'hall') openHall();
  else if (act === 'creed') openCreed();
  else if (act === 'guide') openDialogue({ kind: 'guide' });
  else if (act === 'host') openDialogue({ kind: 'host', realm: S.view });
  else if (act === 'panel-close') closePanels();
}

const isAdvanceKey = (e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar';
const narrating = (sel) => { const el = $(sel); return !el.hidden && !el.classList.contains('done'); };

function onKey(e) {
  // Opening / closing narration: Enter or Space advances, Esc leaves at once.
  if (narrating('.ar-outro')) {
    if (e.key === 'Escape') { e.preventDefault(); return finishOutro(); }
    if (isAdvanceKey(e) && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ar-narr-x'))) { e.preventDefault(); leaveOutro(); }
    return;
  }
  if (narrating('.ar-intro')) {
    if (e.key === 'Escape') { e.preventDefault(); return exitNow(); }
    if (isAdvanceKey(e) && !(document.activeElement && document.activeElement.closest && document.activeElement.closest('.ar-narr-x'))) { e.preventDefault(); advanceIntro(); }
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    if (!$('.ar-hall').hidden || !$('.ar-creed').hidden) return closePanels();
    if (S.dlg) return closeDialogue();
    return close();
  }
  if (S.dlg && /^[1-4]$/.test(e.key) && document.activeElement !== $('.ar-dlg-input')) {
    const b = root.querySelectorAll('.ar-choice')[+e.key - 1];
    if (b) { e.preventDefault(); b.click(); }
  }
}

/* ---------- scenes ---------- */
function renderWorld(id) {
  const r = realmById(id);
  const hub = id === 'axial';
  // Hub: painted Axial backdrop (HUB.realmBackdrop); entry cinematic still uses SHRINE_IMAGE.
  const painted = hub ? realmBackdropPath(HUB) : realmBackdropPath(r);
  const fallback = hub ? SCENES.axial() : SCENES[id]();
  const sc = painted ? paintedScene(painted, fallback) : (hub ? SCENES.axial(SHRINE_IMAGE) : fallback);
  $('.ar-sky').style.background = sc.sky;
  $('.ar-fog').style.background = sc.fog || 'none';
  $('.ar-layers').innerHTML = sc.layers.map((l) => `<div class="ar-layer" data-depth="${l.depth}">${l.html}</div>`).join('');
  root.dataset.realm = id;
  root.classList.toggle('ar-painted', !!painted);
  root.style.setProperty('--rc', r ? r.color : '#f1d58e');
  if (S.fx) S.fx.setMode(r ? r.particles : 'prism');
}

/** Painted realm backdrop (cover, centered) with a soft veil; fog + FX particles stay on top. */
function paintedScene(img, fallback) {
  return {
    sky: fallback.sky,
    fog: fallback.fog,
    layers: [
      { depth: 0.08, html: `<div class="ar-l ar-l-img ar-l-realm" style="background-image:url('${img}')"></div>` },
      { depth: 0.14, html: `<div class="ar-l ar-l-realmveil"></div>` }
    ]
  };
}

function setTitle(main, sub) {
  $('.ar-title-main').textContent = main;
  $('.ar-title-sub').textContent = sub;
}

function hint(text) {
  const h = $('.ar-hint');
  h.textContent = text || '';
  h.classList.toggle('show', !!text);
}

function renderHub() {
  const gates = HUB_ORDER.map((id) => realmById(id)).concat([realmById('shadow')]).map((r) =>
    `<button type="button" class="ar-gate${r.id === 'shadow' ? ' ar-gate-shadow' : ''}${realmDone(r.id) ? ' done' : ''}" data-realm="${r.id}" style="--c:${r.color}" aria-label="Travel to the ${esc(r.name)} Realm, ${esc(r.temple)}">` +
    `<span class="ar-gate-arch"><span class="ar-gate-portal">${gateGlyph(r.id)}</span></span>` +
    `<span class="ar-gate-name">${esc(r.name)}</span><span class="ar-gate-sub">${esc(r.guardian.name)}</span><i class="ar-gate-done" aria-hidden="true">✓</i></button>`).join('');
  $('.ar-hubui').innerHTML =
    `<div class="ar-thread" aria-hidden="true"></div>` +
    `<button type="button" class="ar-orb" data-act="creed" aria-label="The one whole at the axis: read ${esc(CREED.title)}"><span></span></button>` +
    `<div class="ar-gates">${gates}</div>` +
    guideHostHtml() +
    `<div class="ar-hubbar"><button type="button" class="ar-pill" data-act="hall">✦ Hall of Virtues</button><button type="button" class="ar-pill" data-act="creed">❦ The Creed</button></div>`;
  layoutHub();
  wireIrishnuPortraitFallback();
}

/** Hub Guide host: painted Irishnu when present, else the drawn Guide figure. */
function guideHostHtml() {
  const photo = irishnuPhoto();
  const fig = `${figureSvg('irishnu', 'irs')}<span class="ar-host-name">Irishnu</span>`;
  if (!photo) {
    return `<button type="button" class="ar-host ar-guide" data-act="guide" aria-label="Speak with Irishnu, ${esc(GUIDE.title)}">${fig}</button>`;
  }
  return `<button type="button" class="ar-host ar-guide ar-host-photo" data-act="guide" aria-label="Speak with Irishnu, ${esc(GUIDE.title)}">` +
    `<span class="ar-gframe"><img src="${esc(photo)}" alt="" loading="lazy" decoding="async"></span><span class="ar-host-name">Irishnu</span></button>`;
}
function irishnuPhoto() {
  const p = irishnuPortraitPath();
  return p && !S.badPortraits.has(p) ? p : null;
}
function wireIrishnuPortraitFallback() {
  const img = $('.ar-guide.ar-host-photo img');
  if (!img) return;
  img.addEventListener('error', () => {
    const p = irishnuPortraitPath(); if (p) S.badPortraits.add(p);
    const b = $('.ar-guide.ar-host-photo'); if (!b) return;
    b.classList.remove('ar-host-photo');
    b.innerHTML = `${figureSvg('irishnu', 'irs')}<span class="ar-host-name">Irishnu</span>`;
  }, { once: true });
}

function layoutHub() {
  if (!root || S.view !== 'axial') return;
  const w = window.innerWidth, h = window.innerHeight;
  const mobile = w < 700;
  const cx = w / 2, cy = h * (mobile ? 0.42 : 0.5);
  const rx = mobile ? w * 0.36 : Math.min(w * 0.36, 540);
  const ry = mobile ? h * (h < 720 ? 0.28 : 0.25) : Math.min(h * 0.36, 300);
  const gates = root.querySelectorAll('.ar-gate');
  gates.forEach((g, i) => {
    let x, y;
    if (g.dataset.realm === 'shadow') { x = cx; y = cy + ry * 0.62; } else {
      const th = (170 - i * 32) * Math.PI / 180;
      x = cx + rx * Math.cos(th); y = cy - ry * Math.sin(th);
    }
    g.style.left = `${x}px`; g.style.top = `${y}px`;
    g.style.animationDelay = `${-i * 0.9}s`;
  });
  const orb = $('.ar-orb');
  if (orb) { orb.style.left = `${cx}px`; orb.style.top = `${cy}px`; }
}

function renderRealmUI(id) {
  const r = realmById(id);
  const advisors = advisorsFor(id);
  const fig = FIGURE_FOR[id];
  const strip = advisors.length
    ? `<div class="ar-advisors"><div class="ar-adv-head">Advisors of ${esc(r.name)} <span>· ${advisors.length}</span></div><div class="ar-adv-row">` +
      advisors.map((v, i) => `<button type="button" class="ar-adv" data-slug="${v.slug}" style="animation-delay:${-i * 1.3}s" aria-label="Speak with the ${esc(advisorTitle(v))}">` +
        `<span class="ar-frame"><img src="${v.portrait}" alt="" loading="lazy" decoding="async"></span><span class="ar-adv-name">${esc(v.name)}</span></button>`).join('') +
      `</div></div>`
    : '';
  const photo = portraitFor(r);
  const figureHost = `${figureSvg(fig, 'h' + id)}<span class="ar-host-name">${esc(r.guardian.name)}</span>`;
  const host = photo
    ? `<button type="button" class="ar-host ar-host-photo" data-act="host" aria-label="Speak with ${esc(guardianLine(r))}">` +
      `<span class="ar-gframe"><img src="${esc(photo)}" alt="" loading="lazy" decoding="async"></span><span class="ar-host-name">${esc(r.guardian.name)}</span></button>`
    : `<button type="button" class="ar-host" data-act="host" aria-label="Speak with ${esc(guardianLine(r))}">${figureHost}</button>`;
  $('.ar-realmui').innerHTML = host + strip;
  if (photo) {
    // Missing or broken portrait file → fall back to the drawn figure for the rest of the visit.
    const img = $('.ar-host-photo img');
    img.addEventListener('error', () => {
      S.badPortraits.add(photo);
      const b = $('.ar-host-photo'); if (!b) return;
      b.classList.remove('ar-host-photo'); b.innerHTML = figureHost;
    }, { once: true });
  }
  const lore = $('.ar-lore');
  const tags = (r.virtues.length ? r.virtues : r.aspects || []).slice(0, 8).map((v) => `<span>${esc(v)}</span>`).join('');
  lore.innerHTML = `<div class="ar-lore-temple">${esc(r.temple)}</div><p class="ar-lore-guardian">${esc(guardianLine(r))}</p><p>${esc(r.templeDesc)}</p><p class="ar-lore-land">${esc(r.landscape)}</p><div class="ar-lore-tags">${tags}</div>`;
  lore.hidden = false;
}

function showView(id) {
  S.view = id;
  closeDialogue(true);
  renderWorld(id);
  const hub = id === 'axial';
  $('.ar-hubui').hidden = !hub;
  $('.ar-realmui').hidden = hub;
  $('.ar-back').hidden = hub;
  if (hub) {
    $('.ar-lore').hidden = true;
    setTitle(HUB.name, 'The one whole that holds every realm');
    renderHub();
    hint('Tap a gate to travel · tap Irishnu to talk');
  } else {
    const r = realmById(id);
    setTitle(`The ${r.name} Realm`, `${r.temple} · ${guardianSub(r)}`);
    renderRealmUI(id);
    const n = advisorsFor(id).length;
    hint(`Tap ${r.guardian.source === 'notes' ? r.guardian.name : 'the Guardian'} to speak${n ? ` · ${n} advisor${n > 1 ? 's' : ''} wait here` : ''}`);
  }
  S.px = S.tx; S.py = S.ty;
  applyParallax(true);
}

/** Header sub-line: "Valorix, Guardian of Courage" / "Guardian of the Veil, the Veiled Sentinel". */
function guardianSub(r) {
  return r.guardian.source === 'notes' ? `${r.guardian.name}, ${guardianRole(r)}` : `${r.guardian.name}, ${r.guardian.title}`;
}
/** A Guardian's portrait (assets/aretoria/guardians/<slug>.jpg) when set and not known to be broken. */
function portraitFor(r) {
  const p = guardianPortraitPath(r);
  return p && !S.badPortraits.has(p) ? p : null;
}

function travel(id, fromEl) {
  if (id === S.view) return;
  closePanels();
  const r = realmById(id);
  const flash = $('.ar-flash');
  flash.style.setProperty('--fc', r ? r.color : '#f1d58e');
  if (reduced()) { showView(id); return Promise.resolve(); }
  if (fromEl) fromEl.classList.add('ar-going');
  flash.classList.remove('out'); flash.classList.add('in');
  return new Promise((res) => setTimeout(() => {
    showView(id);
    flash.classList.remove('in'); flash.classList.add('out');
    setTimeout(() => { flash.classList.remove('out'); res(); }, 650);
  }, 420));
}

/* ---------- parallax + particles loop ---------- */
function applyParallax(force) {
  if (reduced() && !force) return;
  const k = reduced() ? 0 : 1;
  root.querySelectorAll('.ar-layer').forEach((el) => {
    const d = +el.dataset.depth;
    el.style.transform = `translate3d(${(-S.px * d * 26 * k).toFixed(1)}px, ${(-S.py * d * 14 * k).toFixed(1)}px, 0) scale(1.06)`;
  });
  const host = root.querySelectorAll('.ar-host, .ar-advisors');
  host.forEach((el) => { el.style.translate = `${(-S.px * 30 * k).toFixed(1)}px ${(-S.py * 10 * k).toFixed(1)}px`; });
}

function startLoop() {
  cancelAnimationFrame(S.raf);
  if (reduced()) { S.fx && S.fx.drawStatic(); return; }
  S.lastT = performance.now();
  const tick = (t) => {
    const dt = Math.min(0.05, (t - S.lastT) / 1000); S.lastT = t;
    S.px += (S.tx - S.px) * 0.05; S.py += (S.ty - S.py) * 0.05;
    applyParallax();
    if (S.fx) S.fx.step(dt);
    S.raf = requestAnimationFrame(tick);
  };
  S.raf = requestAnimationFrame(tick);
}

class FX {
  constructor(canvas) { this.c = canvas; this.g = canvas.getContext('2d'); this.parts = []; this.mode = 'prism'; this.sprites = {}; this.t = 0; this.resize(); }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.seed();
  }
  sprite(color) {
    if (this.sprites[color]) return this.sprites[color];
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const g = s.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, color); gr.addColorStop(0.25, color + 'aa'); gr.addColorStop(1, color + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (this.sprites[color] = s);
  }
  setMode(m) { this.mode = m; this.seed(); if (reduced()) this.drawStatic(); }
  seed() {
    const { w, h } = this, R = Math.random, area = Math.min(1, (w * h) / (1400 * 850));
    const n = (k) => Math.max(8, Math.round(k * (0.45 + 0.55 * area)));
    const P = [];
    const mk = (o) => P.push(Object.assign({ x: R() * w, y: R() * h, r: 1.5, a: 1, ph: R() * 6.28, vx: 0, vy: 0, kind: 'glow', c: '#ffffff' }, o));
    switch (this.mode) {
      case 'motes': for (let i = 0; i < n(70); i++) mk({ r: 1 + R() * 2.6, vy: -(6 + R() * 14), sw: 10 + R() * 20, c: ['#cfe6ff', '#ffffff', '#ffe9a8', '#c9a7f0'][i % 4] });
        for (let i = 0; i < n(8); i++) mk({ kind: 'scroll', r: 7 + R() * 5, vy: -(5 + R() * 6), sw: 18, rot: R() * 6 });
        break;
      case 'embers': for (let i = 0; i < n(95); i++) mk({ r: 0.8 + R() * 2, vy: -(30 + R() * 70), vx: 8 + R() * 18, sw: 14, c: ['#ffb347', '#ff6a2a', '#ffd27a'][i % 3], kind: 'ember' }); break;
      case 'lanterns': for (let i = 0; i < n(14); i++) mk({ kind: 'lantern', r: 6 + R() * 8, vy: -(6 + R() * 10), sw: 14 });
        for (let i = 0; i < n(45); i++) mk({ r: 1 + R() * 1.6, vy: -(2 + R() * 6), vx: (R() - 0.5) * 10, sw: 26, c: ['#d9ff9a', '#ffe08a'][i % 2], kind: 'firefly' });
        break;
      case 'dust': for (let i = 0; i < n(80); i++) mk({ r: 0.6 + R() * 1.6, vy: 3 + R() * 6, vx: 4 + R() * 6, sw: 6, c: ['#fff6d8', '#f1d58e', '#ffffff'][i % 3] }); break;
      case 'mist': for (let i = 0; i < n(12); i++) mk({ kind: 'blob', r: 160 + R() * 240, vx: 6 + R() * 12, y: h * (0.45 + R() * 0.5), c: ['#ffffff', '#c9f0ea'][i % 2], a: 0.06 + R() * 0.07 });
        for (let i = 0; i < n(24); i++) mk({ r: 1 + R() * 1.6, vy: -(3 + R() * 5), sw: 14, c: '#ffffff' });
        break;
      case 'stars': for (let i = 0; i < n(150); i++) mk({ r: 0.5 + R() * 1.5, sw: 0, c: ['#ffffff', '#f2d8ff', '#c9e2ff'][i % 3], kind: 'star', y: R() * h * 0.8 });
        this.shoot = 3; break;
      case 'fog': for (let i = 0; i < n(12); i++) mk({ kind: 'blob', r: 180 + R() * 260, vx: 4 + R() * 8, y: h * (0.4 + R() * 0.6), c: ['#6a4f9a', '#3b2a5c'][i % 2], a: 0.08 + R() * 0.08 });
        for (let i = 0; i < n(7); i++) mk({ r: 3 + R() * 3, vy: -(1 + R() * 3), sw: 10, c: '#d8a8ff', kind: 'dim' });
        break;
      default: for (let i = 0; i < n(80); i++) { const x = w / 2 + (R() + R() + R() - 1.5) * w * 0.35; mk({ x, r: 1 + R() * 2.4, vy: -(8 + R() * 18), sw: 12, c: ['#ff9aa8', '#ffd27a', '#9ef0c8', '#7fb8ff', '#c9a7f0', '#fff1c1'][i % 6] }); }
    }
    this.parts = P;
  }
  step(dt) { this.t += dt; this.update(dt); this.draw(); }
  update(dt) {
    const { w, h } = this;
    for (const p of this.parts) {
      p.ph += dt;
      p.x += (p.vx + (p.sw ? Math.sin(p.ph * 0.8) * p.sw * 0.05 : 0)) * dt * (p.kind === 'blob' ? 1 : 1);
      p.y += p.vy * dt;
      if (p.kind === 'blob') { if (p.x - p.r > w) p.x = -p.r; continue; }
      if (p.y < -30) { p.y = h + 20; p.x = Math.random() * w; }
      if (p.y > h + 30) { p.y = -20; p.x = Math.random() * w; }
      if (p.x > w + 30) p.x = -20; if (p.x < -30) p.x = w + 20;
    }
    if (this.mode === 'stars') {
      this.shoot -= dt;
      if (this.shoot <= 0) { this.shoot = 5 + Math.random() * 6; this.meteor = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, t: 0 }; }
      if (this.meteor) { this.meteor.t += dt; if (this.meteor.t > 1) this.meteor = null; }
    }
  }
  draw() {
    const g = this.g; g.clearRect(0, 0, this.w, this.h);
    g.globalCompositeOperation = 'lighter';
    for (const p of this.parts) {
      let a = p.a;
      if (p.kind === 'blob') { g.globalAlpha = a; const s = this.sprite(p.c); g.drawImage(s, p.x - p.r, p.y - p.r * 0.5, p.r * 2, p.r); continue; }
      if (p.kind === 'star') a = 0.35 + 0.65 * Math.abs(Math.sin(p.ph * 1.3));
      else if (p.kind === 'ember') a = Math.max(0, Math.min(1, p.y / this.h)) * (0.6 + 0.4 * Math.sin(p.ph * 9));
      else if (p.kind === 'firefly') a = 0.2 + 0.8 * Math.max(0, Math.sin(p.ph * 2));
      else if (p.kind === 'dim') a = 0.3 + 0.3 * Math.sin(p.ph * 7) * Math.sin(p.ph * 3);
      else a = 0.5 + 0.5 * Math.sin(p.ph * 1.7);
      g.globalAlpha = Math.max(0, a);
      if (p.kind === 'lantern') { this.lantern(g, p); continue; }
      if (p.kind === 'scroll') { this.scroll(g, p); continue; }
      const s = this.sprite(p.c), rr = p.r * (p.kind === 'dim' ? 6 : 4);
      g.drawImage(s, p.x - rr, p.y - rr, rr * 2, rr * 2);
    }
    if (this.meteor) {
      const m = this.meteor, x = m.x + m.t * 420, y = m.y + m.t * 160;
      const gr = g.createLinearGradient(x - 120, y - 46, x, y);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.9)');
      g.globalAlpha = 1 - m.t; g.strokeStyle = gr; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x - 120, y - 46); g.lineTo(x, y); g.stroke();
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
  lantern(g, p) {
    g.globalCompositeOperation = 'lighter';
    const s = this.sprite('#ffb257'); const rr = p.r * 4;
    g.globalAlpha = 0.55; g.drawImage(s, p.x - rr, p.y - rr, rr * 2, rr * 2);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.95;
    g.fillStyle = '#ffcf7a'; g.beginPath();
    const w = p.r * 1.1, h = p.r * 1.5;
    g.moveTo(p.x - w * 0.8, p.y - h * 0.5); g.quadraticCurveTo(p.x, p.y - h * 0.9, p.x + w * 0.8, p.y - h * 0.5);
    g.lineTo(p.x + w * 0.6, p.y + h * 0.5); g.lineTo(p.x - w * 0.6, p.y + h * 0.5); g.closePath(); g.fill();
    g.fillStyle = '#fff3d0'; g.fillRect(p.x - w * 0.25, p.y - h * 0.1, w * 0.5, h * 0.45);
    g.globalCompositeOperation = 'lighter';
  }
  scroll(g, p) {
    g.globalCompositeOperation = 'source-over';
    g.save(); g.translate(p.x, p.y); g.rotate(Math.sin(p.ph * 0.5) * 0.4 + p.rot);
    g.globalAlpha = 0.55; g.fillStyle = '#f3e6c4'; g.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
    g.fillStyle = '#d9b56a'; g.fillRect(-p.r - 2, -p.r * 0.55, 3, p.r * 1.1); g.fillRect(p.r - 1, -p.r * 0.55, 3, p.r * 1.1);
    g.strokeStyle = 'rgba(120,90,40,.5)'; g.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-p.r * 0.7, i * p.r * 0.22); g.lineTo(p.r * 0.7, i * p.r * 0.22); g.stroke(); }
    g.restore(); g.globalCompositeOperation = 'lighter';
  }
  drawStatic() { this.draw(); }
}

/* ---------- dialogue (visual-novel style) ---------- */
function speakerFor(opts) {
  if (opts.kind === 'guide') {
    const photo = irishnuPhoto();
    return {
      name: GUIDE.name, title: GUIDE.title, tree: GUIDE.dialogue, key: null, el: '.ar-guide',
      portrait: photo ? `<img src="${esc(photo)}" alt="" class="ar-gport">` : figureSvg('irishnu', 'pirs', true),
      stage: photo ? { src: photo, label: `${GUIDE.name} ${GUIDE.title}`, wide: true } : null,
      guide: true
    };
  }
  if (opts.kind === 'host') {
    const r = realmById(opts.realm);
    const g = r.guardian;
    const photo = portraitFor(r);
    return { name: g.name, title: g.source === 'notes' ? `${guardianRole(r)} · ${g.warrior}` : `${g.title} · Shadow Realm`, tree: r.dialogue,
      portrait: photo ? `<img src="${esc(photo)}" alt="" class="ar-gport">` : figureSvg(FIGURE_FOR[r.id], 'p' + r.id, true),
      key: reflectionKey(todayIso(), r.id), el: '.ar-realmui .ar-host',
      stage: photo ? { src: photo, label: guardianLine(r), wide: true } : null, realm: r };
  }
  const v = opts.virtue;
  return { name: advisorTitle(v), title: `${realmById(v.realm).name} Realm`, tree: advisorDialogue(v),
    portrait: `<img src="${v.portrait}" alt="">`, key: advisorKey(todayIso(), v), el: `.ar-adv[data-slug="${v.slug}"]`, virtue: v };
}

function openDialogue(opts) {
  closeDialogue(true);
  rememberFocus();
  const sp = speakerFor(opts);
  S.dlg = { ...sp, opts, ctx: tokenContext(new Date()), node: sp.tree.start };
  const d = $('.ar-dlg');
  d.classList.toggle('ar-dlg-photo', !!sp.virtue);
  $('.ar-dlg-portrait').innerHTML = sp.portrait;
  const gp = $('.ar-dlg-portrait .ar-gport');
  if (gp) gp.addEventListener('error', () => {
    S.badPortraits.add(gp.getAttribute('src'));
    if (sp.realm) $('.ar-dlg-portrait').innerHTML = figureSvg(FIGURE_FOR[sp.realm.id], 'p' + sp.realm.id, true);
    else if (sp.guide) $('.ar-dlg-portrait').innerHTML = figureSvg('irishnu', 'pirs', true);
  }, { once: true });
  $('.ar-dlg-name').innerHTML = `${esc(sp.name)}<span>${esc(sp.title)}</span>`;
  d.setAttribute('aria-label', `Conversation with ${sp.name}`);
  d.hidden = false;
  root.classList.add('ar-talking');
  const el = sp.el && root.querySelector(sp.el);
  if (el) el.classList.add('speaking');
  if (sp.virtue) showStage({ src: sp.virtue.portrait, label: advisorTitle(sp.virtue), wide: !!sp.virtue.wide });
  else if (sp.stage) showStage(sp.stage);
  hint('');
  renderNode(S.dlg.node);
}

function showStage({ src, label, wide }) {
  const st = $('.ar-stage');
  st.innerHTML = `<div class="ar-stage-frame${wide ? ' wide' : ''}"><img src="${esc(src)}" alt="Portrait of ${/^Advisor/.test(label) ? 'the ' : ''}${esc(label)}"></div><div class="ar-stage-name">${esc(label)}</div>`;
  st.hidden = false;
  const img = st.querySelector('img');
  img.addEventListener('error', () => { S.badPortraits.add(src); st.classList.remove('show'); st.hidden = true; st.innerHTML = ''; }, { once: true });
  requestAnimationFrame(() => st.classList.add('show'));
}

function closeDialogue(silent) {
  clearInterval(S.typing); S.typing = null;
  if (!root) return;
  $('.ar-dlg').hidden = true;
  root.classList.remove('ar-talking');
  root.querySelectorAll('.speaking').forEach((e) => e.classList.remove('speaking'));
  const st = $('.ar-stage'); st.classList.remove('show'); st.hidden = true; st.innerHTML = '';
  const wasOpen = !!S.dlg;
  S.dlg = null;
  if (wasOpen) restoreFocus();
  if (wasOpen && !silent) hint(S.view === 'axial' ? 'Tap a gate to travel · tap Irishnu to talk' : 'Tap the Guardian or an advisor to speak');
}

function renderNode(id) {
  const D = S.dlg; if (!D) return;
  const node = D.tree.nodes[id]; D.node = id;
  const text = fillTokens(node.text, D.ctx);
  const tEl = $('.ar-dlg-text');
  const choices = $('.ar-dlg-choices');
  const input = $('.ar-dlg-input');
  $('.ar-dlg-status').textContent = '';
  choices.innerHTML = node.choices.map((c, i) => `<button type="button" class="ar-choice" data-i="${i}"><b>${i + 1}</b>${esc(fillTokens(c.label, D.ctx))}</button>`).join('');
  choices.classList.add('pending');
  if (node.input && D.key) {
    input.hidden = false;
    input.placeholder = node.input.placeholder || '';
    input.value = readKey(D.key);
  } else input.hidden = true;
  clearInterval(S.typing);
  const done = () => {
    clearInterval(S.typing); S.typing = null;
    tEl.textContent = text; choices.classList.remove('pending');
    if (!input.hidden && !matchMedia('(pointer: coarse)').matches) input.focus({ preventScroll: true });
    else { const b = choices.querySelector('.ar-choice'); if (b && !matchMedia('(pointer: coarse)').matches) b.focus({ preventScroll: true }); }
  };
  S.finishTyping = done;
  if (reduced()) return done();
  let i = 0; tEl.textContent = '';
  S.typing = setInterval(() => {
    i += 2; tEl.textContent = text.slice(0, i);
    if (i >= text.length) done();
  }, 18);
}
function finishTyping() { if (S.typing && S.finishTyping) S.finishTyping(); }

function choose(i) {
  const D = S.dlg; if (!D) return;
  if (S.typing) { finishTyping(); return; }
  const node = D.tree.nodes[D.node];
  const c = node.choices[i]; if (!c) return;
  if (c.save && D.key) {
    const ok = writeKey(D.key, $('.ar-dlg-input').value);
    $('.ar-dlg-status').textContent = ok ? 'Kept for today, in this browser only' : 'Could not save';
    const realm = D.virtue ? D.virtue.realm : (D.opts.realm || null);
    if (realm) { const g = root.querySelector(`.ar-gate[data-realm="${realm}"]`); if (g) g.classList.toggle('done', realmDone(realm)); }
  }
  if (D.opts.kind === 'guide') { try { localStorage.setItem(MET_KEY, '1'); } catch { /* ignore */ } }
  const next = fillTokens(c.next, D.ctx);
  if (next === '@close') return closeDialogue();
  if (next === '@hub') { closeDialogue(true); return travel('axial'); }
  if (next === '@hall') { closeDialogue(true); return openHall(); }
  if (next === '@creed') { closeDialogue(true); return openCreed(); }
  if (next.startsWith('@realm:')) { closeDialogue(true); return travel(next.slice(7)); }
  renderNode(next);
}

function openAdvisor(slug) {
  const v = virtueBySlug(slug);
  if (!v || !v.portrait) return;
  openDialogue({ kind: 'advisor', virtue: v });
}

/* ---------- Hall of Virtues ---------- */
function openHall() {
  closeDialogue(true);
  rememberFocus();
  $('.ar-creed').hidden = true;
  renderHall('all');
  const h = $('.ar-hall'); h.hidden = false; h.scrollTop = 0;
  requestAnimationFrame(() => h.classList.add('show'));
  const c = h.querySelector('.ar-panel-close'); if (c) c.focus({ preventScroll: true });
}

function renderHall(filter) {
  const list = filter === 'all' ? VIRTUES : VIRTUES.filter((v) => v.realm === filter);
  const revealed = VIRTUES.filter((v) => v.portrait).length;
  const realmsIn = REALMS.filter((r) => VIRTUES.some((v) => v.realm === r.id));
  $('.ar-hall').innerHTML =
    `<button type="button" class="ar-btn ar-panel-close" data-act="panel-close" aria-label="Close the Hall of Virtues">✕</button>` +
    `<div class="ar-panel-inner"><h2>Hall of Virtues</h2>` +
    `<p class="ar-hall-lead">The virtues I seek to compound within myself:</p>` +
    `<p class="ar-hall-count">${VIRTUES.length} virtues · ${revealed} advisors revealed</p>` +
    `<div class="ar-filters"><button type="button" class="ar-filter${filter === 'all' ? ' on' : ''}" data-realm="all">All</button>` +
    realmsIn.map((r) => `<button type="button" class="ar-filter${filter === r.id ? ' on' : ''}" data-realm="${r.id}" style="--c:${r.color}"><i></i>${esc(r.name)}</button>`).join('') + `</div>` +
    `<div class="ar-vgrid">` + list.map((v) => {
      const r = realmById(v.realm);
      const art = v.portrait
        ? `<span class="ar-vart"><img src="${v.portrait}" alt="" loading="lazy" decoding="async"></span>`
        : `<span class="ar-vart ar-vveil">${gateGlyph(v.realm)}<em>portrait not yet revealed</em></span>`;
      return `<button type="button" class="ar-vcard${v.portrait ? ' has' : ''}" data-slug="${v.slug}" style="--c:${r.color}" ${v.portrait ? `aria-label="Speak with the ${esc(advisorTitle(v))}"` : `aria-label="${esc(v.name)}: portrait not yet revealed"`}>` +
        art + `<span class="ar-vname">${esc(v.name)}</span><span class="ar-vrealm"><i></i>${esc(r.name)}</span><span class="ar-vess">${esc(v.essence)}</span></button>`;
    }).join('') + `</div></div>`;
}

function hallPick(slug) {
  const v = virtueBySlug(slug); if (!v) return;
  if (!v.portrait) {
    const card = root.querySelector(`.ar-vcard[data-slug="${slug}"]`);
    if (card) card.classList.toggle('open');
    return;
  }
  closePanels();
  const go = S.view === v.realm ? Promise.resolve() : travel(v.realm);
  Promise.resolve(go).then(() => openAdvisor(slug));
}

/* ---------- Creed ---------- */
function openCreed() {
  closeDialogue(true);
  rememberFocus();
  $('.ar-hall').hidden = true;
  const c = $('.ar-creed');
  c.innerHTML =
    `<button type="button" class="ar-btn ar-panel-close" data-act="panel-close" aria-label="Close the Creed">✕</button>` +
    `<article class="ar-tablet"><div class="ar-tablet-orn" aria-hidden="true">✦</div><h2>${esc(CREED.title)}</h2>` +
    CREED.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('') +
    `<div class="ar-tablet-rule" aria-hidden="true"><span></span>❦<span></span></div>` +
    `<div class="ar-affirm">${CREED.affirmation.map((l) => `<p>${esc(l)}</p>`).join('')}</div>` +
    `<div class="ar-tablet-orn" aria-hidden="true">✦</div></article>`;
  c.hidden = false; c.scrollTop = 0;
  requestAnimationFrame(() => c.classList.add('show'));
  c.querySelector('.ar-panel-close').focus({ preventScroll: true });
}

function rememberFocus() {
  const a = document.activeElement;
  if (a && a !== document.body && root.contains(a) && !a.closest('.ar-panel, .ar-dlg')) S.ret = a;
}
function restoreFocus() {
  const r = S.ret; S.ret = null;
  if (!S.open) return;
  const t = r && r.isConnected && r.offsetParent !== null ? r : $('.ar-x');
  t.focus({ preventScroll: true });
}

function closePanels() {
  if (!root) return;
  let was = false;
  ['.ar-hall', '.ar-creed'].forEach((s) => { const p = $(s); if (!p.hidden) was = true; p.classList.remove('show'); p.hidden = true; });
  if (was) restoreFocus();
}

/* ---------- entry + exit ---------- */
/* The opening and closing lines hold for readMs(text) (≈4 s + 60 ms per character) so they
   can be read comfortably; a subtle "tap to continue" hint appears, and a tap/click
   anywhere, Enter or Space moves on sooner. Esc or ✕ leaves Aretoria at once. Reduced
   motion: no zoom or fades, same reading time. */
const LINE_FADE_IN_MS = 1300; // .35 s delay + ~1 s rise before the opening line is fully visible

function showNarrHint(el) {
  const h = el.querySelector('.ar-narr-hint');
  h.textContent = continueText();
  h.classList.remove('show');
  return setTimeout(() => h.classList.add('show'), reduced() ? 0 : HINT_DELAY_MS);
}

function startIntro(target) {
  const intro = $('.ar-intro');
  S.introTarget = target || null;
  intro.hidden = false;
  intro.className = 'ar-intro';
  const img = $('.ar-intro-img');
  img.style.backgroundImage = `url('${SHRINE_IMAGE}')`;
  // Place the zoom origin + gold arch on the shrine's glowing doorway (≈55.5%, 33% of the photo).
  const W = window.innerWidth, H = window.innerHeight, iw = 900, ih = 675;
  const s = Math.max(W / iw, H / ih);
  const ox = (W - iw * s) / 2 + 0.555 * iw * s, oy = (H - ih * s) / 2 + 0.36 * ih * s;
  intro.style.setProperty('--ox', `${ox}px`); intro.style.setProperty('--oy', `${oy}px`);
  intro.style.setProperty('--as', `${(0.24 * ih * s) / 170}`);
  $('.ar-intro-line').textContent = OPENING;
  S.introTimer.forEach(clearTimeout); S.introTimer = [];
  S.introTimer.push(showNarrHint(intro));
  const hold = readMs(OPENING);
  if (reduced()) {
    intro.classList.add('still');
    S.introTimer.push(setTimeout(finishIntro, hold));
    return;
  }
  requestAnimationFrame(() => intro.classList.add('play'));
  S.introTimer.push(setTimeout(beginIntroZoom, LINE_FADE_IN_MS + hold));
}

/** Fly through the shrine doorway, then enter the hub (or the requested realm). */
function beginIntroZoom() {
  const intro = $('.ar-intro');
  if (intro.hidden || intro.classList.contains('zoom') || intro.classList.contains('done')) return;
  S.introTimer.forEach(clearTimeout); S.introTimer = [];
  intro.classList.add('zoom');
  S.introTimer.push(setTimeout(() => intro.classList.add('flare'), 800));
  S.introTimer.push(setTimeout(finishIntro, 1200));
}

/** User asked to continue: play the short fly-through (or skip straight on if it is already playing / motion is reduced). */
function advanceIntro() {
  const intro = $('.ar-intro');
  if (intro.hidden || intro.classList.contains('done')) return;
  if (reduced() || intro.classList.contains('zoom')) return finishIntro();
  beginIntroZoom();
}

function finishIntro() {
  const intro = $('.ar-intro');
  if (intro.hidden || intro.classList.contains('done')) return;
  S.introTimer.forEach(clearTimeout); S.introTimer = [];
  intro.classList.add('done');
  setTimeout(() => { intro.hidden = true; intro.className = 'ar-intro'; }, reduced() ? 50 : 450);
  if (document.activeElement === intro || !root.contains(document.activeElement)) $('.ar-x').focus({ preventScroll: true });
  const t = S.introTarget; S.introTarget = null;
  if (t && realmById(t)) { showView(t); return; }
  let met = false; try { met = !!localStorage.getItem(MET_KEY); } catch { /* ignore */ }
  if (!met) setTimeout(() => { if (S.open && S.view === 'axial') openDialogue({ kind: 'guide' }); }, reduced() ? 60 : 500);
}

/** Esc / ✕ during the opening line: leave Aretoria straight away (no closing line). */
function exitNow() {
  S.introTimer.forEach(clearTimeout); S.introTimer = [];
  $('.ar-intro').hidden = true;
  close({ immediate: true });
}

export async function openAretoria(opts = {}) {
  await ensureCss();
  if (!root) build();
  if (S.open) { if (opts.realm) travel(opts.realm); return; }
  S.open = true;
  S.returnFocus = opts.returnFocus || document.activeElement;
  root.hidden = false;
  $('.ar-outro').hidden = true;
  document.documentElement.classList.add('ar-lock');
  try { history.pushState({ aretoria: 1 }, ''); S.pushed = true; } catch { S.pushed = false; }
  if (!S.fx) S.fx = new FX($('.ar-fx')); else S.fx.resize();
  showView('axial');
  startLoop();
  startIntro(opts.realm);
  $('.ar-intro').focus({ preventScroll: true });
}

export function close(o = {}) {
  if (!S.open) return;
  const out = $('.ar-outro');
  if (!out.hidden) return finishOutro();
  closeDialogue(true); closePanels();
  S.introTimer.forEach(clearTimeout); S.introTimer = [];
  $('.ar-intro').hidden = true;
  S.closeOpts = o;
  if (o.immediate) return finishOutro();
  out.querySelector('p').textContent = CLOSING;
  out.hidden = false; out.className = 'ar-outro';
  requestAnimationFrame(() => out.classList.add('play'));
  clearTimeout(S.outroTimer); clearTimeout(S.outroHintTimer);
  S.outroHintTimer = showNarrHint(out);
  // Fade-in (~.6 s) + reading time, then a gentle fade out.
  S.outroTimer = setTimeout(leaveOutro, (reduced() ? 0 : 600) + readMs(CLOSING));
  // Keep keyboard focus inside the overlay (✕ stays reachable by Tab; Enter/Space continue).
  out.setAttribute('tabindex', '-1');
  out.focus({ preventScroll: true });
}

/** Continue past the closing line: short fade, then leave. */
function leaveOutro() {
  const out = $('.ar-outro');
  if (out.hidden || out.classList.contains('done')) return;
  clearTimeout(S.outroTimer);
  if (reduced()) return finishOutro();
  out.classList.add('done');
  S.outroTimer = setTimeout(finishOutro, 600);
}

function finishOutro() {
  clearTimeout(S.outroTimer); clearTimeout(S.outroHintTimer);
  if (!S.open) return;
  S.open = false;
  cancelAnimationFrame(S.raf);
  root.hidden = true;
  $('.ar-outro').hidden = true; $('.ar-outro').className = 'ar-outro';
  document.documentElement.classList.remove('ar-lock');
  const fromPop = S.closeOpts && S.closeOpts.fromPop;
  if (S.pushed && !fromPop) { S.pushed = false; try { history.back(); } catch { /* ignore */ } }
  S.pushed = false;
  $('.ar-layers').innerHTML = ''; $('.ar-realmui').innerHTML = ''; $('.ar-hubui').innerHTML = '';
  S.view = 'axial';
  try { window.dispatchEvent(new CustomEvent('aretoria:closed')); } catch { /* ignore */ }
  if (S.returnFocus && S.returnFocus.focus) S.returnFocus.focus({ preventScroll: true });
}

export function isOpen() { return S.open; }
export const closeAretoria = close;
