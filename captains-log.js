/**
 * Captain's Log: a blank daily journal that lives beside the calendar.
 * Entries are stored only in this browser (localStorage), one record per
 * Gregorian date: key "mec-log:YYYY-MM-DD". Nothing is synced anywhere.
 * Date labels reuse mec.js helpers; no calendar math is done here.
 */
import {
  format_gregorian, gregorian_day_of_year, is_leap,
  gregorian_to_mec, format_mec, add_gregorian_days
} from './mec.js?v=cl19';
import { readProfile, profileView, saveField, clearProfile, DEFAULTS, NAME_MAX, LABEL_MAX, TIME_MAX, SUPP_IDS, WORD_IDS, WORD_DEFAULTS, WORD_MAX, saveWord, resetWords } from './profile.js?v=cl46';
import { geocode_place, parse_home, HOME_KEY } from './weather.js?v=cl42';
import { TRACKER, trackerStatus } from './tracker.js?v=cl46';

const KEY_PREFIX = 'mec-log:';
const OPEN_KEY = 'mec-log-open';

/* ---------- Template (edit here to change prompts) ----------
   field types: cue (read-only standing prompt; optional note = one plain explanatory line under it), text, area, check, scale (1–10), head
   A label may be a function of the profile (v38: career names come from Profile, never hard-coded).
   v45: a head may carry a role (a small descriptor shown after the name, only when the name is the user's own).
   Field ids stay as they were so saved entries keep their values. */
const SECTIONS = [
  {
    id: 'gratitude', title: 'Gratitude exercise', open: true,
    fields: [
      // v46: the cue under each question comes from Profile (WORD_DEFAULTS in profile.js holds the original text)
      { id: 'g1', type: 'cue', words: true, label: '1. What am I grateful for?' },
      { id: 'g2', type: 'cue', words: true, label: '2. Who do I love?' },
      { id: 'g3', type: 'cue', words: true, label: '3. Why am I so happy?' },
      { id: 'g4', type: 'cue', words: true, label: '4. What am I committed to?' },
      { id: 'g5', type: 'cue', words: true, label: '5. How committed am I?' },
      { id: 'g6', type: 'cue', words: true, label: '6. What is my intention today?' },
      { id: 'g7', type: 'cue', words: true, label: '7. What is my wish for today?' },
      { id: 'g8', type: 'cue', words: true, label: '8. Why am I here?' }
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
    // v46: the day's overview. One row per area; a row is done when that area has entries for the day
    // (or when ticked by hand). Wake and Sleep keep their time fields (ids wake / bed) inline.
    id: 'tracker', title: 'Daily Tracker', tracker: true,
    fields: [
      { id: 'tracker_rows', type: 'tracker' }
    ]
  },
  {
    id: 'career', title: 'Career',
    fields: [
      { id: 'cw_head', type: 'head', label: (p) => p.holding, role: (p) => (p.holdingSet ? 'holding company' : '') },
      { id: 'cw_checkin', type: 'area', label: 'Check in (Schedule · Emails · Deals)', rows: 3 },
      { id: 'anam_head', type: 'head', nested: true, label: (p) => p.business, role: (p) => (p.businessSet ? `main business${p.holdingSet ? ` under ${p.holding}` : ''}` : '') },
      { id: 'anam_pipeline', type: 'area', label: 'Pipeline (Introductions · Submissions · Outbound · Inbound)', rows: 3 },
      { id: 'anam_other', type: 'area', label: 'Business chats · Organization · News', rows: 2 }
    ]
  },
  {
    id: 'notes', title: 'Life Journal · Notes · Communication · Social · Care',
    fields: [
      { id: 'notes', type: 'area', label: 'Life Journal / Notes', rows: 5, placeholder: 'Freeform notes…' },
      { id: 'comm_out', type: 'area', label: 'Personal Communication (Outbound)', rows: 2 },
      { id: 'comm_in', type: 'area', label: 'Personal Communication (Inbound)', rows: 2 },
      { id: 'social_fam', type: 'text', label: 'Social (Family)' },
      { id: 'social_friends', type: 'text', label: 'Social (Friends)' },
      { id: 'social_col', type: 'text', label: 'Social (Colleagues & Associates)' },
      { id: 'social_adv', type: 'text', label: 'Social (To Adventure & Fellowship)' },
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
const roleOf = (f) => (typeof f.role === 'function' ? f.role(P) : f.role || '');
/** A section's fields with the Profile checklist expanded into check fields. */
const fieldsOf = (s) => s.fields.flatMap((f) => (f.type === 'supps' ? P.supplements.map((label, i) => ({ id: SUPP_IDS[i], type: 'check', label })) : [f]));
const formShape = () => JSON.stringify([SECTIONS.map((s) => fieldsOf(s).map((f) => [f.id, labelOf(f), roleOf(f)])), TRACKER.map((r) => [r.target ? r.target(P) : '', r.sub ? r.sub(P) : '']), P.words]);
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
  if (f.type === 'head') {
    const role = roleOf(f);
    return `<div class="log-subhead${f.nested ? ' nested' : ''}" data-head="${f.id}"><span class="log-subhead-name">${esc(labelOf(f))}</span>${role ? `<span class="log-subhead-role">${esc(role)}</span>` : ''}</div>`;
  }
  if (f.type === 'cue') {
    const hint = cueLines(f).map((l, i) => `<p class="log-cue-hint${i ? ' log-cue-note' : ''}">${esc(l)}</p>`).join('');
    return `<div class="log-cue"><p class="log-cue-q">${esc(labelOf(f))}</p>${hint}</div>`;
  }
  if (f.type === 'tracker') return trackerHtml();
  if (f.type === 'check') {
    return `<label class="${cls} log-check"><input type="checkbox" id="${id}" data-k="${f.id}" /> <span>${esc(labelOf(f))}</span></label>`;
  }
  if (f.type === 'scale') {
    const opts = ['<option value="">·</option>'].concat(
      Array.from({ length: 10 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`)).join('');
    return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))} <span class="log-hint">1–10</span></label><select id="${id}" data-k="${f.id}">${opts}</select></div>`;
  }
  if (f.type === 'area') {
    return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))}</label><textarea id="${id}" data-k="${f.id}" rows="${f.rows || 2}" placeholder="${esc(f.placeholder || '')}"></textarea></div>`;
  }
  return `<div class="${cls}"><label for="${id}">${esc(labelOf(f))}</label><input type="text" id="${id}" data-k="${f.id}" placeholder="${esc(f.placeholder || '')}" /></div>`;
}

function trackerHtml() {
  const rows = TRACKER.map((r) => {
    const box = `<input type="checkbox" class="trk-box" data-trk="${r.id}" aria-label="${esc(r.label)} done" />`;
    if (r.time) {
      const target = r.target(P);
      return `<div class="trk-row trk-time" data-row="${r.id}"><label class="trk-tick">${box}</label>` +
        `<label class="trk-label" for="log-f-${r.time}"><span class="trk-icon" aria-hidden="true">${r.icon}</span>${esc(r.label)}${target ? `<span class="trk-sub">target ${esc(target)}</span>` : ''}</label>` +
        `<input type="text" class="trk-input" id="log-f-${r.time}" data-k="${r.time}" placeholder="${r.time === 'wake' ? 'Wake time' : 'Bedtime'}" autocomplete="off" /></div>`;
    }
    const sub = r.sub ? r.sub(P) : '';
    return `<div class="trk-row" data-row="${r.id}"><label class="trk-tick">${box}</label>` +
      `<button type="button" class="trk-jump" data-jump="${r.id}" title="Open ${esc(r.label)}"><span class="trk-name">${esc(r.label)}</span>${sub ? `<span class="trk-sub">${esc(sub)}</span>` : ''}<span class="trk-state" aria-hidden="true"></span><span class="trk-go" aria-hidden="true">›</span></button></div>`;
  }).join('');
  return `<div class="trk" role="group" aria-label="Daily Tracker">${rows}</div>`;
}

/** Cue first, then plain notes; Profile words for gratitude questions, template text otherwise. */
function cueLines(f) {
  if (f.words) return (P.words[f.id] || '').split('\n').filter(Boolean);
  return [f.cue, f.note].filter(Boolean);
}

function buildForm() {
  const saved = openState() || {};
  form.innerHTML = SECTIONS.map(s => {
    const open = s.id in saved ? saved[s.id] : !!s.open;
    return `<details class="log-sec" data-sec="${s.id}"${open ? ' open' : ''}>` +
      `<summary><span class="log-sec-title">${esc(s.title)}</span>${s.tracker ? `<span class="log-count" data-count="${s.id}"></span>` : ''}</summary>` + // v47: the tracker carries the day's only count
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
  // v46: only hand ticks are saved for tracker rows; automatic ones follow the day's entries
  form.querySelectorAll('[data-trk]').forEach(el => { data[`trk_${el.dataset.trk}`] = el.dataset.manual === '1'; });
  return data;
}

function updateTracker(data) {
  const st = trackerStatus(data);
  for (const r of st.rows) {
    const row = form.querySelector(`[data-row="${r.id}"]`);
    if (!row) continue;
    const box = row.querySelector('[data-trk]');
    box.dataset.manual = r.manual ? '1' : '0';
    box.checked = r.done;
    box.disabled = r.auto; // entries already mark it done
    box.title = r.auto ? 'Done: has entries for this day' : r.manual ? 'Ticked by hand' : 'Tick by hand';
    row.classList.toggle('done', r.done);
    row.classList.toggle('auto', r.auto);
    const state = row.querySelector('.trk-state');
    if (state) state.textContent = r.auto ? 'logged' : r.manual ? 'done' : '';
  }
  return st;
}

/* v47: the Daily Tracker is the one set of daily metrics. The other sections no longer show their own
   filled-field counts (1/3, 2/8, 1/10), and the tracker's "N of 8" appears once, on its heading. */
function updateCounts(data) {
  const st = updateTracker(data);
  const el = form.querySelector('[data-count="tracker"]');
  if (el) {
    el.textContent = `${st.done} of ${st.total}`;
    el.setAttribute('aria-label', `${st.done} of ${st.total} done for this day`);
    el.classList.toggle('done', st.done === st.total);
  }
}

let fullMeta = '';
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
  // v45: one calm line under the date (MEC day and day name; cycle and year stay in Copy text and the calendar)
  const mecShort = mec.split(' · ').slice(0, / · Cycle /.test(mec) ? 2 : 1).join(' · ');
  $('log-meta').textContent = [...parts, mecShort].filter(Boolean).join(' · ');
  fullMeta = [...parts, mec].filter(Boolean).join(' · ');
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
  lines.push(`${P.owner} · ${format_gregorian(g.year, g.month, g.day)}`);
  lines.push(fullMeta);
  const beliefs = [P.words.b1, P.words.b2].filter(Boolean); // v46: from Profile
  lines.push('', ...beliefs);
  for (const s of SECTIONS) {
    lines.push('', s.title.toUpperCase());
    if (s.tracker) {
      const st = trackerStatus(data);
      lines[lines.length - 1] += ` (${st.done} of ${st.total})`;
      for (const r of TRACKER) {
        const row = st.rows.find((x) => x.id === r.id);
        const extra = r.time ? (data[r.time] ? `: ${data[r.time]}` : '') : r.sub && r.sub(P) ? ` (${r.sub(P)})` : '';
        lines.push(`${row.done ? '☑' : '☐'} ${r.label}${extra}`);
      }
      continue;
    }
    for (const f of fieldsOf(s)) {
      if (f.type === 'head') { const r = roleOf(f); lines.push(`[${labelOf(f)}${r ? ` (${r})` : ''}]`); continue; }
      if (f.type === 'cue') {
        // v41: cue and note go on their own lines under the question (no em dash separator)
        lines.push(labelOf(f));
        lines.push(...cueLines(f));
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
form.addEventListener('input', () => { updateTracker(readForm()); scheduleSave(); });
form.addEventListener('change', scheduleSave);
// v46: tracker rows. A tick (when the area has no entries yet) is saved for the day; a tap jumps to the area.
form.addEventListener('click', (e) => {
  const box = e.target.closest('[data-trk]');
  if (box) { box.dataset.manual = box.checked ? '1' : '0'; updateCounts(readForm()); scheduleSave(); return; }
  const jump = e.target.closest('[data-jump]');
  if (jump) jumpTo(jump.dataset.jump);
});
function jumpTo(rowId) {
  const r = TRACKER.find((x) => x.id === rowId);
  if (!r || !r.sec) return;
  const sec = form.querySelector(`details.log-sec[data-sec="${r.sec}"]`);
  if (!sec) return;
  if (!sec.open) sec.open = true; // the toggle listener saves the open state
  const target = (r.to && $(`log-f-${r.to}`)?.closest('.log-field')) || sec;
  requestAnimationFrame(() => {
    // scroll the log's own body when it scrolls (desktop), else the page (phones, under the sticky bar)
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const body = form, inner = body.scrollHeight > body.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(body).overflowY);
    const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    if (inner) body.scrollTo({ top: body.scrollTop + target.getBoundingClientRect().top - body.getBoundingClientRect().top - margin, behavior });
    else window.scrollTo({ top: scrollY + target.getBoundingClientRect().top - margin, behavior });
    target.classList.remove('trk-flash'); void target.offsetWidth; target.classList.add('trk-flash');
    setTimeout(() => target.classList.remove('trk-flash'), 1600);
  });
}

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

/* ---------- Profile (v38): name, holding company, main business, birthday; this browser only ---------- */
const settingsBtn = $('log-settings-btn');
const settings = $('log-settings');
const FIELDS = { name: 'log-name', holding: 'log-holding', business: 'log-business', birthday: 'log-birthday',
  wake: 'log-wake', bed: 'log-bed', supplements: 'log-supplements' };
let shape = '';
function renderProfile() {
  const raw = readProfile();
  P = profileView(raw);
  for (const [k, id] of Object.entries(FIELDS)) { const el = $(id); if (document.activeElement !== el) el.value = raw[k] || ''; } // stored values are already clean
  $('log-holding').placeholder = DEFAULTS.holding;
  $('log-business').placeholder = DEFAULTS.business;
  $('log-owner').textContent = P.owner; // v45: "{Name}’s Captain’s Log" above the date
  document.title = P.owner;
  const next = formShape();
  if (shape && next !== shape) { flush(); buildForm(); fillForm(); } // labels/checklist changed: rebuild, keeping today's entry
  else form.querySelectorAll('[data-head]').forEach((el) => {
    const f = SECTIONS.flatMap((s) => s.fields).find((x) => x.id === el.dataset.head);
    if (f) el.querySelector('.log-subhead-name').textContent = labelOf(f);
  });
  shape = next;
  $('log-wake').placeholder = P.wake; $('log-bed').placeholder = P.bed;
  $('log-supplements').placeholder = P.supplements.join('\n');
  // v46: header beliefs and the Profile fields that edit them and the gratitude cues
  ['b1', 'b2'].forEach((id) => { const el = $(`log-belief-${id}`); el.textContent = P.words[id]; el.hidden = !P.words[id]; });
  $('log-beliefs').hidden = !P.words.b1 && !P.words.b2;
  for (const id of WORD_IDS) { const el = $(`log-word-${id}`); if (el && document.activeElement !== el) el.value = P.words[id]; }
  renderHeader();
}
function buildWordFields() {
  const qs = SECTIONS.find((s) => s.id === 'gratitude').fields;
  const row = (id, label, multi) => `<label for="log-word-${id}">${esc(label)}</label>` + (multi
    ? `<textarea id="log-word-${id}" data-word="${id}" rows="${id === 'g1' ? 4 : 2}" maxlength="${WORD_MAX * 3 + 2}"></textarea>`
    : `<input type="text" id="log-word-${id}" data-word="${id}" maxlength="${WORD_MAX}" />`);
  $('log-words-grid').innerHTML = row('b1', 'Header belief 1') + row('b2', 'Header belief 2') +
    qs.map((f) => row(f.id, labelOf(f), true)).join('');
  $('log-words-grid').querySelectorAll('[data-word]').forEach((el) => {
    el.placeholder = el.dataset.word.startsWith('b') ? 'No line' : 'No cue';
    el.addEventListener('input', () => { saveWord(el.dataset.word, el.value); renderProfile(); });
    el.addEventListener('change', () => { el.value = saveWord(el.dataset.word, el.value); renderProfile(); });
  });
  $('log-words-reset').addEventListener('click', () => {
    if (!confirm('Put the header beliefs and gratitude cues back to the original text?')) return;
    resetWords(); renderProfile();
  });
}
buildWordFields();
$('log-name').maxLength = NAME_MAX;
$('log-holding').maxLength = LABEL_MAX; $('log-business').maxLength = LABEL_MAX;
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
  if (!confirm('Clear your Captain’s Log profile (name, holding company, main business, birthday, home location, tracker targets, checklist, edited beliefs and cues)? Log entries are kept. Your name is shared with Aretoria on this device.')) return;
  clearProfile();
  Object.values(FIELDS).forEach((id) => { $(id).value = ''; });
  homeEl.value = '';
  window.dispatchEvent(new Event('mec:home'));
  renderProfile(); renderHome();
});

/* ---------- Home location (v42): optional; local weather follows it when this device's location isn't shared ---------- */
const homeEl = $('log-home'), homeStatus = $('log-home-status'), homeLocate = $('log-home-locate');
homeEl.maxLength = 80;
let homeBusy = false;
function homeNote() {
  const h = parse_home(readProfile().home);
  const sky = globalThis.__mecSky;
  if (sky && sky.source === 'device') return `Weather follows this device${sky.place ? ` (${sky.place})` : ''}.${h ? ` Home: ${h.name}.` : ''}`;
  return h ? `Local weather for ${h.name}.` : 'Not set. Type a city, or use your location.';
}
function renderHome(msg) {
  const h = parse_home(readProfile().home);
  if (document.activeElement !== homeEl) homeEl.value = h ? h.name : '';
  homeStatus.textContent = msg || homeNote();
}
let homeSeq = 0;
async function saveHome() {
  const q = homeEl.value.replace(/\s+/g, ' ').trim();
  const cur = parse_home(readProfile().home);
  if (cur && q === cur.name) { renderHome(); return; }
  if (!q) {
    try { localStorage.removeItem(HOME_KEY); } catch {}
    window.dispatchEvent(new Event('mec:home'));
    renderHome(); return;
  }
  const seq = ++homeSeq; homeBusy = true;
  homeStatus.textContent = 'Looking up…';
  try {
    const hit = await geocode_place(q);
    if (seq !== homeSeq) return;
    if (!hit) { homeStatus.textContent = `Couldn’t find “${q}”. Try a nearby city, or add the state or country.`; return; }
    try { localStorage.setItem(HOME_KEY, JSON.stringify(hit)); } catch {}
    homeEl.value = hit.name;
    homeBusy = false;
    window.dispatchEvent(new Event('mec:home'));
    renderHome();
  } catch {
    if (seq === homeSeq) homeStatus.textContent = 'Couldn’t reach the place search. Check your connection and try again.';
  } finally { if (seq === homeSeq) homeBusy = false; }
}
homeEl.addEventListener('change', saveHome);
homeEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); homeEl.blur(); } });
if (!('geolocation' in navigator)) homeLocate.hidden = true;
homeLocate.addEventListener('click', () => {
  homeStatus.textContent = 'Asking this browser for your location…';
  window.dispatchEvent(new Event('mec:locate'));
});
window.addEventListener('mec:locate-result', (e) => {
  homeStatus.textContent = e.detail && e.detail.denied
    ? 'Location is blocked for this site. Allow it in your browser settings, or type a city.'
    : 'Couldn’t get your location. Try again, or type a city.';
});
window.addEventListener('mec:sky', () => { if (!homeBusy) renderHome(); }); // a locate failure message (sent after this) wins
// The weather strip's "Set a location for local weather" opens Profile at Home location.
$('sky-set')?.addEventListener('click', () => {
  settings.hidden = false;
  settingsBtn.setAttribute('aria-expanded', 'true');
  homeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  setTimeout(() => homeEl.focus({ preventScroll: true }), 350);
});
// another tab (or Aretoria) changed the shared name
window.addEventListener('storage', (e) => { if (!e.key || /^mec-(aretoria:name|log-(initials|enterprise|venture|birthday|wake|bed|supplements|home|words))$/.test(e.key)) { renderProfile(); renderHome(); } });

window.addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });

show(current);
renderProfile();
renderHome();

/* v45: desktop equal-height row. The calendar column's height lets the log match it exactly when every
   section is closed, even on short screens (see .tri-log .log-card max-height in styles.css). */
(() => {
  const cal = document.querySelector('.tri-cal');
  if (!cal || !('ResizeObserver' in window)) return;
  const set = () => document.documentElement.style.setProperty('--cal-h', `${Math.round(cal.getBoundingClientRect().height)}px`);
  new ResizeObserver(set).observe(cal);
  set();
})();
