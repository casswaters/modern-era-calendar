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

/** Format MEC date for display (plain single-line with middots). */
export function format_mec(rec) {
  if (rec.kind === "renaissance") {
    return `${rec.holiday_name} · Year ${rec.mec_year}`;
  }
  return `${rec.month_name} ${rec.mec_day} · ${rec.day_name} · Cycle ${rec.cycle} · Year ${rec.mec_year}`;
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

/* ---------- Gregorian holidays (US-leaning, computed per year) ---------- */

/** weekday: 0=Sun … 6=Sat. Returns day-of-month of the n-th weekday in month (1-based n). */
export function nth_weekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1).getDay();
  const offset = (weekday - first + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** Last weekday (0=Sun…6=Sat) in month. */
export function last_weekday(year, month, weekday) {
  const dim = [0, 31, is_leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
  const last = new Date(year, month - 1, dim).getDay();
  const offset = (last - weekday + 7) % 7;
  return dim - offset;
}

/** Western (Gregorian) Easter Sunday via Anonymous Gregorian algorithm. */
export function easter_western(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * All major traditional Gregorian holidays for a year.
 * Returns array of { month, day, name, id }.
 */
export function gregorian_holidays(year) {
  const easter = easter_western(year);
  return [
    { month: 1, day: 1, name: "New Year's Day", id: "new_year" },
    { month: 1, day: nth_weekday(year, 1, 1, 3), name: "MLK Day", id: "mlk" },
    { month: 2, day: 14, name: "Valentine's Day", id: "valentine" },
    { month: 2, day: nth_weekday(year, 2, 1, 3), name: "Presidents' Day", id: "presidents" },
    { month: 3, day: 17, name: "St. Patrick's Day", id: "st_patrick" },
    { month: easter.month, day: easter.day, name: "Easter", id: "easter" },
    { month: 5, day: nth_weekday(year, 5, 0, 2), name: "Mother's Day", id: "mothers" },
    { month: 5, day: last_weekday(year, 5, 1), name: "Memorial Day", id: "memorial" },
    { month: 6, day: 19, name: "Juneteenth", id: "juneteenth" },
    { month: 6, day: nth_weekday(year, 6, 0, 3), name: "Father's Day", id: "fathers" },
    { month: 7, day: 4, name: "Independence Day", id: "independence" },
    { month: 9, day: nth_weekday(year, 9, 1, 1), name: "Labor Day", id: "labor" },
    { month: 10, day: 31, name: "Halloween", id: "halloween" },
    { month: 11, day: 11, name: "Veterans Day", id: "veterans" },
    { month: 11, day: nth_weekday(year, 11, 4, 4), name: "Thanksgiving", id: "thanksgiving" },
    { month: 12, day: 24, name: "Christmas Eve", id: "xmas_eve" },
    { month: 12, day: 25, name: "Christmas", id: "christmas" },
    { month: 12, day: 31, name: "New Year's Eve", id: "new_years_eve" }
  ];
}

/** Holidays falling on Gregorian y-m-d (may be empty or multiple). */
export function holidays_on(year, month, day) {
  return gregorian_holidays(year).filter(h => h.month === month && h.day === day);
}

/** Map key "m-d" → holiday list for a year (cached per call). */
export function holiday_map(year) {
  const map = new Map();
  for (const h of gregorian_holidays(year)) {
    const key = `${h.month}-${h.day}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(h);
  }
  return map;
}

/**
 * Multi-line MEC date parts for UI.
 * Regular: line1 = "October 3 · Wednesday", line2 = "Cycle 1 · Year 250"
 * Renaissance: line1 = holiday name, line2 = "Year N"
 */
export function format_mec_parts(rec) {
  if (rec.kind === "renaissance") {
    return {
      line1: rec.holiday_name,
      line2: `Year ${rec.mec_year}`,
      accentOn: "line1"
    };
  }
  return {
    line1: `${rec.month_name} ${rec.mec_day} · ${rec.day_name}`,
    line2: `Cycle ${rec.cycle} · Year ${rec.mec_year}`,
    accentOn: "day_name",
    day_name: rec.day_name,
    month_day: `${rec.month_name} ${rec.mec_day}`
  };
}

/** HTML for stacked MEC date (today banner / day detail). */
export function format_mec_html(rec) {
  if (rec.kind === "renaissance") {
    return `<span class="mec-line1"><span class="accent">${escapeHtml(rec.holiday_name)}</span></span>` +
      `<span class="mec-line2">Year ${rec.mec_year}</span>`;
  }
  return `<span class="mec-line1">${escapeHtml(rec.month_name)} ${rec.mec_day} · <span class="accent">${escapeHtml(rec.day_name)}</span></span>` +
    `<span class="mec-line2">Cycle ${rec.cycle} · Year ${rec.mec_year}</span>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
