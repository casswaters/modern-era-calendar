/**
 * Captain's Log profile (v38): the few personal values the log used to hard-code.
 * Everything lives in this browser's localStorage only; blank fields fall back to neutral defaults.
 * The name key is shared with standalone Aretoria (same origin, casswaters.github.io), so one name
 * serves both: set it here or in Aretoria's prompt and the other uses it too.
 */
export const NAME_KEY = 'mec-aretoria:name';          // shared with Aretoria
export const NAME_ASKED_KEY = 'mec-aretoria:name-asked';
export const INITIALS_KEY = 'mec-log-initials';
export const WORK_KEY = 'mec-log-enterprise';
export const VENTURE_KEY = 'mec-log-venture';
export const BDAY_KEY = 'mec-log-birthday';
export const WAKE_KEY = 'mec-log-wake';               // v39: daily tracker targets
export const BED_KEY = 'mec-log-bed';
export const SUPPS_KEY = 'mec-log-supplements';       // v39: checklist lines, newline-separated
export const HOME_KEY = 'mec-log-home';               // v42: home location JSON { q, name, lat, lon } (weather.js reads it)
export const PROFILE_KEYS = [NAME_KEY, INITIALS_KEY, WORK_KEY, VENTURE_KEY, BDAY_KEY, WAKE_KEY, BED_KEY, SUPPS_KEY, HOME_KEY];
export const NAME_MAX = 24, INITIALS_MAX = 4, LABEL_MAX = 40, TIME_MAX = 12, SUPP_MAX = 80, SUPPS_MAX = 6;
export const DEFAULTS = {
  enterprise: 'Main work', venture: 'Side venture', wake: 'Wake', bed: 'Bed',
  supplements: ['Morning supplements', 'Midday supplements', 'Evening supplements']
};
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
/** Free label (enterprise / venture names): no markup characters or control codes, one line, 40 characters. */
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
  const enterprise = cleanLabel(raw.enterprise) || (initials ? `${initials} Enterprises` : DEFAULTS.enterprise);
  const venture = cleanLabel(raw.venture) || DEFAULTS.venture;
  const wake = cleanTime(raw.wake) || DEFAULTS.wake;
  const bed = cleanTime(raw.bed) || DEFAULTS.bed;
  const s = cleanSupplements(raw.supplements);
  const supplements = s.length ? s : DEFAULTS.supplements.slice();
  return { name, initials, enterprise, venture, birthday: cleanDate(raw.birthday), wake, bed, supplements };
}

const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
export function readProfile() {
  return { name: get(NAME_KEY), initials: get(INITIALS_KEY), enterprise: get(WORK_KEY), venture: get(VENTURE_KEY), birthday: get(BDAY_KEY),
    wake: get(WAKE_KEY), bed: get(BED_KEY), supplements: get(SUPPS_KEY), home: get(HOME_KEY) };
}
/** Stores one cleaned field (empty removes it). Returns the cleaned value. */
export function saveField(field, raw) {
  const map = { name: [NAME_KEY, cleanName], initials: [INITIALS_KEY, cleanInitials], enterprise: [WORK_KEY, cleanLabel], venture: [VENTURE_KEY, cleanLabel], birthday: [BDAY_KEY, cleanDate],
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
