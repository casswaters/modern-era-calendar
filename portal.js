/**
 * Aretoria portal (v1): seven realm dots and a small "Enter the Realms" panel.
 * One short reflection per realm per day, kept in this browser only
 * (localStorage key "mec-realm:YYYY-MM-DD:<realm>"). Not a full app.
 */
const REALMS = [
  { id: 'wisdom', name: 'Wisdom', color: '#7fb8ff', temple: 'Prism of Insight', guardian: 'Sophia the Eternal Oracle',
    prompt: 'What am I seeing more clearly today than I did yesterday?' },
  { id: 'courage', name: 'Courage', color: '#ef7a4f', temple: 'Forge of Valor', guardian: 'Valorix the Stormheart',
    prompt: 'What is one thing I’ve been avoiding that I could face today?' },
  { id: 'humanity', name: 'Humanity', color: '#6fd39a', temple: 'Hearth of Hearts', guardian: 'Amara the Heartbloom',
    prompt: 'Who could use my empathy or loyalty today, and how will I show it?' },
  { id: 'justice', name: 'Justice', color: '#f1d58e', temple: 'Scales of Equity', guardian: 'Justar the Balancer',
    prompt: 'Where can I act with more integrity or fairness today?' },
  { id: 'temperance', name: 'Temperance', color: '#8fd8d0', temple: 'Veil of Balance', guardian: 'Moder the Equilibrator',
    prompt: 'Where do I need more restraint, and where more forgiveness?' },
  { id: 'transcendence', name: 'Transcendence', color: '#c9a7f0', temple: 'Nebula of Awe', guardian: 'Auria the Awestruck',
    prompt: 'What filled me with awe, hope, or gratitude recently?' },
  { id: 'shadow', name: 'Shadow', color: '#8a7fa6', temple: 'Veil of Shadows', guardian: 'The mirror pool',
    prompt: 'What feeling am I resisting, and what is it trying to protect?' }
];

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
function todayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Ring of seven dots around the portal arch (Shadow sits at the base). */
const ring = $('portal-ring');
ring.innerHTML = REALMS.map((r, i) => {
  // Six light realms across the upper arc, Shadow at the bottom centre.
  const angle = r.id === 'shadow' ? 90 : (-180 + i * 36); // degrees: -180 … 0
  const rad = r.id === 'shadow' ? ';--r:124px' : '';
  return `<i style="--a:${angle}deg;--c:${r.color}${rad}" title="${esc(r.name)}"></i>`;
}).join('');

$('realm-legend').innerHTML = REALMS.map(r =>
  `<li><button type="button" class="realm-pill" data-realm="${r.id}" style="--c:${r.color}"><i></i>${esc(r.name)}</button></li>`
).join('');

const panel = $('portal-realms');
const enterBtn = $('portal-enter');
let active = null;

function renderPanel() {
  const iso = todayIso();
  if (!active) {
    panel.innerHTML =
      `<p class="portal-intro">Choose a realm. Sit with one question, then come back to the day.</p>` +
      `<div class="realm-grid">` +
      REALMS.map(r => {
        const done = !!localStorage.getItem(`mec-realm:${iso}:${r.id}`);
        return `<button type="button" class="realm-tile${done ? ' done' : ''}" data-realm="${r.id}" style="--c:${r.color}">` +
          `<i></i><span class="rt-name">${esc(r.name)}</span><span class="rt-temple">${esc(r.temple)}</span></button>`;
      }).join('') + `</div>`;
    return;
  }
  const r = REALMS.find(x => x.id === active);
  const key = `mec-realm:${iso}:${r.id}`;
  panel.innerHTML =
    `<div class="realm-visit" style="--c:${r.color}">` +
    `<button type="button" class="btn xs ghost realm-back">‹ All realms</button>` +
    `<div class="rv-name"><i></i>${esc(r.name)}</div>` +
    `<div class="rv-temple">${esc(r.temple)} · ${esc(r.guardian)}</div>` +
    `<label class="rv-prompt" for="realm-answer">${esc(r.prompt)}</label>` +
    `<textarea id="realm-answer" rows="3" placeholder="A sentence or two…"></textarea>` +
    `<div class="rv-ground">Then: how does this fit my real circumstances?</div>` +
    `<div class="rv-status" id="realm-status">Kept in this browser only</div>` +
    `</div>`;
  const ta = $('realm-answer');
  ta.value = localStorage.getItem(key) || '';
  let t = null;
  ta.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      try {
        if (ta.value.trim()) localStorage.setItem(key, ta.value);
        else localStorage.removeItem(key);
        $('realm-status').textContent = 'Saved locally';
      } catch { $('realm-status').textContent = 'Could not save'; }
    }, 300);
  });
  panel.querySelector('.realm-back').addEventListener('click', () => { active = null; renderPanel(); });
  ta.focus({ preventScroll: true });
}

function openPanel(realm = null) {
  active = realm;
  panel.hidden = false;
  enterBtn.setAttribute('aria-expanded', 'true');
  enterBtn.textContent = 'Leave the Realms';
  $('portal-card').classList.add('open');
  renderPanel();
}
function closePanel() {
  panel.hidden = true;
  active = null;
  enterBtn.setAttribute('aria-expanded', 'false');
  enterBtn.textContent = 'Enter the Realms';
  $('portal-card').classList.remove('open');
}

enterBtn.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()));
panel.addEventListener('click', (e) => {
  const tile = e.target.closest('.realm-tile');
  if (tile) { active = tile.dataset.realm; renderPanel(); }
});
$('realm-legend').addEventListener('click', (e) => {
  const pill = e.target.closest('.realm-pill');
  if (pill) openPanel(pill.dataset.realm);
});
