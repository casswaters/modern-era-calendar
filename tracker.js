/**
 * Captain's Log Daily Tracker (v46): the day's overview. Pure data and status, no DOM (tested in node).
 * Each row is done when its area has entries for the day, or when ticked by hand (saved as trk_<id>).
 */
import { DEFAULTS, SUPP_IDS } from './profile.js?v=cl46';

/* fields: the saved-entry ids that mark the row done automatically. sec / to: where a tap jumps. */
export const TRACKER = [
  { id: 'wake', icon: '☀️', label: 'Wake', time: 'wake', target: (p) => (p.wake !== DEFAULTS.wake ? p.wake : ''), fields: ['wake'] },
  { id: 'sleep', icon: '💤', label: 'Sleep', time: 'bed', target: (p) => (p.bed !== DEFAULTS.bed ? p.bed : ''), fields: ['bed'] },
  { id: 'career', label: 'Career', sub: (p) => [p.holdingSet && p.holding, p.businessSet && p.business].filter(Boolean).join(' · '), sec: 'career', fields: ['cw_checkin', 'anam_pipeline', 'anam_other'] },
  { id: 'journal', label: 'Life Journal / Notes', sec: 'notes', to: 'notes', fields: ['notes'] },
  { id: 'comm', label: 'Communication', sec: 'notes', to: 'comm_out', fields: ['comm_out', 'comm_in'] },
  { id: 'social', label: 'Social', sec: 'notes', to: 'social_fam', fields: ['social_fam', 'social_friends', 'social_col', 'social_adv'] },
  { id: 'care', label: 'Care', sec: 'notes', to: 'care', fields: ['care'] },
  { id: 'io', label: 'Inputs & Outputs', sec: 'io', fields: ['drank', 'ate', 'dreams', 'media', 'purchases', 'workout', 'health'], checklist: true }
];
const filledVal = (v) => v === true || (typeof v === 'string' && v.trim() !== '');
/** Pure: each row's state for a day's saved data. checklist rows also count the Profile checklist ticks. */
export function trackerStatus(data = {}, suppIds = SUPP_IDS) {
  const rows = TRACKER.map((r) => {
    const keys = r.checklist ? [...r.fields, ...suppIds] : r.fields;
    const auto = keys.some((k) => filledVal(data[k]));
    const manual = data[`trk_${r.id}`] === true;
    return { id: r.id, auto, manual, done: auto || manual };
  });
  return { rows, done: rows.filter((r) => r.done).length, total: rows.length };
}

