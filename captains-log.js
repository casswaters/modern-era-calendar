/**
 * Captain's Log — a blank daily journal that lives beside the calendar.
 * Entries are stored only in this browser (localStorage), one record per
 * Gregorian date: key "mec-log:YYYY-MM-DD". Nothing is synced anywhere.
 * Date labels reuse mec.js helpers; no calendar math is done here.
 */
import {
  format_gregorian, gregorian_day_of_year, is_leap,
  gregorian_to_mec, format_mec, add_gregorian_days
} from './mec.js?v=cl19';
import { readProfile, profileView, saveField, clearProfile, NAME_MAX, INITIALS_MAX, LABEL_MAX, TIME_MAX, SUPP_IDS } from './profile.js?v=cl39';

const KEY_PREFIX = 'mec-log:';
const OPEN_KEY = 'mec-log-open';

/* ---------- Template (edit here to change prompts) ----------
   field types: cue (read-only standing prompt; optional note = one plain explanatory line under it), text, area, check, scale (1–10), head
   A label may be a function of the profile (v38: enterprise names come from Profile, never hard-coded).
   Field ids stay as they were so saved entries keep their values. */
const SECTIONS = [
  {
    id: 'gratitude', title: 'Gratitude exercise', open: true,
    fields: [
      { id: 'g1', type: 'cue', label: '1. What am I grateful for?', cue: 'S.C.O.R.E.: Sincerity, Consistency, Originality, Reflection, Expression.', note: 'A way to anchor in gratitude instead of breezing through it.' },
      { id: 'g2', type: 'cue', label: '2. Who do I love?', cue: 'Keep it simple. Don’t overclock my energy. Love isn’t a fixing agent.' },
      { id: 'g3', type: 'cue', label: '3. Why am I so happy?' },
      { id: 'g4', type: 'cue', label: '4. What am I committed to?', cue: 'Navigate consciously. Don’t over promise.' },
      { id: 'g5', type: 'cue', label: '5. How committed am I?' },
      { id: 'g6', type: 'cue', label: '6. What is my intention today?' },
      { id: 'g7', type: 'cue', label: '7. What is my wish for today?' },
      { id: 'g8', type: 'cue', label: '8. Why am I here?', cue: 'Stay grounded in the miracle. Compound efforts. Create. Build.' }
    ]
  },
  {
    id: 'grounding', title: 'Grounding exercise',
    fields: [
      { id: 'gr1', type: 'cue', label: 'What am I being influenced by?' },
      { id: 'gr2', type: 'cue', label: 'What’s working?' },
      { id: 'gr3', type: 'cue', label: 'What’s not working?' },
      { id: 'gr4', type: 'cue', label: 'Am I taking care of myself?' },
      { id: 'gr5', type: 'cue', label: 'Is my plan working?' },
      { id: 'gr6', type: 'cue', label: 'Am I having fun?' },
      { id: 'gr7', type: 'cue', label: 'Is it sustainable?' },
      { id: 'gr8', type: 'cue', label: 'What can be done right now?' }
    ]
  },
  {
    id: 'defaults', title: 'Default to',
    fields: [
      { id: 'd1', type: 'cue', label: '“What would it require to…”' },
      { id: 'd2', type: 'cue', label: '“How does that work?”' },
      { id: 'd3', type: 'cue', label: '“Tell me more.”' }
    ]
  },
  {
    id: 'tracker', title: 'Daily Tracker',
    fields: [
      { id: 'wake', type: 'text', label: (p) => `${p.wake} ☀️`, placeholder: 'Wake time' },
      { id: 'bed', type: 'text', label: (p) => `${p.bed} 💤`, placeholder: 'Bedtime' }
    ]
  },
  {
    id: 'career', title: 'Career',
    fields: [
      { id: 'cw_head', type: 'head', label: (p) => p.enterprise },
      { id: 'cw_checkin', type: 'area', label: 'Check in — Schedule · Emails · Deals', rows: 3 },
      { id: 'anam_head', type: 'head', label: (p) => p.venture },
      { id: 'anam_pipeline', type: 'area', label: 'Pipeline — Introductions · Submissions · Outbound · Inbound', rows: 3 },
      { id: 'anam_other', type: 'area', label: 'Business chats · Organization · News', rows: 2 }
    ]
  },
  {
    id: 'notes', title: 'Life Journal · Notes · Communication · Social · Care',
    fields: [
      { id: 'notes', type: 'area', label: 'Life Journal / Notes', rows: 5, placeholder: 'Freeform notes…' },
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
      { id: 'supps', type: 'supps' }, // v39: one check per Profile checklist line (ids from SUPP_IDS)
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
let P = profileView(readProfile());
const labelOf = (f) => (typeof f.label === 'function' ? f.label(P) : f.label);
/** A section's fields with the Profile checklist expanded into check fields. */
const fieldsOf = (s) => s.fields.flatMap((f) => (f.type === 'supps' ? P.supplements.map((label, i) => ({ id: SUPP_IDS[i], type: 'check', label })) : [f]));
const formShape = () => JSON.stringify(SECTIONS.map((s) => fieldsOf(s).map((f) => [f.id, labelOf(f)])));
function todayG() {
  const n = new Date();
  return { year: n.getFullYear(), month: n.getMonth() + 1, day: n.getDate() };
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function load(iso) {
  try {
    const data = JSON.parse(localStorage.getItem(KEY_PREFIX + iso) || '{}') || {};
    // Prior Life Journal field id was `log`; fold into Notes if present.
    if (data.log && !data.notes) data.notes = data.log;
    return data;
  } catch { return {}; }
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
  const b = P.birthday;
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
  if (f.type === 'head') return `<div class="log-subhead" data-head="${f.id}">${esc(labelOf(f))}</div>`;
  if (f.type === 'cue') {
    const hint = (f.cue ? `<p class="log-cue-hint">${esc(f.cue)}</p>` : '')
      + (f.note ? `<p class="log-cue-hint log-cue-note">${esc(f.note)}</p>` : '');
    return `<div class="log-cue"><p class="log-cue-q">${esc(labelOf(f))}</p>${hint}</div>`;
  }
  if (f.type === 'check') {
    return `<label class="${cls} log-check"><input type="checkbox" id="${id}" data-k="${f.id}" /> <span>${esc(labelOf(f))}</span></label>`;
  }
  if (f.type === 'scale') {
    const opts = ['<option value="">—</option>'].concat(
      Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`)).join('');
    return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))} <span class="log-hint">1–10</span></label><select id="${id}" data-k="${f.id}">${opts}</select></div>`;
  }
  if (f.type === 'area') {
    return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))}</label><textarea id="${id}" data-k="${f.id}" rows="${f.rows || 2}" placeholder="${esc(f.placeholder || '')}"></textarea></div>`;
  }
  return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))}</label><input type="text" id="${id}" data-k="${f.id}" placeholder="${esc(f.placeholder || '')}" /></div>`;
}

function buildForm() {
  const saved = openState() || {};
  form.innerHTML = SECTIONS.map(s => {
    const open = s.id in saved ? saved[s.id] : !!s.open;
    return `<details class="log-sec" data-sec="${s.id}"${open ? ' open' : ''}>` +
      `<summary><span class="log-sec-title">${esc(s.title)}</span><span class="log-count" data-count="${s.id}"></span></summary>` +
      `<div class="log-grid">${fieldsOf(s).map(fieldHtml).join('')}</div></details>`;
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
    const keys = fieldsOf(s).filter(f => f.type !== 'head' && f.type !== 'cue').map(f => f.id);
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
  lines.push(`Captain’s Log${P.name ? ` · ${P.name}` : ''} — ${format_gregorian(g.year, g.month, g.day)}`);
  lines.push($('log-meta').textContent.replace(/(Day \d+ of \d+)/, '$1 · '));
  lines.push('', 'Belief creates consequence.', 'Mutual confidence is the foundation of all satisfactory human relationships.');
  for (const s of SECTIONS) {
    lines.push('', s.title.toUpperCase());
    for (const f of fieldsOf(s)) {
      if (f.type === 'head') { lines.push(`[${labelOf(f)}]`); continue; }
      if (f.type === 'cue') {
        lines.push(f.cue ? `${labelOf(f)} — ${f.cue}${f.note ? ` ${f.note}` : ''}` : labelOf(f));
        continue;
      }
      const v = data[f.id];
      const out = f.type === 'check' ? (v ? '☑' : '☐') : (v || '');
      lines.push(`${labelOf(f)}: ${out}`);
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

/* ---------- Profile (v38): name, initials, enterprise names, birthday; this browser only ---------- */
const settingsBtn = $('log-settings-btn');
const settings = $('log-settings');
const FIELDS = { name: 'log-name', initials: 'log-initials', enterprise: 'log-enterprise', venture: 'log-venture', birthday: 'log-birthday',
  wake: 'log-wake', bed: 'log-bed', supplements: 'log-supplements' };
let shape = '';
function renderProfile() {
  const raw = readProfile();
  P = profileView(raw);
  for (const [k, id] of Object.entries(FIELDS)) { const el = $(id); if (document.activeElement !== el) el.value = raw[k] || ''; } // stored values are already clean
  $('log-initials').placeholder = P.initials && !raw.initials ? P.initials : 'e.g. AL';
  $('log-enterprise').placeholder = P.enterprise;
  $('log-venture').placeholder = P.venture;
  const who = $('log-who');
  who.textContent = P.name ? `· ${P.name}` : '';
  who.hidden = !P.name;
  const next = formShape();
  if (shape && next !== shape) { flush(); buildForm(); fillForm(); } // labels/checklist changed: rebuild, keeping today's entry
  else form.querySelectorAll('[data-head]').forEach((el) => {
    const f = SECTIONS.flatMap((s) => s.fields).find((x) => x.id === el.dataset.head);
    if (f) el.textContent = labelOf(f);
  });
  shape = next;
  $('log-wake').placeholder = P.wake; $('log-bed').placeholder = P.bed;
  $('log-supplements').placeholder = P.supplements.join('\n');
  renderHeader();
}
$('log-name').maxLength = NAME_MAX; $('log-initials').maxLength = INITIALS_MAX;
$('log-enterprise').maxLength = LABEL_MAX; $('log-venture').maxLength = LABEL_MAX;
$('log-wake').maxLength = TIME_MAX; $('log-bed').maxLength = TIME_MAX;
settingsBtn.addEventListener('click', () => {
  settings.hidden = !settings.hidden;
  settingsBtn.setAttribute('aria-expanded', String(!settings.hidden));
});
for (const [k, id] of Object.entries(FIELDS)) {
  const el = $(id);
  if (k !== 'birthday' && k !== 'supplements') el.addEventListener('input', () => { saveField(k, el.value); renderProfile(); });
  el.addEventListener('change', () => { el.value = saveField(k, el.value); renderProfile(); });
}
$('log-profile-clear').addEventListener('click', () => {
  if (!confirm('Clear your Captain’s Log profile (name, initials, enterprise names, birthday, tracker targets, checklist)? Log entries are kept. Your name is shared with Aretoria on this device.')) return;
  clearProfile();
  Object.values(FIELDS).forEach((id) => { $(id).value = ''; });
  renderProfile();
});
// another tab (or Aretoria) changed the shared name
window.addEventListener('storage', (e) => { if (!e.key || /^mec-(aretoria:name|log-(initials|enterprise|venture|birthday|wake|bed|supplements))$/.test(e.key)) renderProfile(); });

window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

show(current);
renderProfile();
