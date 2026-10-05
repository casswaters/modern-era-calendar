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

/* ---------- Gregorian / civil / religious holidays (computed per year) ---------- */

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

/** Monday on or before Gregorian y-m-d (day-of-month). */
export function monday_on_or_before(year, month, day) {
  const wd = new Date(year, month - 1, day).getDay();
  return day - ((wd - 1 + 7) % 7);
}

/** Shift a Gregorian y-m-d by delta days; returns { year, month, day }. */
export function add_gregorian_days(year, month, day, delta) {
  const dt = new Date(year, month - 1, day + delta);
  return { year: dt.getFullYear(), month: dt.getMonth() + 1, day: dt.getDate() };
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

/* ---- Compact Hebrew calendar (Dershowitz/Reingold R.D.) ---- */
const HEBREW_EPOCH = -1373428;
const HEB_NISAN = 1;
const HEB_TISHREI = 7;
const HEB_CHESHVAN = 8;
const HEB_KISLEV = 9;
const HEB_ADAR_I = 12;

function hebrew_is_leap(year) {
  return (1 + year * 7) % 19 < 7;
}

function hebrew_elapsed_days(year) {
  const prev = year - 1;
  const mElapsed =
    235 * Math.floor(prev / 19) +
    12 * (prev % 19) +
    Math.floor(((prev % 19) * 7 + 1) / 19);
  const pElapsed = 204 + 793 * (mElapsed % 1080);
  const hElapsed =
    5 +
    12 * mElapsed +
    793 * Math.floor(mElapsed / 1080) +
    Math.floor(pElapsed / 1080);
  const parts = (pElapsed % 1080) + 1080 * (hElapsed % 24);
  const day = 1 + 29 * mElapsed + Math.floor(hElapsed / 24);
  let alt = day;
  if (
    parts >= 19440 ||
    (day % 7 === 2 && parts >= 9924 && !hebrew_is_leap(year)) ||
    (day % 7 === 1 && parts >= 16789 && hebrew_is_leap(prev))
  ) {
    alt++;
  }
  if (alt % 7 === 0 || alt % 7 === 3 || alt % 7 === 5) return alt + 1;
  return alt;
}

function hebrew_days_in_year(year) {
  return hebrew_elapsed_days(year + 1) - hebrew_elapsed_days(year);
}

function hebrew_days_in_month(month, year) {
  const fixed = [0, 30, 29, 30, 29, 30, 29, 30, 0, 0, 29, 30, 0, 29];
  const d = fixed[month];
  if (d) return d;
  if (month === HEB_ADAR_I) return hebrew_is_leap(year) ? 30 : 29;
  if (month === HEB_CHESHVAN) return hebrew_days_in_year(year) % 10 === 5 ? 30 : 29;
  return hebrew_days_in_year(year) % 10 === 3 ? 29 : 30; // Kislev
}

function hebrew_months_in_year(year) {
  return hebrew_is_leap(year) ? 13 : 12;
}

/** Hebrew y-m-d → Rata Die (R.D. 1 = Mon 1 Jan 1 Gregorian). */
export function hebrew_to_rd(year, month, day) {
  let n = day;
  if (month < HEB_TISHREI) {
    const end = hebrew_months_in_year(year);
    for (let m = HEB_TISHREI; m <= end; m++) n += hebrew_days_in_month(m, year);
    for (let m = HEB_NISAN; m < month; m++) n += hebrew_days_in_month(m, year);
  } else {
    for (let m = HEB_TISHREI; m < month; m++) n += hebrew_days_in_month(m, year);
  }
  return HEBREW_EPOCH + hebrew_elapsed_days(year) + n - 1;
}

/** Rata Die → Gregorian { year, month, day }. */
export function rd_to_gregorian(rd) {
  const d0 = rd - 1;
  const n400 = Math.floor(d0 / 146097);
  const d1 = d0 % 146097;
  const n100 = Math.floor(d1 / 36524);
  const d2 = d1 % 36524;
  const n4 = Math.floor(d2 / 1461);
  const d3 = d2 % 1461;
  const n1 = Math.floor(d3 / 365);
  let day = (d3 % 365) + 1;
  if (n100 === 4 || n1 === 4) {
    return { year: 400 * n400 + 100 * n100 + 4 * n4 + n1, month: 12, day: 31 };
  }
  const year = 400 * n400 + 100 * n100 + 4 * n4 + n1 + 1;
  const dim = [0, 31, is_leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let month = 1;
  while (day > dim[month]) {
    day -= dim[month];
    month++;
  }
  return { year, month, day };
}

/** Hebrew y-m-d → Gregorian { year, month, day }. */
export function hebrew_to_gregorian(hy, hm, hd) {
  return rd_to_gregorian(hebrew_to_rd(hy, hm, hd));
}

/**
 * Major Jewish observances that fall in Gregorian `year`.
 * Fall holidays use Hebrew year Y+3761; spring (Passover) uses Y+3760.
 */
export function jewish_holidays(year) {
  const fallHy = year + 3761;
  const springHy = year + 3760;
  const specs = [
    { hy: fallHy, hm: HEB_TISHREI, hd: 1, name: "Rosh Hashanah", id: "rosh_hashanah" },
    { hy: fallHy, hm: HEB_TISHREI, hd: 10, name: "Yom Kippur", id: "yom_kippur" },
    { hy: springHy, hm: HEB_NISAN, hd: 15, name: "Passover", id: "passover" },
    { hy: fallHy, hm: HEB_KISLEV, hd: 25, name: "Hanukkah", id: "hanukkah" }
  ];
  const out = [];
  for (const s of specs) {
    const g = hebrew_to_gregorian(s.hy, s.hm, s.hd);
    if (g.year === year) out.push({ month: g.month, day: g.day, name: s.name, id: s.id });
  }
  return out;
}

/** Chinese New Year start dates (Gregorian), lookup for a practical range. */
const CHINESE_NEW_YEAR = {
  2024: [2, 10], 2025: [1, 29], 2026: [2, 17], 2027: [2, 6], 2028: [1, 26],
  2029: [2, 13], 2030: [2, 3], 2031: [1, 23], 2032: [2, 11], 2033: [1, 31],
  2034: [2, 19], 2035: [2, 8], 2036: [1, 28], 2037: [2, 15]
};

/** Diwali (Lakshmi Puja / main day) lookup ~2024–2035. */
const DIWALI = {
  2024: [10, 31], 2025: [10, 20], 2026: [11, 8], 2027: [10, 29], 2028: [10, 17],
  2029: [11, 5], 2030: [10, 26], 2031: [11, 14], 2032: [11, 2], 2033: [10, 22],
  2034: [11, 10], 2035: [10, 30]
};

/**
 * All major traditional holidays for a Gregorian year.
 * Returns array of { month, day, name, id }.
 * Islamic movable Eids omitted (no reliable offline Umm al-Qura table here).
 */
export function gregorian_holidays(year) {
  const easter = easter_western(year);
  const ash = add_gregorian_days(year, easter.month, easter.day, -46);
  const goodFri = add_gregorian_days(year, easter.month, easter.day, -2);
  const easterMon = add_gregorian_days(year, easter.month, easter.day, 1);
  const ascension = add_gregorian_days(year, easter.month, easter.day, 39);
  const pentecost = add_gregorian_days(year, easter.month, easter.day, 49);

  const list = [
    // Fixed / US / widely marked
    { month: 1, day: 1, name: "New Year's Day", id: "new_year" },
    { month: 1, day: 6, name: "Epiphany", id: "epiphany" },
    { month: 1, day: nth_weekday(year, 1, 1, 3), name: "MLK Day", id: "mlk" },
    { month: 2, day: 14, name: "Valentine's Day", id: "valentine" },
    { month: 2, day: nth_weekday(year, 2, 1, 3), name: "Presidents' Day", id: "presidents" },
    { month: 3, day: 8, name: "International Women's Day", id: "womens_day" },
    { month: 3, day: 17, name: "St. Patrick's Day", id: "st_patrick" },
    // Easter family (same year for Ash Wed onward in Western computation)
    ...(ash.year === year ? [{ month: ash.month, day: ash.day, name: "Ash Wednesday", id: "ash_wednesday" }] : []),
    ...(goodFri.year === year ? [{ month: goodFri.month, day: goodFri.day, name: "Good Friday", id: "good_friday" }] : []),
    { month: easter.month, day: easter.day, name: "Easter", id: "easter" },
    ...(easterMon.year === year ? [{ month: easterMon.month, day: easterMon.day, name: "Easter Monday", id: "easter_monday" }] : []),
    { month: 4, day: 22, name: "Earth Day", id: "earth_day" },
    ...(ascension.year === year ? [{ month: ascension.month, day: ascension.day, name: "Ascension", id: "ascension" }] : []),
    ...(pentecost.year === year ? [{ month: pentecost.month, day: pentecost.day, name: "Pentecost", id: "pentecost" }] : []),
    // UK / Commonwealth bank-style
    { month: 5, day: nth_weekday(year, 5, 1, 1), name: "Early May Bank Holiday", id: "may_day_uk" },
    { month: 5, day: monday_on_or_before(year, 5, 24), name: "Victoria Day", id: "victoria_day" },
    { month: 5, day: 5, name: "Cinco de Mayo", id: "cinco_de_mayo" },
    { month: 5, day: nth_weekday(year, 5, 0, 2), name: "Mother's Day", id: "mothers" },
    { month: 5, day: last_weekday(year, 5, 1), name: "Memorial / Spring Bank Holiday", id: "memorial" },
    { month: 6, day: 19, name: "Juneteenth", id: "juneteenth" },
    { month: 6, day: nth_weekday(year, 6, 0, 3), name: "Father's Day", id: "fathers" },
    { month: 7, day: 1, name: "Canada Day", id: "canada_day" },
    { month: 7, day: 4, name: "Independence Day", id: "independence" },
    { month: 8, day: last_weekday(year, 8, 1), name: "Summer Bank Holiday", id: "summer_bank" },
    { month: 9, day: nth_weekday(year, 9, 1, 1), name: "Labor Day", id: "labor" },
    { month: 9, day: 16, name: "Mexican Independence Day", id: "mexico_independence" },
    { month: 10, day: nth_weekday(year, 10, 1, 2), name: "Canadian Thanksgiving", id: "canada_thanksgiving" },
    { month: 10, day: 24, name: "UN Day", id: "un_day" },
    { month: 10, day: 31, name: "Halloween", id: "halloween" },
    { month: 11, day: 1, name: "Día de los Muertos", id: "muertos_1" },
    { month: 11, day: 2, name: "Día de los Muertos", id: "muertos_2" },
    { month: 11, day: 11, name: "Veterans / Remembrance Day", id: "veterans" },
    { month: 11, day: nth_weekday(year, 11, 4, 4), name: "Thanksgiving", id: "thanksgiving" },
    { month: 12, day: 24, name: "Christmas Eve", id: "xmas_eve" },
    { month: 12, day: 25, name: "Christmas", id: "christmas" },
    { month: 12, day: 26, name: "Boxing Day / Kwanzaa", id: "boxing_day" },
    { month: 12, day: 31, name: "New Year's Eve", id: "new_years_eve" }
  ];

  // Jewish (computed)
  list.push(...jewish_holidays(year));

  // Lookups
  if (CHINESE_NEW_YEAR[year]) {
    const [m, d] = CHINESE_NEW_YEAR[year];
    list.push({ month: m, day: d, name: "Chinese New Year", id: "chinese_new_year" });
  }
  if (DIWALI[year]) {
    const [m, d] = DIWALI[year];
    list.push({ month: m, day: d, name: "Diwali", id: "diwali" });
  }

  // Stable chronological order
  list.sort((a, b) => a.month - b.month || a.day - b.day || a.name.localeCompare(b.name));
  return list;
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
