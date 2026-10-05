/**
 * Captain's Log — a blank daily journal that lives beside the calendar.
 * Entries are stored only in this browser (localStorage), one record per
 * Gregorian date: key "mec-log:YYYY-MM-DD". Nothing is synced anywhere.
 * Date labels reuse mec.js helpers; no calendar math is done here.
 */
import {
  format_gregorian, gregorian_day_of_year, is_leap,
  gregorian_to_mec, format_mec, add_gregorian_days
} from './mec.js?v=20';

const KEY_PREFIX = 'mec-log:';
const BDAY_KEY = 'mec-log-birthday';
const OPEN_KEY = 'mec-log-open';

/* ---------- Template (edit here to change prompts) ----------
   field types: text (one line), area (multi-line), check (tick box), scale (1–10) */
const SECTIONS = [
  {
    id: 'gratitude', title: 'Gratitude exercise', open: true,
    fields: [
      { id: 'g1', type: 'area', label: '1. What am I grateful for?', rows: 2, placeholder: 'S.C.O.R.E.' },
      { id: 'g2', type: 'area', label: '2. Who do I love?', rows: 2, placeholder: 'Keep it simple. Don’t overclock my energy. Love isn’t a fixing agent.' },
      { id: 'g3', type: 'area', label: '3. Why am I so happy?', rows: 2 },
      { id: 'g4', type: 'area', label: '4. What am I committed to?', rows: 2, placeholder: 'Navigate consciously. Don’t over promise.' },
      { id: 'g5', type: 'text', label: '5. How committed am I?' },
      { id: 'g6', type: 'area', label: '6. What is my intention today?', rows: 2 },
      { id: 'g7', type: 'area', label: '7. What is my wish for today?', rows: 2 },
      { id: 'g8', type: 'area', label: '8. Why am I here?', rows: 2, placeholder: 'Stay grounded in the miracle. Compound efforts. Create. Build.' }
    ]
  },
  {
    id: 'grounding', title: 'Grounding exercise',
    fields: [
      { id: 'gr1', type: 'area', label: 'What am I being influenced by?', rows: 2 },
      { id: 'gr2', type: 'area', label: 'What’s working?', rows: 2 },
      { id: 'gr3', type: 'area', label: 'What’s not working?', rows: 2 },
      { id: 'gr4', type: 'text', label: 'Am I taking care of myself?' },
      { id: 'gr5', type: 'text', label: 'Is my plan working?' },
      { id: 'gr6', type: 'text', label: 'Am I having fun?' },
      { id: 'gr7', type: 'text', label: 'Is it sustainable?' },
      { id: 'gr8', type: 'area', label: 'What can be done right now?', rows: 2 }
    ]
  },
  {
    id: 'defaults', title: 'Default to',
    fields: [
      { id: 'd1', type: 'area', label: '“What would it require to…”', rows: 2 },
      { id: 'd2', type: 'area', label: '“How does that work?”', rows: 2 },
      { id: 'd3', type: 'area', label: '“Tell me more.”', rows: 2 }
    ]
  },
  {
    id: 'tracker', title: 'Daily Tracker',
    fields: [
      { id: 'am_head', type: 'head', label: '6am' },
      { id: 'am_note', type: 'area', label: 'Good morning ☀️', rows: 2 },
      { id: 'pm_head', type: 'head', label: '10pm' },
      { id: 'pm_note', type: 'area', label: 'Good night 💤', rows: 2 }
    ]
  },
  {
    id: 'life', title: 'Life Journal · Captain’s Log Review',
    fields: [ { id: 'log', type: 'area', label: 'Check in', rows: 4, placeholder: 'Captain’s Log…' } ]
  },
  {
    id: 'career', title: 'Career',
    fields: [
      { id: 'cw_head', type: 'head', label: 'CW Enterprises' },
      { id: 'cw_checkin', type: 'area', label: 'Check in — Schedule · Emails · Deals', rows: 3 },
      { id: 'anam_head', type: 'head', label: 'Anam' },
      { id: 'anam_pipeline', type: 'area', label: 'Pipeline — Introductions · Submissions · Outbound · Inbound', rows: 3 },
      { id: 'anam_other', type: 'area', label: 'Business chats · Organization · News', rows: 2 }
    ]
  },
  {
    id: 'notes', title: 'Notes · Communication · Social · Care',
    fields: [
      { id: 'notes', type: 'area', label: 'Notes', rows: 3 },
      { id: 'comm_out', type: 'area', label: 'Personal Communication — Outbound', rows: 2 },
      { id: 'comm_in', type: 'area', label: 'Personal Communication — Inbound', rows: 2 },
      { id: 'social_fam', type: 'text', label: 'Social — Family' },
      { id: 'social_friends', type: 'text', label: 'Social — Friends' },
      { id: 'social_col', type: 'text', label: 'Social — Colleagues & Associates' },
      { id: 'social_adv', type: 'text', label: 'Social — To Adventure & Fellowship' },
      { id: 'care', type: 'area', label: 'Personal Care & Activities', rows: 2 }
    ]
  },
  {
    id: 'io', title: 'Inputs & Outputs',
    fields: [
      { id: 'supp_head', type: 'head', label: 'Supplements' },
      { id: 'supp_620', type: 'check', label: '6:20am — OptimalAmino · Electrolytes · Creatine 10g' },
      { id: 'supp_930', type: 'check', label: '9:30am — AG1 · Omega 3 · Vitamin D3 + K2' },
      { id: 'supp_9pm', type: 'check', label: '9pm — OptimalAmino · Psyllium Husk' },
      { id: 'drank', type: 'area', label: '💧 Drank', rows: 2 },
      { id: 'ate', type: 'area', label: '🥩 Ate', rows: 2 },
      { id: 'dreams', type: 'area', label: '🛌 Dreams', rows: 2, placeholder: 'Physical setting, mental perspective, emotional feelings, themes, messages, symbols, thoughts' },
      { id: 'media', type: 'area', label: '🔊 Listened / watched / read', rows: 2 },
      { id: 'purchases', type: 'text', label: '💸 Purchases' },
      { id: 'workout', type: 'area', label: '💪🏼 Workout', rows: 2 },
      { id: 'health', type: 'text', label: '👨🏼‍⚕️ Health', placeholder: 'Great' }
    ]
  }
]

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (g) => `${g.year}-${pad(g.month)}-${pad(g.day)}`;
function todayG() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function load(iso) {
  try { return JSON.parse(localStorage.getItem(KEY_PREFIX + iso) || '{}') || {}; }
  catch { return {}; }
}
function store(iso, data) {
  const has = Object.values(data).some(v => v !== '' && v !== false && v != null);
  try {
    if (has) localStorage.setItem(KEY_PREFIX + iso, JSON.stringify(data));
    else localStorage.removeItem(KEY_PREFIX + iso);
    return true;
  } catch { return false; }
}
function openState() {
  try { return JSON.parse(localStorage.getItem(OPEN_KEY) || 'null'); } catch { return null; }
}

/** Life day: 1 on the birthday itself (calendar days, timezone-safe via UTC). */
function lifeDay(g) {
  const b = localStorage.getItem(BDAY_KEY);
  if (!b || !/^\d{4}-\d{2}-\d{2}$/.test(b)) return null;
  const [by, bm, bd] = b.split('-').map(Number);
  const n = Math.round((Date.UTC(g.year, g.month - 1, g.day) - Date.UTC(by, bm - 1, bd)) / 86400000) + 1;
  return n >= 1 ? n : null;
}

/* ---------- Render ---------- */
let current = todayG();
const form = $('log-form');

function fieldHtml(f) {
  const id = `log-f-${f.id}`;
  const cls = 'log-field' + (f.half ? ' half' : '') + (f.third ? ' third' : '');
  if (f.type === 'head') return `<div class="log-subhead">${esc(f.label)}</div>`;
  if (f.type === 'check') {
    return `<label class="${cls} log-check"><input type="checkbox" id="${id}" data-k="${f.id}" /> <span>${esc(f.label)}</span></label>`;
  }
  if (f.type === 'scale') {
    const opts = ['<option value="">—</option>'].concat(
      Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`)).join('');
    return `<div class="${cls}"><label for="${id}">${esc(f.label)} <span class="log-hint">1–10</span></label><select id="${id}" data-k="${f.id}">${opts}</select></div>`;
  }
  if (f.type === 'area') {
    return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><textarea id="${id}" data-k="${f.id}" rows="${f.rows || 2}" placeholder="${esc(f.placeholder || '')}"></textarea></div>`;
  }
  return `<div class="${cls}"><label for="${id}">${esc(f.label)}</label><input type="text" id="${id}" data-k="${f.id}" placeholder="${esc(f.placeholder || '')}" /></div>`;
}

function buildForm() {
  const saved = openState() || {};
  form.innerHTML = SECTIONS.map(s => {
    const open = s.id in saved ? saved[s.id] : !!s.open;
    return `<details class="log-sec" data-sec="${s.id}"${open ? ' open' : ''}>` +
      `<summary><span class="log-sec-title">${esc(s.title)}</span><span class="log-count" data-count="${s.id}"></span></summary>` +
      `<div class="log-grid">${s.fields.map(fieldHtml).join('')}</div></details>`;
  }).join('');
  form.querySelectorAll('details.log-sec').forEach(d => {
    d.addEventListener('toggle', () => {
      const st = openState() || {};
      st[d.dataset.sec] = d.open;
      try { localStorage.setItem(OPEN_KEY, JSON.stringify(st)); } catch {}
    });
  });
}

function readForm() {
  const data = {};
  form.querySelectorAll('[data-k]').forEach(el => {
    data[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value;
  });
  return data;
}

function updateCounts(data) {
  for (const s of SECTIONS) {
    const keys = s.fields.filter(f => f.type !== 'head').map(f => f.id);
    const filled = keys.filter(k => data[k] && data[k] !== '').length;
    const el = form.querySelector(`[data-count="${s.id}"]`);
    if (el) {
      el.textContent = filled ? `${filled}/${keys.length}` : '';
      el.classList.toggle('done', filled === keys.length);
    }
  }
}

function renderHeader() {
  const g = current;
  const greg = format_gregorian(g.year, g.month, g.day);
  const doy = gregorian_day_of_year(g.year, g.month, g.day);
  const total = is_leap(g.year) ? 366 : 365;
  const parts = [`Day ${doy} of ${total}`];
  const ld = lifeDay(g);
  if (ld) parts.unshift(`Life day ${ld.toLocaleString()}`);
  let mec = '';
  try { mec = format_mec(gregorian_to_mec(g.year, g.month, g.day)); } catch {}
  $('log-weekday').textContent = greg;
  $('log-meta').innerHTML = esc(parts.join(' · ')) + (mec ? `<span class="log-mec">${esc(mec)}</span>` : '');
  const t = todayG();
  $('log-today').disabled = isoOf(t) === isoOf(g);
}

function fillForm() {
  const data = load(isoOf(current));
  form.querySelectorAll('[data-k]').forEach(el => {
    const v = data[el.dataset.k];
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v == null ? '' : v;
  });
  updateCounts(data);
  setStatus(Object.keys(data).length ? 'Saved in this browser only' : 'Blank entry · saves in this browser only');
}

function setStatus(msg) { $('log-status').textContent = msg; }

function show(g) {
  current = { year: g.year, month: g.month, day: g.day };
  renderHeader();
  fillForm();
}

/* ---------- Save (debounced) ---------- */
let timer = null;
function scheduleSave() {
  clearTimeout(timer);
  setStatus('Saving…');
  const iso = isoOf(current);
  timer = setTimeout(() => {
    const data = readForm();
    const ok = store(iso, data);
    updateCounts(data);
    const t = new Date();
    setStatus(ok ? `Saved locally · ${t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Could not save (storage full or blocked)');
  }, 350);
}
function flush() {
  if (!timer) return;
  clearTimeout(timer); timer = null;
  store(isoOf(current), readForm());
}

/* ---------- Plain-text export ---------- */
function asText() {
  const g = current;
  const data = readForm();
  const lines = [];
  lines.push(`Captain’s Log — ${format_gregorian(g.year, g.month, g.day)}`);
  lines.push($('log-meta').textContent.replace(/(Day \d+ of \d+)/, '$1 · '));
  lines.push('', 'Belief creates consequence.', 'Mutual confidence is the foundation of all satisfactory human relationships.');
  for (const s of SECTIONS) {
    lines.push('', s.title.toUpperCase());
    for (const f of s.fields) {
      if (f.type === 'head') { lines.push(`[${f.label}]`); continue; }
      const v = data[f.id];
      const out = f.type === 'check' ? (v ? '☑' : '☐') : (v || '');
      lines.push(`${f.label}: ${out}`);
    }
  }
  return lines.join('\n');
}

/* ---------- Wire up ---------- */
buildForm();
form.addEventListener('input', scheduleSave);
form.addEventListener('change', scheduleSave);

$('log-prev').addEventListener('click', () => { flush(); show(add_gregorian_days(current.year, current.month, current.day, -1)); });
$('log-next').addEventListener('click', () => { flush(); show(add_gregorian_days(current.year, current.month, current.day, 1)); });
$('log-today').addEventListener('click', () => { flush(); show(todayG()); });
document.addEventListener('mec:dayselect', (e) => { flush(); show(e.detail); });

$('log-copy').addEventListener('click', async () => {
  const txt = asText();
  try { await navigator.clipboard.writeText(txt); setStatus('Copied entry as plain text'); }
  catch { setStatus('Copy blocked by the browser'); }
});

$('log-clear').addEventListener('click', () => {
  const g = current;
  if (!confirm(`Clear the Captain’s Log entry for ${format_gregorian(g.year, g.month, g.day)}? This only affects this browser.`)) return;
  clearTimeout(timer); timer = null;
  try { localStorage.removeItem(KEY_PREFIX + isoOf(g)); } catch {}
  fillForm();
  setStatus('Entry cleared');
});

const settingsBtn = $('log-settings-btn');
const settings = $('log-settings');
const bdayInput = $('log-birthday');
bdayInput.value = localStorage.getItem(BDAY_KEY) || '';
settingsBtn.addEventListener('click', () => {
  settings.hidden = !settings.hidden;
  settingsBtn.setAttribute('aria-expanded', String(!settings.hidden));
});
bdayInput.addEventListener('change', () => {
  if (bdayInput.value) localStorage.setItem(BDAY_KEY, bdayInput.value);
  else localStorage.removeItem(BDAY_KEY);
  renderHeader();
});
$('log-birthday-clear').addEventListener('click', () => {
  bdayInput.value = '';
  localStorage.removeItem(BDAY_KEY);
  renderHeader();
});

window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

show(current);
