/**
 * Captain's Log profile (v38): the few personal values the log used to hard-code.
 * Everything lives in this browser's localStorage only; blank fields fall back to neutral defaults.
 * The name key is shared with standalone Aretoria (same origin, casswaters.github.io), so one name
 * serves both: set it here or in Aretoria's prompt and the other uses it too.
 */
export const NAME_KEY = 'mec-aretoria:name';          // shared with Aretoria
export const NAME_ASKED_KEY = 'mec-aretoria:name-asked';
export const INITIALS_KEY = 'mec-log-initials';
export const WORK_KEY = 'mec-log-enterprise';          // v45: the holding company (umbrella of professional activities)
export const VENTURE_KEY = 'mec-log-venture';          // v45: the main business under it (key kept so saved values stay)
export const BDAY_KEY = 'mec-log-birthday';
export const WAKE_KEY = 'mec-log-wake';               // v39: daily tracker targets
export const BED_KEY = 'mec-log-bed';
export const SUPPS_KEY = 'mec-log-supplements';       // v39: checklist lines, newline-separated
export const HOME_KEY = 'mec-log-home';               // v42: home location JSON { q, name, lat, lon } (weather.js reads it)
export const WORDS_KEY = 'mec-log-words';             // v46: edited header beliefs and gratitude cues, JSON of overrides only
export const PROFILE_KEYS = [NAME_KEY, INITIALS_KEY, WORK_KEY, VENTURE_KEY, BDAY_KEY, WAKE_KEY, BED_KEY, SUPPS_KEY, HOME_KEY, WORDS_KEY];
export const NAME_MAX = 24, INITIALS_MAX = 4, LABEL_MAX = 40, TIME_MAX = 12, SUPP_MAX = 80, SUPPS_MAX = 6;
export const DEFAULTS = {
  holding: 'Holding company', business: 'Main business', wake: 'Wake', bed: 'Bed',
  supplements: ['Morning supplements', 'Midday supplements', 'Evening supplements']
};
/** v46: the two header beliefs (b1, b2) and the standing cue under each gratitude question (g1 to g8).
   The original template text is the default; a cue's first line is the cue, any further lines are plain notes under it. */
export const WORD_DEFAULTS = {
  b1: 'Belief creates consequence.',
  b2: 'Mutual confidence is the foundation of all satisfactory human relationships.',
  g1: 'S.C.O.R.E.: Sincerity, Consistency, Originality, Reflection, Expression.\nA way to anchor in gratitude instead of breezing through it.',
  g2: 'Keep it simple. Don’t overclock my energy. Love isn’t a fixing agent.',
  g3: '', g4: 'Navigate consciously. Don’t over promise.', g5: '', g6: '', g7: '',
  g8: 'Stay grounded in the miracle. Compound efforts. Create. Build.'
};
export const WORD_IDS = Object.keys(WORD_DEFAULTS);
export const WORD_MAX = 160, WORD_LINES = 3;
/** Beliefs are one line; cues up to 3 lines. Each line cleaned like a label, 160 characters. */
export function cleanWords(id, raw) {
  const lines = String(raw == null ? '' : raw).split(/\r?\n/)
    .map((l) => Array.from(l.normalize('NFC').replace(/[\u0000-\u001f\u007f<>{}]/g, '').replace(/\s+/g, ' ').trim()).slice(0, WORD_MAX).join('').trim())
    .filter(Boolean);
  return (id.startsWith('b') ? lines.slice(0, 1) : lines.slice(0, WORD_LINES)).join('\n');
}
const parseWords = (json) => { try { const o = JSON.parse(json || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; } };
/** Every belief and cue: the saved edit when there is one (an emptied field stays empty), else the default. */
export function wordsView(json) {
  const o = parseWords(json);
  return Object.fromEntries(WORD_IDS.map((id) => [id, Object.prototype.hasOwnProperty.call(o, id) && typeof o[id] === 'string' ? cleanWords(id, o[id]) : WORD_DEFAULTS[id]]));
}
/** Saves one belief or cue; text equal to the default removes the override. Returns the cleaned text. */
export function saveWord(id, raw) {
  if (!WORD_IDS.includes(id)) return '';
  const v = cleanWords(id, raw);
  try {
    const o = parseWords(localStorage.getItem(WORDS_KEY));
    if (v === WORD_DEFAULTS[id]) delete o[id]; else o[id] = v;
    if (Object.keys(o).length) localStorage.setItem(WORDS_KEY, JSON.stringify(o)); else localStorage.removeItem(WORDS_KEY);
  } catch {}
  return v;
}
export function resetWords() { try { localStorage.removeItem(WORDS_KEY); } catch {} }

/** Saved-entry field ids for checklist lines (the first three keep the ids the old fixed list used). */
export const SUPP_IDS = ['supp_620', 'supp_930', 'supp_9pm', 'supp_4', 'supp_5', 'supp_6'];

/** Same rule as Aretoria: unicode letters, spaces, hyphens, apostrophes; trimmed; 24 characters. */
export function cleanName(raw) {
  const s = String(raw == null ? '' : raw).normalize('NFC').replace(/[^\p{L}\p{M}\s'’-]/gu, '').replace(/\s+/g, ' ').trim();
  const out = Array.from(s).slice(0, NAME_MAX).join('').trim();
  return /\p{L}/u.test(out) ? out : '';
}
/** Letters only, upper-cased, up to 4. */
export function cleanInitials(raw) {
  return Array.from(String(raw == null ? '' : raw).normalize('NFC').replace(/[^\p{L}]/gu, '')).slice(0, INITIALS_MAX).join('').toLocaleUpperCase();
}
/** Free label (holding company / main business names): no markup characters or control codes, one line, 40 characters. */
export function cleanLabel(raw) {
  const s = String(raw == null ? '' : raw).normalize('NFC').replace(/[\u0000-\u001f\u007f<>{}]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, LABEL_MAX).join('').trim();
}
export function cleanTime(raw) { return Array.from(cleanLabel(raw)).slice(0, TIME_MAX).join('').trim(); }
/** Checklist: one item per line, each cleaned like a label (80 characters), blank lines dropped, at most 6. */
export function cleanSupplements(raw) {
  const lines = Array.isArray(raw) ? raw : String(raw == null ? '' : raw).split(/\r?\n/);
  return lines.map((l) => Array.from(String(l).normalize('NFC').replace(/[\u0000-\u001f\u007f<>{}]/g, '').replace(/\s+/g, ' ').trim()).slice(0, SUPP_MAX).join('').trim()).filter(Boolean).slice(0, SUPPS_MAX);
}
export function cleanDate(raw) {
  const s = String(raw == null ? '' : raw);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}
/** First letters of up to three words of the name ("Ada King-Lovelace" → "AKL"). */
export function deriveInitials(name) {
  return cleanInitials(cleanName(name).split(/[\s-]+/).filter(Boolean).slice(0, 3).map((w) => Array.from(w)[0]).join(''));
}
/** Labels the log renders, from raw stored values (all optional). */
export function profileView(raw = {}) {
  const name = cleanName(raw.name);
  const initials = cleanInitials(raw.initials) || deriveInitials(name);
  // v45: names are used exactly as typed. Nothing is built from initials (v38 to v44 built a default from initials, which cut a two-letter name down to one).
  const holdingSet = cleanLabel(raw.holding ?? raw.enterprise), businessSet = cleanLabel(raw.business ?? raw.venture);
  const holding = holdingSet || DEFAULTS.holding;
  const business = businessSet || DEFAULTS.business;
  const wake = cleanTime(raw.wake) || DEFAULTS.wake;
  const bed = cleanTime(raw.bed) || DEFAULTS.bed;
  const s = cleanSupplements(raw.supplements);
  const supplements = s.length ? s : DEFAULTS.supplements.slice();
  return { name, initials, holding, business, holdingSet: !!holdingSet, businessSet: !!businessSet, owner: ownerTitle(name), birthday: cleanDate(raw.birthday), wake, bed, supplements, words: wordsView(raw.words) };
}
/** "Ada’s Captain’s Log"; names ending in s also take ’s ("Chris’s"); no name: "Captain’s Log". */
export function ownerTitle(name) {
  const n = cleanName(name);
  return n ? `${n}’s Captain’s Log` : 'Captain’s Log';
}

const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
export function readProfile() {
  return { name: get(NAME_KEY), initials: get(INITIALS_KEY), holding: get(WORK_KEY), business: get(VENTURE_KEY), birthday: get(BDAY_KEY),
    wake: get(WAKE_KEY), bed: get(BED_KEY), supplements: get(SUPPS_KEY), home: get(HOME_KEY), words: get(WORDS_KEY) };
}
/** Stores one cleaned field (empty removes it). Returns the cleaned value. */
export function saveField(field, raw) {
  const map = { name: [NAME_KEY, cleanName], initials: [INITIALS_KEY, cleanInitials], holding: [WORK_KEY, cleanLabel], business: [VENTURE_KEY, cleanLabel], birthday: [BDAY_KEY, cleanDate],
    wake: [WAKE_KEY, cleanTime], bed: [BED_KEY, cleanTime], supplements: [SUPPS_KEY, (r) => cleanSupplements(r).join('\n')] };
  const [key, clean] = map[field];
  const v = clean(raw);
  try {
    if (v) localStorage.setItem(key, v); else localStorage.removeItem(key);
    if (field === 'name' && v) localStorage.setItem(NAME_ASKED_KEY, '1'); // Aretoria won't ask again
  } catch {}
  return v;
}
export function clearProfile() { try { PROFILE_KEYS.forEach((k) => localStorage.removeItem(k)); } catch {} }
