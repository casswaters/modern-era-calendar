/**
 * Modern Era Calendar (MEC) — canonical engine (PDF Section 5).
 * Epoch: July 4, 1776 = Primaday, July 1, Year 1.
 * mec_year = Gregorian year - 1776. No fixed lag; always derive from slots().
 */

export const DAY_NAMES = [
  "Primaday", "Tuesday", "Wednesday", "Quartiday", "Funfday",
  "Viday", "Sunday", "Octiday", "Noviday", "Centiday"
];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/** month -> holiday. Month 10 only if leap. */
export const REN = {
  1: "Local Area Network Day",
  3: "Global Society Day",
  5: "Nature Harmony Day",
  7: "Tesla Day",
  8: "Theology Day",
  10: "Hermes Trismegistus Day"
};

export function is_leap(y) {
  return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
}

export function mec_year(gregorianYear) {
  return gregorianYear - 1776;
}

/**
 * Build ordered slot list for a Gregorian year.
 * Index 0 == Gregorian day-of-year 1.
 * Common year: 365 slots. Leap year: 366.
 */
export function slots(year) {
  const leap = is_leap(year);
  const out = [];
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= 30; d++) {
      out.push({
        kind: "regular",
        month: m,
        day: d,
        cycle: Math.floor((d - 1) / 10) + 1,
        name: DAY_NAMES[(d - 1) % 10]
      });
    }
    if (m in REN && (m !== 10 || leap)) {
      out.push({
        kind: "renaissance",
        month: m,
        day: 31,
        cycle: null,
        name: REN[m]
      });
    }
  }
  return out;
}

/** 1-based Gregorian day-of-year for y-m-d. */
export function gregorian_day_of_year(y, m, d) {
  const dim = [0, 31, is_leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let n = d;
  for (let i = 1; i < m; i++) n += dim[i];
  return n;
}

/** Convert Gregorian day-of-year (1-based) to {y,m,d}. */
export function ordinal_to_gregorian(y, ordinal) {
  const dim = [0, 31, is_leap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let rem = ordinal;
  for (let m = 1; m <= 12; m++) {
    if (rem <= dim[m]) return { year: y, month: m, day: rem };
    rem -= dim[m];
  }
  throw new Error(`Invalid ordinal ${ordinal} for year ${y}`);
}

/**
 * Gregorian (y,m,d) → MEC record.
 * Returns: { gregorian_date, mec_year, mec_month, mec_day, kind,
 *            day_name, cycle, holiday_name, month_name }
 */
export function gregorian_to_mec(y, m, d) {
  const doy = gregorian_day_of_year(y, m, d);
  const list = slots(y);
  if (doy < 1 || doy > list.length) {
    throw new Error(`Day-of-year ${doy} out of range for ${y}`);
  }
  const slot = list[doy - 1];
  const my = mec_year(y);
  if (slot.kind === "renaissance") {
    return {
      gregorian_date: { year: y, month: m, day: d },
      mec_year: my,
      mec_month: slot.month,
      mec_day: 31,
      kind: "renaissance",
      day_name: null,
      cycle: null,
      holiday_name: slot.name,
      month_name: MONTH_NAMES[slot.month - 1]
    };
  }
  return {
    gregorian_date: { year: y, month: m, day: d },
    mec_year: my,
    mec_month: slot.month,
    mec_day: slot.day,
    kind: "regular",
    day_name: slot.name,
    cycle: slot.cycle,
    holiday_name: null,
    month_name: MONTH_NAMES[slot.month - 1]
  };
}

/**
 * MEC → Gregorian.
 * For regular: mec_to_gregorian(year, month, day)
 * For holiday: mec_to_gregorian(year, month, 31) or pass holiday name via opts.
 * year here is Gregorian year (same as MEC year + 1776).
 */
export function mec_to_gregorian(year, month, day) {
  const list = slots(year);
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (s.month === month && s.day === day) {
      return ordinal_to_gregorian(year, i + 1);
    }
  }
  throw new Error(`MEC date ${year}-${month}-${day} not found in slots`);
}

/** Find next Renaissance Day on or after Gregorian y-m-d (exclusive of today if today is not one). */
export function next_renaissance_day(y, m, d) {
  const doy = gregorian_day_of_year(y, m, d);
  let list = slots(y);
  for (let i = doy; i < list.length; i++) {
    if (list[i].kind === "renaissance") {
      const g = ordinal_to_gregorian(y, i + 1);
      return { ...list[i], gregorian: g, mec_year: mec_year(y), days_until: i + 1 - doy };
    }
  }
  // Look in next year
  const nextY = y + 1;
  list = slots(nextY);
  for (let i = 0; i < list.length; i++) {
    if (list[i].kind === "renaissance") {
      const remainingThisYear = slots(y).length - doy;
      const g = ordinal_to_gregorian(nextY, i + 1);
      return {
        ...list[i],
        gregorian: g,
        mec_year: mec_year(nextY),
        days_until: remainingThisYear + (i + 1)
      };
    }
  }
  return null;
}

/** Holiday after a given MEC month this year, or null. */
export function renaissance_after_month(year, month) {
  if (!(month in REN)) return null;
  if (month === 10 && !is_leap(year)) return null;
  return REN[month];
}

/** Format MEC date for display. */
export function format_mec(rec) {
  if (rec.kind === "renaissance") {
    return `${rec.holiday_name}, Year ${rec.mec_year}`;
  }
  return `${rec.month_name} ${rec.mec_day}, ${rec.day_name}, Cycle ${rec.cycle}, Year ${rec.mec_year}`;
}

/** Format short MEC cell label. */
export function format_mec_short(rec) {
  if (rec.kind === "renaissance") return rec.holiday_name;
  return `${rec.month_name.slice(0, 3)} ${rec.mec_day}`;
}

export function format_gregorian(y, m, d) {
  const names = MONTH_NAMES;
  return `${names[m - 1]} ${d}, ${y}`;
}
