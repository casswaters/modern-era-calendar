/**
 * Captain's Log "Paste a note" (v54): turn a pasted plain-text daily note (same template as the log)
 * into the day's field values. Pure, no DOM, no network, nothing logged. Tested in node.
 * Lines are sorted by section heading into the existing field ids; anything without a field of its own
 * (gratitude answers, unknown lines) goes into Notes under its heading, so nothing is lost.
 */
const TEXT_IDS = ['social_fam', 'social_friends', 'social_col', 'social_adv', 'purchases', 'health'];
export const PASTE_IDS = ['wake', 'bed', 'cw_checkin', 'anam_pipeline', 'anam_other', 'notes', 'comm_out', 'comm_in',
  'social_fam', 'social_friends', 'social_col', 'social_adv', 'care', 'supp_notes', 'drank', 'ate', 'dreams', 'media', 'purchases', 'workout', 'health'];

/** Heading key: no emoji, no trailing colon, plain apostrophes, lower case. */
export function headKey(line) {
  return String(line)
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D]/gu, '')
    .replace(/[’‘]/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ')
    .trim().replace(/:$/, '').trim().toLowerCase();
}

const TOP = {
  'gratitude exercise': { sec: 'gratitude' }, 'grounding exercise': { sec: 'grounding' }, 'default to': { sec: 'defaults' },
  'daily tracker': { sec: 'tracker' }, 'life journal': { to: 'notes' }, 'notes': { to: 'notes' },
  'career': { to: 'cw_checkin', sec: 'career' }, 'personal communication': { sec: 'comm', label: 'Personal Communication' },
  'social': { sec: 'social', label: 'Social' }, 'personal care & activities': { to: 'care' }, 'personal care and activities': { to: 'care' },
  'personal care': { to: 'care' }, 'inputs & outputs': { sec: 'io', label: 'Inputs & Outputs' }, 'inputs and outputs': { sec: 'io', label: 'Inputs & Outputs' },
  'supplements': { to: 'supp_notes' }, 'drank': { to: 'drank' }, 'ate': { to: 'ate' }, 'dreams': { to: 'dreams' },
  'listened to/watched/read': { to: 'media' }, 'listened / watched / read': { to: 'media' }, 'purchases': { to: 'purchases' },
  'workout': { to: 'workout' }, 'health': { to: 'health' }
};
const SUB = {
  comm: { outbound: 'comm_out', inbound: 'comm_in' },
  social: { family: 'social_fam', friends: 'social_friends', 'colleagues & associates': 'social_col', 'colleagues and associates': 'social_col', 'to adventure & fellowship': 'social_adv', 'to adventure and fellowship': 'social_adv' }
};
const TEMPLATE_LINES = [
  "what am i being influenced by?", "what's working?", "what's not working?", "am i taking care of myself?", 'is my plan working?',
  'am i having fun?', 'is it sustainable?', 'what can be done right now?', '"what would it require to..."', '"what would it require to…"',
  '"how does that work?"', '"tell me more."', 'good morning', 'good night',
  '- physical setting, mental perspective, emotional feelings, themes, messages, symbols, thoughts'
].map((s) => s.replace(/[“”]/g, '"'));
const norm = (s) => headKey(s).replace(/[“”]/g, '"');
const DATE_RE = /^(mon|tues|wednes|thurs|fri|satur|sun)day\b.*\d|^day #?\d+/i;
const TIME_RE = /^(\d{1,2}(:\d{2})?\s*(am|pm)?)\s*:?$/i;

/** Remove the shared leading indentation of a block, keep the rest. */
function dedent(lines) {
  const ind = lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length);
  const min = ind.length ? Math.min(...ind) : 0;
  return lines.map((l) => l.slice(min).trimEnd());
}

/** Pure: pasted text to { fields: { id: value } }. opts: { business, holding, beliefs: [b1, b2] }. */
export function parseNote(text, opts = {}) {
  const raw = String(text == null ? '' : text).replace(/\r\n?/g, '\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const out = {}; const groups = []; let group = null;
  const add = (id, line) => { (out[id] = out[id] || []).push(line); };
  const toGroup = (label, line) => {
    if (!group || group.label !== label) { group = { label, lines: [] }; groups.push(group); }
    group.lines.push(line);
  };
  const beliefs = (opts.beliefs || []).map(norm).filter(Boolean);
  const business = opts.business ? norm(opts.business) : '';
  let sec = 'header', to = null, label = 'Header', times = 0;
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const k = norm(t);
    const isBullet = /^[-•*]/.test(t);
    // inline "Heading: value" (e.g. "Health: Great")
    const inl = !isBullet && t.match(/^([^:]{2,40}):\s+(.+)$/);
    const top = !isBullet && (TOP[k] || (k.startsWith('listened') && TOP['listened to/watched/read']) || (inl && TOP[norm(inl[1])]));
    if (top) {
      sec = top.sec || (top.to ? 'field' : 'label');
      to = top.to || null; label = top.label || t.replace(/:$/, '');
      if (inl && !TOP[k]) { if (to) add(to, inl[2]); else toGroup(label, inl[2]); }
      continue;
    }
    if (!isBullet && SUB[sec] && SUB[sec][k]) { to = SUB[sec][k]; continue; }
    if (!isBullet && SUB[sec] && inl && SUB[sec][norm(inl[1])]) { add(SUB[sec][norm(inl[1])], inl[2]); to = SUB[sec][norm(inl[1])]; continue; }
    if (TEMPLATE_LINES.includes(k) || TEMPLATE_LINES.includes(k.replace(/^[-•*]\s*/, ''))) continue;
    if (sec === 'header') {
      if (DATE_RE.test(t) || beliefs.includes(k)) continue;
      toGroup('Header', line); continue;
    }
    if (sec === 'gratitude' || sec === 'grounding' || sec === 'defaults') {
      if (/^\d\.\s/.test(t)) { label = t; continue; }
      toGroup(label, line); continue;
    }
    if (sec === 'tracker') {
      const m = t.match(TIME_RE);
      if (m) { const id = times++ === 0 ? 'wake' : 'bed'; out[id] = [m[1].trim()]; continue; }
      if (/^good (morning|night)/i.test(t)) continue;
      toGroup('Daily Tracker', line); continue;
    }
    if (sec === 'career') {
      if (business && k === business) { to = 'anam_pipeline'; continue; }
      add(to, line); continue;
    }
    if (to) { add(to, line); continue; }
    toGroup(label, line);
  }
  const fields = {};
  for (const [id, lines] of Object.entries(out)) {
    if (id === 'wake' || id === 'bed') { fields[id] = lines[0]; continue; }
    const d = dedent(lines);
    fields[id] = TEXT_IDS.includes(id) ? d.map((l) => l.trim().replace(/^[-•*]\s*/, '')).join('; ') : d.join('\n');
  }
  if (groups.length) {
    const extra = groups.map((g) => [/[?:]$/.test(g.label) ? g.label : g.label + ':', ...dedent(g.lines)].join('\n')).join('\n\n');
    fields.notes = fields.notes ? `${fields.notes}\n\n${extra}` : extra;
  }
  return { fields };
}

/** Pure: what saving would do to each field. mode: fill (was empty), add (kept old text, new text added below), same (already there). */
export function mergePlan(existing = {}, fields = {}) {
  return PASTE_IDS.filter((id) => fields[id]).map((id) => {
    const old = typeof existing[id] === 'string' ? existing[id].trim() : '';
    const neu = fields[id];
    if (!old) return { id, mode: 'fill', value: neu };
    if (old === neu.trim() || old.includes(neu.trim())) return { id, mode: 'same', value: existing[id] };
    if (id === 'wake' || id === 'bed') return { id, mode: 'keep', value: existing[id], pasted: neu };
    const sep = TEXT_IDS.includes(id) ? '; ' : '\n';
    return { id, mode: 'add', value: `${existing[id]}${sep}${neu}` };
  });
}

/** v57: Paste a note opens on yesterday when the log is showing today (the morning flow logs the day before); any other day stays. */
export function pasteDay(cur, today) {
  const same = cur.year === today.year && cur.month === today.month && cur.day === today.day;
  if (!same) return cur;
  const dt = new Date(today.year, today.month - 1, today.day - 1);
  return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
}
