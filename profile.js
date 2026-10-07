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
export const PROFILE_KEYS = [NAME_KEY, INITIALS_KEY, WORK_KEY, VENTURE_KEY, BDAY_KEY];
export const NAME_MAX = 24, INITIALS_MAX = 4, LABEL_MAX = 40;
export const DEFAULTS = { enterprise: 'Main work', venture: 'Side venture' };

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
  return { name, initials, enterprise, venture, birthday: cleanDate(raw.birthday) };
}

const get = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
export function readProfile() {
  return { name: get(NAME_KEY), initials: get(INITIALS_KEY), enterprise: get(WORK_KEY), venture: get(VENTURE_KEY), birthday: get(BDAY_KEY) };
}
/** Stores one cleaned field (empty removes it). Returns the cleaned value. */
export function saveField(field, raw) {
  const map = { name: [NAME_KEY, cleanName], initials: [INITIALS_KEY, cleanInitials], enterprise: [WORK_KEY, cleanLabel], venture: [VENTURE_KEY, cleanLabel], birthday: [BDAY_KEY, cleanDate] };
  const [key, clean] = map[field];
  const v = clean(raw);
  try {
    if (v) localStorage.setItem(key, v); else localStorage.removeItem(key);
    if (field === 'name' && v) localStorage.setItem(NAME_ASKED_KEY, '1'); // Aretoria won't ask again
  } catch {}
  return v;
}
export function clearProfile() { try { PROFILE_KEYS.forEach((k) => localStorage.removeItem(k)); } catch {} }
