/**
 * MEC unit tests — PDF Section 7 acceptance checks + leap/slot extras.
 * Run: node mec.test.js
 */
import {
  DAY_NAMES, REN, is_leap, slots, mec_year,
  gregorian_to_mec, mec_to_gregorian, format_mec,
  easter_western, nth_weekday, last_weekday, monday_on_or_before,
  gregorian_holidays, holidays_on, format_mec_html, format_mec_parts, format_gregorian,
  jewish_holidays, hebrew_to_gregorian, MARKET_NOTES, market_note, HOLIDAY_ORIGINS, holiday_origin,
  islamic_holidays, ISLAMIC_RANGE, is_rest_day, REST_DAY
} from './mec.js';
import {
  FALLBACK_PLACE, weather_label, open_meteo_url, parse_open_meteo,
  format_place, place_from_bigdatacloud, place_from_nominatim,
  wttr_url, parse_wttr, place_from_wttr
} from './weather.js';
import {
  is_desert, season_for, format_local_iso_time, format_clock, sun_times, sun_caption_times, solar_position, time_of_day, classify_weather, pick_scene, parse_scene_override, palette
} from './scene.js';
import {
  cleanName, cleanInitials, cleanLabel, cleanDate, deriveInitials, profileView, DEFAULTS,
  NAME_KEY, NAME_ASKED_KEY, INITIALS_KEY, WORK_KEY, VENTURE_KEY, BDAY_KEY, PROFILE_KEYS
} from './profile.js';
import { existsSync, readFileSync, statSync } from 'node:fs';

let passed = 0;
let failed = 0;
const results = [];

function assert(name, cond, detail = '') {
  if (cond) {
    passed++;
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    results.push({ name, ok: false, detail });
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function checkGreg(name, y, m, d, expect) {
  const rec = gregorian_to_mec(y, m, d);
  const parts = [];
  if (expect.kind) parts.push(['kind', rec.kind, expect.kind]);
  if (expect.mec_year != null) parts.push(['mec_year', rec.mec_year, expect.mec_year]);
  if (expect.mec_month != null) parts.push(['mec_month', rec.mec_month, expect.mec_month]);
  if (expect.mec_day != null) parts.push(['mec_day', rec.mec_day, expect.mec_day]);
  if (expect.day_name != null) parts.push(['day_name', rec.day_name, expect.day_name]);
  if (expect.cycle != null) parts.push(['cycle', rec.cycle, expect.cycle]);
  if (expect.holiday_name != null) parts.push(['holiday_name', rec.holiday_name, expect.holiday_name]);
  if ('cycle' in expect && expect.cycle === null) parts.push(['cycle', rec.cycle, null]);
  if ('day_name' in expect && expect.day_name === null) parts.push(['day_name', rec.day_name, null]);

  const bad = parts.filter(([, a, e]) => a !== e);
  if (bad.length === 0) {
    assert(name, true);
  } else {
    assert(name, false, bad.map(([k, a, e]) => `${k}=${a} (want ${e})`).join('; ') +
      ` | got: ${format_mec(rec)}`);
  }
}

console.log('\n=== Section 7 acceptance checks (2026) ===\n');

checkGreg('Jan 1, 2026 → January 1, Primaday, Cycle 1, Year 250',
  2026, 1, 1, {
    kind: 'regular', mec_year: 250, mec_month: 1, mec_day: 1,
    day_name: 'Primaday', cycle: 1
  });

checkGreg('Jan 31, 2026 → Local Area Network Day, Year 250',
  2026, 1, 31, {
    kind: 'renaissance', mec_year: 250, holiday_name: 'Local Area Network Day',
    cycle: null, day_name: null
  });

checkGreg('Feb 1, 2026 → February 1, Primaday, Cycle 1',
  2026, 2, 1, {
    kind: 'regular', mec_month: 2, mec_day: 1, day_name: 'Primaday', cycle: 1
  });

checkGreg('Mar 1, 2026 → February 29, Noviday, Cycle 3',
  2026, 3, 1, {
    kind: 'regular', mec_month: 2, mec_day: 29, day_name: 'Noviday', cycle: 3
  });

checkGreg('Apr 1, 2026 → March 30, Centiday — day before Global Society Day',
  2026, 4, 1, {
    kind: 'regular', mec_month: 3, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Apr 2, 2026 → Global Society Day, Year 250',
  2026, 4, 2, {
    kind: 'renaissance', holiday_name: 'Global Society Day', mec_year: 250
  });

checkGreg('Jun 1, 2026 → May 30, Centiday',
  2026, 6, 1, {
    kind: 'regular', mec_month: 5, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Jun 2, 2026 → Nature Harmony Day, Year 250',
  2026, 6, 2, {
    kind: 'renaissance', holiday_name: 'Nature Harmony Day', mec_year: 250
  });

checkGreg('Aug 1, 2026 → July 30, Centiday',
  2026, 8, 1, {
    kind: 'regular', mec_month: 7, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Aug 2, 2026 → Tesla Day, Year 250',
  2026, 8, 2, {
    kind: 'renaissance', holiday_name: 'Tesla Day', mec_year: 250
  });

checkGreg('Sep 1, 2026 → August 30, Centiday',
  2026, 9, 1, {
    kind: 'regular', mec_month: 8, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Sep 2, 2026 → Theology Day, Year 250',
  2026, 9, 2, {
    kind: 'renaissance', holiday_name: 'Theology Day', mec_year: 250
  });

checkGreg('Sep 3, 2026 → September 1, Primaday, Cycle 1',
  2026, 9, 3, {
    kind: 'regular', mec_month: 9, mec_day: 1, day_name: 'Primaday', cycle: 1
  });

checkGreg('Dec 31, 2026 → December 30, Centiday, Cycle 3',
  2026, 12, 31, {
    kind: 'regular', mec_month: 12, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Jan 1, 2027 → January 1, Primaday, Year 251 — reset',
  2027, 1, 1, {
    kind: 'regular', mec_year: 251, mec_month: 1, mec_day: 1,
    day_name: 'Primaday', cycle: 1
  });

console.log('\n=== Leap year 2028 extras ===\n');

const s2028 = slots(2028);
const hermes = s2028.find(s => s.name === 'Hermes Trismegistus Day');
assert('2028 inserts Hermes Trismegistus Day after October 30',
  hermes && hermes.month === 10 && hermes.day === 31 && hermes.kind === 'renaissance');

const s2026 = slots(2026);
assert('2026 does NOT include Hermes Trismegistus Day',
  !s2026.some(s => s.name === 'Hermes Trismegistus Day'));

// Section 5 slots(): Mar 1 2028 DOY=61 → Feb 30 Centiday (PDF §7 prose wrongly said Feb 29)
checkGreg('Mar 1, 2028 → February 30 MEC (Section 5 algorithm)',
  2028, 3, 1, {
    kind: 'regular', mec_month: 2, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

checkGreg('Dec 31, 2028 → December 30 MEC',
  2028, 12, 31, {
    kind: 'regular', mec_month: 12, mec_day: 30, day_name: 'Centiday', cycle: 3
  });

// Hermes placement: after Oct 30 in leap year
{
  const list = slots(2028);
  const oct30idx = list.findIndex(s => s.month === 10 && s.day === 30 && s.kind === 'regular');
  const hermesIdx = list.findIndex(s => s.name === 'Hermes Trismegistus Day');
  assert('Hermes is immediately after October 30 in 2028',
    hermesIdx === oct30idx + 1,
    `oct30=${oct30idx} hermes=${hermesIdx}`);
}

console.log('\n=== Slot counts ===\n');

assert('2026 slots length === 365', slots(2026).length === 365, `got ${slots(2026).length}`);
assert('2027 slots length === 365', slots(2027).length === 365, `got ${slots(2027).length}`);
assert('2028 slots length === 366', slots(2028).length === 366, `got ${slots(2028).length}`);
assert('2024 slots length === 366', slots(2024).length === 366, `got ${slots(2024).length}`);
assert('1900 slots length === 365 (not leap)', slots(1900).length === 365);
assert('2000 slots length === 366 (leap)', slots(2000).length === 366);

console.log('\n=== Round-trip & helpers ===\n');

assert('mec_year(2026) === 250', mec_year(2026) === 250);
assert('mec_year(2027) === 251', mec_year(2027) === 251);
assert('mec_year(1776) === 0 (formula Y-1776; epoch narrative Year 1)', mec_year(1776) === 0);
assert('is_leap(2028)', is_leap(2028));
assert('!is_leap(2026)', !is_leap(2026));
assert('!is_leap(1900)', !is_leap(1900));
assert('is_leap(2000)', is_leap(2000));

assert('DAY_NAMES length 10', DAY_NAMES.length === 10);
assert('DAY_NAMES[0] Primaday', DAY_NAMES[0] === 'Primaday');
assert('DAY_NAMES[9] Centiday', DAY_NAMES[9] === 'Centiday');
assert('REST_DAY is Centiday (no new day name)', REST_DAY === 'Centiday' && DAY_NAMES.includes(REST_DAY));
assert('Dec 30 2026 Centiday is rest day', is_rest_day(gregorian_to_mec(2026, 12, 31)));
assert('Primaday is not rest day', !is_rest_day(gregorian_to_mec(2026, 7, 4)));
assert('Renaissance Day is not flagged as rest day', !is_rest_day(gregorian_to_mec(2026, 2, 1)));
assert('REN has 6 holidays', Object.keys(REN).length === 6);

// Round trip: pick several dates
for (const [y, m, d] of [[2026, 1, 1], [2026, 10, 5], [2026, 4, 2], [2028, 10, 31], [2026, 12, 31]]) {
  // For renaissance, mec day is 31
  const rec = gregorian_to_mec(y, m, d);
  const back = mec_to_gregorian(y, rec.mec_month, rec.mec_day);
  assert(`round-trip ${y}-${m}-${d}`,
    back.year === y && back.month === m && back.day === d,
    `got ${back.year}-${back.month}-${back.day}`);
}

// Apr 1 is day before Global Society — confirm Apr 2 is holiday
{
  const gsd = gregorian_to_mec(2026, 4, 2);
  assert('Apr 2 is Global Society Day', gsd.holiday_name === 'Global Society Day');
}

console.log('\n=== Gregorian holidays (computed) ===\n');

{
  const e = easter_western(2026);
  assert('Easter 2026 = April 5', e.month === 4 && e.day === 5, JSON.stringify(e));
}
{
  const e = easter_western(2025);
  assert('Easter 2025 = April 20', e.month === 4 && e.day === 20, JSON.stringify(e));
}
{
  const e = easter_western(2024);
  assert('Easter 2024 = March 31', e.month === 3 && e.day === 31, JSON.stringify(e));
}

assert('Thanksgiving 2026 = Nov 26',
  nth_weekday(2026, 11, 4, 4) === 26, String(nth_weekday(2026, 11, 4, 4)));
assert('MLK 2026 = Jan 19',
  nth_weekday(2026, 1, 1, 3) === 19, String(nth_weekday(2026, 1, 1, 3)));
assert('Memorial Day 2026 = May 25',
  last_weekday(2026, 5, 1) === 25, String(last_weekday(2026, 5, 1)));
assert('Labor Day 2026 = Sep 7',
  nth_weekday(2026, 9, 1, 1) === 7, String(nth_weekday(2026, 9, 1, 1)));
assert('Mother\'s Day 2026 = May 10',
  nth_weekday(2026, 5, 0, 2) === 10, String(nth_weekday(2026, 5, 0, 2)));
assert('Father\'s Day 2026 = Jun 21',
  nth_weekday(2026, 6, 0, 3) === 21, String(nth_weekday(2026, 6, 0, 3)));
assert('Presidents\' Day 2026 = Feb 16',
  nth_weekday(2026, 2, 1, 3) === 16, String(nth_weekday(2026, 2, 1, 3)));

{
  const h = holidays_on(2026, 10, 31);
  assert('Halloween 2026 Oct 31', h.some(x => x.id === 'halloween'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 11, 26);
  assert('Thanksgiving 2026 on Nov 26', h.some(x => x.id === 'thanksgiving'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 4, 5);
  assert('Easter 2026 on Apr 5', h.some(x => x.id === 'easter'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 12, 26);
  assert('Boxing Day 2026 Dec 26', h.some(x => x.id === 'boxing_day'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 5, 5);
  assert('Cinco de Mayo 2026 May 5', h.some(x => x.id === 'cinco_de_mayo'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 1, 6);
  assert('Epiphany 2026 Jan 6', h.some(x => x.id === 'epiphany'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 3, 8);
  assert("Women's Day 2026 Mar 8", h.some(x => x.id === 'womens_day'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 7, 1);
  assert('Canada Day 2026 Jul 1', h.some(x => x.id === 'canada_day'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 9, 16);
  assert('Mexican Independence 2026 Sep 16', h.some(x => x.id === 'mexico_independence'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 11, 1);
  assert('Día de los Muertos 2026 Nov 1', h.some(x => x.id === 'muertos_1'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 11, 11);
  assert('Veterans/Remembrance 2026 Nov 11', h.some(x => x.id === 'veterans'), JSON.stringify(h));
}
{
  assert('Early May Bank Holiday 2026 = May 4',
    nth_weekday(2026, 5, 1, 1) === 4, String(nth_weekday(2026, 5, 1, 1)));
  assert('Victoria Day 2026 = May 18',
    monday_on_or_before(2026, 5, 24) === 18, String(monday_on_or_before(2026, 5, 24)));
  assert('Summer Bank Holiday 2026 = Aug 31',
    last_weekday(2026, 8, 1) === 31, String(last_weekday(2026, 8, 1)));
  assert('Canadian Thanksgiving 2026 = Oct 12',
    nth_weekday(2026, 10, 1, 2) === 12, String(nth_weekday(2026, 10, 1, 2)));
}
{
  const h = holidays_on(2026, 4, 3);
  assert('Good Friday 2026 Apr 3', h.some(x => x.id === 'good_friday'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 4, 6);
  assert('Easter Monday 2026 Apr 6', h.some(x => x.id === 'easter_monday'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 2, 18);
  assert('Ash Wednesday 2026 Feb 18', h.some(x => x.id === 'ash_wednesday'), JSON.stringify(h));
}
{
  // Jewish 2026
  const rh = hebrew_to_gregorian(5787, 7, 1);
  assert('Rosh Hashanah 2026 = Sep 12', rh.month === 9 && rh.day === 12, JSON.stringify(rh));
  const h = holidays_on(2026, 9, 12);
  assert('Rosh Hashanah marked 2026', h.some(x => x.id === 'rosh_hashanah'), JSON.stringify(h));
  const yk = holidays_on(2026, 9, 21);
  assert('Yom Kippur 2026 Sep 21', yk.some(x => x.id === 'yom_kippur'), JSON.stringify(yk));
  const pesach = holidays_on(2026, 4, 2);
  assert('Passover 2026 Apr 2', pesach.some(x => x.id === 'passover'), JSON.stringify(pesach));
  const han = holidays_on(2026, 12, 5);
  assert('Hanukkah 2026 Dec 5', han.some(x => x.id === 'hanukkah'), JSON.stringify(han));
  assert('jewish_holidays(2026) has 14', jewish_holidays(2026).length === 14,
    String(jewish_holidays(2026).length));
}
function hasOn(y, m, d, id) {
  return holidays_on(y, m, d).some(x => x.id === id);
}
{
  // Expanded Jewish set (Israeli calendar; cross-checked against Hebcal i=on)
  const cases2026 = [
    ['purim', 3, 3], ['erev_passover', 4, 1], ['passover', 4, 2], ['passover_last', 4, 8],
    ['shavuot', 5, 22], ['tisha_bav', 7, 23], ['erev_rosh_hashanah', 9, 11],
    ['rosh_hashanah', 9, 12], ['rosh_hashanah_2', 9, 13], ['erev_yom_kippur', 9, 20],
    ['yom_kippur', 9, 21], ['sukkot', 9, 26], ['simchat_torah', 10, 3], ['hanukkah', 12, 5]
  ];
  for (const [id, m, d] of cases2026) {
    assert(`2026 ${id} = ${m}/${d}`, hasOn(2026, m, d, id), JSON.stringify(holidays_on(2026, m, d)));
  }
  // 2027 is a Hebrew leap year (5787): Purim in Adar II
  const cases2027 = [
    ['purim', 3, 23], ['erev_passover', 4, 21], ['passover', 4, 22], ['passover_last', 4, 28],
    ['shavuot', 6, 11], ['tisha_bav', 8, 12], ['erev_rosh_hashanah', 10, 1],
    ['rosh_hashanah', 10, 2], ['rosh_hashanah_2', 10, 3], ['erev_yom_kippur', 10, 10],
    ['yom_kippur', 10, 11], ['sukkot', 10, 16], ['simchat_torah', 10, 23], ['hanukkah', 12, 25]
  ];
  for (const [id, m, d] of cases2027) {
    assert(`2027 ${id} = ${m}/${d}`, hasOn(2027, m, d, id), JSON.stringify(holidays_on(2027, m, d)));
  }
  // Tisha B'Av postponed from Shabbat: 9 Av 5785 = Sat Aug 2, 2025 -> observed Sun Aug 3
  assert('Tisha B\'Av 2025 postponed to Sun Aug 3', hasOn(2025, 8, 3, 'tisha_bav'),
    JSON.stringify(jewish_holidays(2025).find(h => h.id === 'tisha_bav')));
  assert('Jewish market notes say US banks open',
    ['passover', 'shavuot', 'rosh_hashanah_2', 'sukkot', 'simchat_torah'].every(
      id => /Banks open in the US; closed in Israel/.test(MARKET_NOTES[id])));
}

console.log('\n=== Islamic Eids (Umm al-Qura table) ===\n');
{
  assert('ISLAMIC_RANGE 2024-2037', ISLAMIC_RANGE.from === 2024 && ISLAMIC_RANGE.to === 2037);
  // Saudi Supreme Court announcements
  assert('Eid al-Fitr 2024 Apr 10', hasOn(2024, 4, 10, 'eid_al_fitr'));
  assert('Eid al-Adha 2024 Jun 16', hasOn(2024, 6, 16, 'eid_al_adha'));
  assert('Eid al-Fitr 2025 Mar 30', hasOn(2025, 3, 30, 'eid_al_fitr'));
  assert('Eid al-Adha 2025 Jun 6', hasOn(2025, 6, 6, 'eid_al_adha'));
  assert('Eid al-Fitr 2026 Mar 20', hasOn(2026, 3, 20, 'eid_al_fitr'));
  assert('Eid al-Adha 2026 May 27', hasOn(2026, 5, 27, 'eid_al_adha'));
  // Umm al-Qura table
  assert('Eid al-Fitr 2027 Mar 9', hasOn(2027, 3, 9, 'eid_al_fitr'));
  assert('Eid al-Adha 2027 May 16', hasOn(2027, 5, 16, 'eid_al_adha'));
  const f33 = islamic_holidays(2033).filter(h => h.id === 'eid_al_fitr');
  assert('2033 has two Eid al-Fitr (Jan 2, Dec 23)',
    f33.length === 2 && f33[0].month === 1 && f33[0].day === 2 && f33[1].month === 12 && f33[1].day === 23,
    JSON.stringify(f33));
  assert('Eid al-Adha 2037 Jan 26', hasOn(2037, 1, 26, 'eid_al_adha'));
  for (let y = ISLAMIC_RANGE.from; y <= ISLAMIC_RANGE.to; y++) {
    const ids = islamic_holidays(y).map(h => h.id);
    if (!ids.includes('eid_al_fitr') || !ids.includes('eid_al_adha')) {
      assert(`${y} has both Eids`, false, ids.join(','));
    }
  }
  assert('every year in range has both Eids', true);
  assert('2023 has no invented Eid', islamic_holidays(2023).length === 0);
  assert('2038 has no invented Eid', islamic_holidays(2038).length === 0);
  assert('Eid notes: open US/UK, closed Saudi/UAE',
    /Banks open in the US and UK; closed in Saudi Arabia, UAE/.test(MARKET_NOTES.eid_al_fitr) &&
    MARKET_NOTES.eid_al_adha === MARKET_NOTES.eid_al_fitr, MARKET_NOTES.eid_al_fitr);
  const eid = holidays_on(2026, 3, 20).find(h => h.id === 'eid_al_fitr');
  assert('holidays_on attaches Eid market note', eid && eid.market === MARKET_NOTES.eid_al_fitr);
}
{
  const h = holidays_on(2026, 2, 17);
  assert('Chinese New Year 2026 Feb 17', h.some(x => x.id === 'chinese_new_year'), JSON.stringify(h));
}
{
  const h = holidays_on(2026, 11, 8);
  assert('Diwali 2026 Nov 8', h.some(x => x.id === 'diwali'), JSON.stringify(h));
}
{
  const all = gregorian_holidays(2026);
  assert('2026 has many major holidays (>= 40)', all.length >= 40, String(all.length));
  const ids = new Set(all.map(h => h.id));
  assert('2026 includes boxing_day and cinco_de_mayo',
    ids.has('boxing_day') && ids.has('cinco_de_mayo'));
  // Halloween maps onto an MEC October slot
  const rec = gregorian_to_mec(2026, 10, 31);
  assert('Halloween 2026 falls in MEC October', rec.mec_month === 10,
    `mec_month=${rec.mec_month} day=${rec.mec_day}`);
}
{
  const all27 = gregorian_holidays(2027);
  assert('2027 holidays recomputed (not hard-coded 2026)', all27.length >= 40, String(all27.length));
  assert('Thanksgiving 2027 = Nov 25',
    nth_weekday(2027, 11, 4, 4) === 25);
  assert('Easter 2027 = Mar 28', (() => {
    const e = easter_western(2027);
    return e.month === 3 && e.day === 28;
  })(), JSON.stringify(easter_western(2027)));
  // Outside lookup range — CNY/Diwali simply absent, not wrong
  const far = gregorian_holidays(2040);
  assert('2040 has no invented Chinese New Year',
    !far.some(h => h.id === 'chinese_new_year'));
  assert('2040 has no invented Diwali',
    !far.some(h => h.id === 'diwali'));
}


console.log('\n=== Market notes (holiday metadata) ===\n');

{
  assert('MARKET_NOTES covers Halloween', !!MARKET_NOTES.halloween);
  assert('MARKET_NOTES covers Christmas', !!MARKET_NOTES.christmas);
  assert('MARKET_NOTES covers UN Day', !!MARKET_NOTES.un_day);
  assert('UN Day note is Banks open',
    MARKET_NOTES.un_day === 'Banks open', MARKET_NOTES.un_day);
  assert('Halloween note is Banks open',
    MARKET_NOTES.halloween === 'Banks open', MARKET_NOTES.halloween);
  assert('Christmas note closed US and UK',
    /Banks closed in the US and UK/.test(MARKET_NOTES.christmas), MARKET_NOTES.christmas);
  assert('Boxing Day notes UK and Canada closed',
    /Banks closed in the UK and Canada/.test(MARKET_NOTES.boxing_day),
    MARKET_NOTES.boxing_day);
  assert('Christmas Eve notes early close',
    /early close in the US/.test(MARKET_NOTES.xmas_eve), MARKET_NOTES.xmas_eve);
  assert('Chinese New Year notes China/HK closed',
    /China|Hong Kong/i.test(MARKET_NOTES.chinese_new_year), MARKET_NOTES.chinese_new_year);
  assert('Diwali notes India',
    /India/i.test(MARKET_NOTES.diwali), MARKET_NOTES.diwali);
  assert('no typical-pattern phrasing in notes',
    !Object.values(MARKET_NOTES).some(n => /typical|usually open as normal|trading advice/i.test(n)));
  assert('market_note(halloween) matches map',
    market_note('halloween') === MARKET_NOTES.halloween);
  assert('market_note(unknown) is null', market_note('not_a_holiday') === null);

  const hall = holidays_on(2026, 10, 31).find(h => h.id === 'halloween');
  assert('holidays_on attaches market for Halloween',
    hall && hall.market === MARKET_NOTES.halloween,
    hall ? JSON.stringify(hall.market) : 'missing');
  const xmas = holidays_on(2026, 12, 25).find(h => h.id === 'christmas');
  assert('holidays_on attaches market for Christmas',
    xmas && xmas.market === MARKET_NOTES.christmas);

  const all = gregorian_holidays(2026);
  const missing = all.filter(h => !h.market);
  assert('every 2026 holiday has a market note',
    missing.length === 0,
    missing.map(h => h.id).join(', '));
  const missing27 = gregorian_holidays(2027).concat(gregorian_holidays(2033)).filter(h => !h.market);
  assert('every 2027/2033 holiday has a market note', missing27.length === 0,
    missing27.map(h => h.id).join(', '));
  const ids = Object.keys(MARKET_NOTES);
  assert('MARKET_NOTES has 40+ entries', ids.length >= 40, String(ids.length));
}

console.log('\n=== format_mec wrap parts ===\n');
{
  const rec = gregorian_to_mec(2026, 10, 3);
  const parts = format_mec_parts(rec);
  assert('format_mec_parts line1 has middot weekday',
    parts.line1.includes('·') && parts.line1.includes(rec.day_name), parts.line1);
  assert('format_mec_parts line2 has Cycle and Year',
    /Cycle \d+ · Year \d+/.test(parts.line2), parts.line2);
  const html = format_mec_html(rec);
  assert('format_mec_html has mec-line1 and mec-line2',
    html.includes('mec-line1') && html.includes('mec-line2'), html);
  assert('format_mec plain uses middots',
    format_mec(rec).includes('·') && !format_mec(rec).includes(','), format_mec(rec));
}

console.log('\n=== format_gregorian weekday ===\n');
{
  assert('format_gregorian includes weekday',
    format_gregorian(2026, 10, 5) === 'Monday, October 5, 2026',
    format_gregorian(2026, 10, 5));
}


console.log('\n=== holiday origins ===\n');
{
  assert('Yom Kippur origin Jewish', holiday_origin('yom_kippur') === 'Jewish');
  assert('Christmas origin Christian', holiday_origin('christmas') === 'Christian');
  assert('Eid origin Islamic', holiday_origin('eid_al_fitr') === 'Islamic');
  assert('MLK origin US civil', holiday_origin('mlk') === 'US civil');
  const yk = holidays_on(2026, 9, 21).find(h => h.id === 'yom_kippur');
  assert('holidays_on attaches origin', yk && yk.origin === 'Jewish', yk && yk.origin);
  const missing = Object.keys(HOLIDAY_ORIGINS).filter(id => !MARKET_NOTES[id]);
  // origins may be subset; check every 2026 holiday has origin
  const noOrigin = gregorian_holidays(2026).filter(h => !h.origin);
  assert('every 2026 holiday has origin', noOrigin.length === 0, noOrigin.map(h => h.id).join(','));
}

console.log('\n=== local sky (weather helpers) ===\n');
{
  assert('fallback is St. George, UT', FALLBACK_PLACE.name === 'St. George, UT');
  assert('fallback coords near St. George', Math.abs(FALLBACK_PLACE.lat - 37.1) < 0.1 && Math.abs(FALLBACK_PLACE.lon + 113.57) < 0.1);
  const url = open_meteo_url(37.0965, -113.5684);
  assert('Open-Meteo URL uses Fahrenheit', url.includes('temperature_unit=fahrenheit'), url);
  assert('Open-Meteo URL has lat/lon', url.includes('latitude=37.0965') && url.includes('longitude=-113.5684'), url);
  assert('Open-Meteo host', url.startsWith('https://api.open-meteo.com/v1/forecast?'));
  assert('WMO 0 day = Clear sun', eq(weather_label(0, true), { label: 'Clear', icon: '☀️' }));
  assert('WMO 0 night = moon', weather_label(0, false).icon === '🌙');
  assert('WMO 95 thunderstorm', weather_label(95).label === 'Thunderstorm');
  assert('WMO unknown graceful', weather_label(1234).label === 'Weather');
  const r = parse_open_meteo({
    current: { temperature_2m: 78.4, apparent_temperature: 76.1, weather_code: 2, is_day: 1 },
    daily: { temperature_2m_max: [84.6], temperature_2m_min: [58.2] }
  });
  assert('parse temp rounds', r.tempF === 78 && r.hiF === 85 && r.loF === 58, JSON.stringify(r));
  assert('parse label', r.label === 'Partly cloudy' && r.icon === '⛅');
  let threw = false; try { parse_open_meteo({}); } catch { threw = true; }
  assert('parse rejects empty payload', threw);
  assert('US place abbreviates state', format_place({ city: 'St. George', region: 'Utah', countryCode: 'US' }) === 'St. George, UT');
  assert('UK place uses region', format_place({ city: 'York', region: 'England', country: 'United Kingdom', countryCode: 'GB' }) === 'York, England');
  assert('BigDataCloud mapping', place_from_bigdatacloud({ city: 'Hurricane', principalSubdivision: 'Utah', countryName: 'United States of America', countryCode: 'US' }) === 'Hurricane, UT');
  assert('BigDataCloud locality fallback', place_from_bigdatacloud({ city: '', locality: 'Ivins', principalSubdivision: 'Utah', countryCode: 'US' }) === 'Ivins, UT');
  const wj = {
    current_condition: [{ temp_F: '82', FeelsLikeF: '79', weatherCode: '113', weatherDesc: [{ value: 'Sunny' }] }],
    weather: [{ maxtempF: '86', mintempF: '57' }],
    nearest_area: [{ areaName: [{ value: 'Saint George' }], region: [{ value: 'Utah' }], country: [{ value: 'United States of America' }] }]
  };
  const wr = parse_wttr(wj, 12);
  assert('wttr fallback parse', wr.tempF === 82 && wr.hiF === 86 && wr.loF === 57 && wr.label === 'Sunny' && wr.icon === '☀️', JSON.stringify(wr));
  assert('wttr night sunny → Clear moon', parse_wttr(wj, 23).label === 'Clear' && parse_wttr(wj, 23).icon === '🌙');
  assert('wttr place → St. George, UT', place_from_wttr(wj) === 'St. George, UT', place_from_wttr(wj));
  assert('wttr URL', wttr_url(37.0965, -113.5684) === 'https://wttr.in/37.0965,-113.5684?format=j1');
  assert('Nominatim mapping', place_from_nominatim({ address: { town: 'Springdale', state: 'Utah', country_code: 'us' } }) === 'Springdale, UT');
}

console.log('\n=== ambient weather scene ===\n');
{
  assert('St. George is desert terrain', is_desert(37.0965, -113.5684));
  assert('Denver is not desert terrain', !is_desert(39.74, -104.99));
  assert('London is not desert terrain', !is_desert(51.5, -0.12));
  assert('Oct = fall (N)', season_for(new Date(2026, 9, 5), 37) === 'fall');
  assert('Oct = spring (S)', season_for(new Date(2026, 9, 5), -33) === 'spring');
  assert('Jan = winter, Jul = summer, Apr = spring', season_for(new Date(2026, 0, 10)) === 'winter' && season_for(new Date(2026, 6, 10)) === 'summer' && season_for(new Date(2026, 3, 10)) === 'spring');
  // St. George solar noon ~13:30 MDT (19:30 UTC) on Oct 5 → elevation ≈ 48°
  const noon = solar_position(new Date(Date.UTC(2026, 9, 5, 19, 30)), 37.0965, -113.5684);
  assert('solar noon elevation ≈ 48°', Math.abs(noon.elevation - 48) < 2, noon.elevation.toFixed(1));
  const midnight = solar_position(new Date(Date.UTC(2026, 9, 6, 7, 30)), 37.0965, -113.5684);
  assert('midnight sun below horizon', midnight.elevation < -30, midnight.elevation.toFixed(1));
  const sunset = solar_position(new Date(Date.UTC(2026, 9, 6, 1, 12)), 37.0965, -113.5684); // 7:12 PM MDT
  assert('sunset elevation ≈ 0° → dusk', Math.abs(sunset.elevation) < 2.5 && time_of_day(sunset.elevation) === 'dusk', sunset.elevation.toFixed(1));
  assert('time_of_day buckets', time_of_day(30) === 'day' && time_of_day(3) === 'dusk' && time_of_day(-20) === 'night');
  assert('WMO 0 → clear', classify_weather({ code: 0 }).sky === 'clear');
  assert('WMO 63 → rain', classify_weather({ code: 63 }).precip === 'rain');
  assert('WMO 75 → heavy snow', classify_weather({ code: 75 }).precip === 'snow' && classify_weather({ code: 75 }).heavy);
  assert('WMO 95 → storm', classify_weather({ code: 95 }).precip === 'storm');
  assert('WMO 45 → fog', classify_weather({ code: 45, cloud: 100 }).sky === 'fog');
  assert('wttr 113 → clear', classify_weather({ code: 113, cloud: 3 }).sky === 'clear');
  assert('wttr 296 → drizzle', classify_weather({ code: 296 }).precip === 'drizzle');
  assert('wttr 338 → heavy snow', classify_weather({ code: 338 }).precip === 'snow');
  assert('wttr 389 → storm', classify_weather({ code: 389 }).precip === 'storm');
  assert('cloud cover refines dry sky', classify_weather({ code: 1, cloud: 85 }).sky === 'overcast' && classify_weather({ code: 3, cloud: 10 }).sky === 'clear');
  const sg = { tempF: 82, code: 113, cloud: 3, windMph: 2, isDay: true };
  const day = pick_scene({ weather: sg, lat: 37.0965, lon: -113.5684, date: new Date(Date.UTC(2026, 9, 5, 19, 0)) });
  assert('St. George Oct afternoon → summery desert fall, clear, day', day.terrain === 'desert' && day.season === 'fall' && day.sky === 'clear' && day.time === 'day' && day.warm, day.key);
  assert('St. George 82°F clear → heat shimmer + dust', day.heat && day.particles === 'dust', day.key);
  assert('label reads summery desert fall', /^Summery desert fall · clear/.test(day.label), day.label);
  const night = pick_scene({ weather: { ...sg, tempF: 64, isDay: false }, lat: 37.0965, lon: -113.5684, date: new Date(Date.UTC(2026, 9, 6, 7, 0)) });
  assert('St. George midnight → desert night, no shimmer', night.time === 'night' && !night.heat && night.terrain === 'desert', night.key);
  const rain = pick_scene({ weather: { tempF: 61, code: 63, cloud: 100, windMph: 9 }, lat: 37.0965, lon: -113.5684, date: new Date(Date.UTC(2026, 9, 5, 19, 0)) });
  assert('rain reading → rain particles, overcast', rain.precip === 'rain' && rain.particles === 'rain' && rain.sky === 'overcast');
  const storm = pick_scene({ weather: { tempF: 70, code: 95 }, lat: 37.1, lon: -113.6, date: new Date(Date.UTC(2026, 7, 5, 22, 0)) });
  assert('storm reading → lightning', storm.lightning && storm.particles === 'rain');
  const nyc = pick_scene({ weather: { tempF: 58, code: 2, cloud: 50 }, lat: 40.71, lon: -74.0, date: new Date(Date.UTC(2026, 9, 5, 17, 0)) });
  assert('non-desert location → meadow fall, leaves', nyc.terrain === 'meadow' && nyc.particles === 'leaves', nyc.key);
  const sgNoWx = pick_scene({ weather: null, lat: 37.0965, lon: -113.5684, date: new Date(Date.UTC(2026, 9, 5, 19, 0)) });
  assert('St. George before first reading → desert fall, season-only', sgNoWx.terrain === 'desert' && !sgNoWx.located && sgNoWx.season === 'fall' && sgNoWx.precip === 'none', sgNoWx.key);
  const gen = (m) => pick_scene({ weather: null, date: new Date(2026, m, 12, 12) });
  assert('no location → generic meadow', gen(9).terrain === 'meadow' && !gen(9).located);
  assert('no location: spring blossoms', gen(3).season === 'spring' && gen(3).particles === 'petals');
  assert('no location: summer green bright', gen(6).season === 'summer' && gen(6).sky === 'clear');
  assert('no location: fall amber leaves', gen(9).season === 'fall' && gen(9).particles === 'leaves');
  assert('no location: winter soft snow', gen(0).season === 'winter' && gen(0).precip === 'snow');
  assert('override parse', JSON.stringify(parse_scene_override('desert-rain-night')) === JSON.stringify({ terrain: 'desert', precip: 'rain', time: 'night' }));
  const ov = pick_scene({ weather: sg, lat: 37.0965, lon: -113.5684, date: new Date(Date.UTC(2026, 9, 5, 19, 0)), override: parse_scene_override('snow') });
  assert('override snow applies', ov.precip === 'snow' && ov.particles === 'snow' && ov.sky === 'overcast');
  const P = palette(day);
  assert('palette yields hex colours', [P.top, P.sky, P.hor, P.far, P.mid, P.ground].every((c) => /^#[0-9a-f]{6}$/.test(c)), JSON.stringify(P));
  const keys = ['desert', 'meadow'].flatMap((t) => ['spring', 'summer', 'fall', 'winter'].flatMap((se) => ['clear', 'partly', 'overcast', 'fog'].flatMap((sk) => ['day', 'dusk', 'night'].map((ti) => palette({ terrain: t, season: se, sky: sk, precip: 'none', time: ti, warm: false, cold: false })))));
  assert('every palette combo valid', keys.every((p) => /^#[0-9a-f]{6}$/.test(p.far) && /^#[0-9a-f]{6}$/.test(p.top)));
}

{
  console.log('\n--- sunrise / sunset ---');
  assert('fmt morning', format_local_iso_time('2026-10-05T07:16') === '7:16 AM');
  assert('fmt evening', format_local_iso_time('2026-10-05T18:58') === '6:58 PM');
  assert('fmt midnight/noon', format_local_iso_time('2026-10-05T00:05') === '12:05 AM' && format_local_iso_time('2026-10-05T12:00') === '12:00 PM');
  assert('fmt bad → null', format_local_iso_time(null) === null && format_local_iso_time('nope') === null);
  assert('format_clock', format_clock(new Date(2026, 9, 5, 19, 4)) === '7:04 PM');
  const om = parse_open_meteo({ current: { temperature_2m: 70, weather_code: 0, is_day: 1 }, daily: { sunrise: ['2026-10-05T07:16'], sunset: ['2026-10-05T18:56'] } });
  assert('open-meteo parses sun', om.sunrise === '2026-10-05T07:16' && om.sunset === '2026-10-05T18:56');
  assert('open-meteo url asks sun', /sunrise%2Csunset/.test(open_meteo_url(37, -113)));
  const sc = sun_caption_times({ lat: 37, lon: -113, weather: om });
  assert('caption prefers open-meteo', sc.rise === '7:16 AM' && sc.set === '6:56 PM', JSON.stringify(sc));
  const st = sun_times(new Date(2026, 9, 5, 12), 37.0965, -113.5684);
  const utcMin = (d) => d.getUTCHours() * 60 + d.getUTCMinutes();
  const rise = utcMin(st.sunrise), set = (utcMin(st.sunset) + 1440) % 1440 + (utcMin(st.sunset) < 600 ? 1440 : 0);
  assert('St. George sunrise ≈ 7:33 AM MDT (Open-Meteo ref, 13:33Z)', Math.abs(rise - (13 * 60 + 33)) <= 10, st.sunrise.toISOString());
  assert('St. George sunset ≈ 7:11 PM MDT (Open-Meteo ref, 01:11Z)', Math.abs(set - (25 * 60 + 11)) <= 10, st.sunset.toISOString());
  assert('polar night → null', sun_times(new Date(2026, 11, 21, 12), 80, 0) === null);
  assert('no coords, no reading → null', sun_caption_times({}) === null);
}


{
  console.log('\n--- Captain\'s Log identity ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const html = src('./index.html');
  const man = src('./manifest.webmanifest');
  assert('document title is Captain\'s Log', /<title>Captain.s Log<\/title>/.test(html));
  assert('apple-mobile-web-app-title is Captain\'s Log', /apple-mobile-web-app-title" content="Captain.s Log"/.test(html));
  assert('header brand is Captain\'s Log (CL mark)', /brand-mark[^>]*>CL<\/div>/.test(html) && /<h1>Captain.s Log<\/h1>/.test(html));
  assert('About is About Captain\'s Log', /About Captain.s Log/.test(html));
  assert('does not claim Apple Notes sync', !/sync(?:s|ed)? to Apple Notes/i.test(html) || /not synced\s+to Apple Notes/.test(html));
  assert('MEC still present as a feature', /Modern Era Calendar/.test(html) && /month-grid/.test(html));
  assert('manifest name Captain\'s Log', /"name": "Captain.s Log"/.test(man));
  assert('localStorage Captain\'s Log keys stay mec-log:', /KEY_PREFIX = 'mec-log:'/.test(src('./captains-log.js')));
}

{
  console.log('\n--- v38: Aretoria is a link to its own site (no embedded copy) ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const html = src('./index.html'), sw = src('./sw.js');
  const AR = 'https://casswaters.github.io/aretoria/';
  assert('embedded Aretoria removed: no data, art module, CSS, portal script or art assets', ['./aretoria-data.js', './aretoria-art.js', './aretoria.css', './portal.js', './assets/aretoria'].every((f) => !existsSync(new URL(f, import.meta.url))));
  assert('aretoria.js is only a redirect stub for stale tabs (tiny, sends to the standalone site)', src('./aretoria.js').length < 700 && /export function openAretoria\(\) \{ location\.assign\(STANDALONE\); \}/.test(src('./aretoria.js')) && src('./aretoria.js').includes(AR));
  assert('Aretoria card is one clean link to the standalone site, same tab', new RegExp('<a class="portal-card portal-link" id="portal-card" href="' + AR.replace(/[./]/g, '\\$&') + '">').test(html) && !/target="_blank"[^>]*portal|portal-link[^>]*target=/.test(html) && /Enter Aretoria/.test(html));
  assert('no in-app portal: no Enter the Realms button, realm dots/legend, realm panel or portal.js', !/id="portal-enter"|Enter the Realms|portal-ring|realm-legend|portal-realms|portal\.js/.test(html));
  assert('old in-app routes redirect to the standalone site (hash + query) before anything renders', /<meta charset="utf-8" \/>\s*<script>/.test(html) && /aretoria\|realms\?\|portal\|axial\|hall\|creed/.test(html) && /location\.replace\('https:\/\/casswaters\.github\.io\/aretoria\/'\)/.test(html));
  const route = (h, q = '') => /^#!?\/?(aretoria|realms?|portal|axial|hall|creed)\b/i.test(h) || /[?&](aretoria|realms?|portal)(=|&|$)/i.test(q);
  assert('route matcher: #aretoria, #/realm/wisdom, #portal, ?aretoria, ?realm=courage redirect; #log, #2026-10-07 and ?fresh do not', route('#aretoria') && route('#/realm/wisdom') && route('#portal') && route('', '?aretoria') && route('', '?realm=courage') && !route('#log') && !route('#2026-10-07') && !route('', '?fresh=1') && !route('', '?scene=snow'));
  assert('/aretoria/ path in Captain\'s Log redirects too (meta refresh + script + link)', /http-equiv="refresh" content="0; url=https:\/\/casswaters\.github\.io\/aretoria\/"/.test(src('./aretoria/index.html')) && /location\.replace/.test(src('./aretoria/index.html')));
  assert('SW captains-log-v39 precaches no Aretoria files; precaches profile.js', /const CACHE = 'captains-log-v39';/.test(sw) && !/aretoria|portal\.js/.test(sw.split('const ASSETS')[1].split('];')[0]) && /'\.\/profile\.js'/.test(sw));
  assert('activate still clears every old cache (drops the old Aretoria art cache)', /keys\.map\(\(k\) => caches\.delete\(k\)\)/.test(sw));
  assert('scripts and styles on cl39', /app\.js\?v=cl39/.test(html) && /captains-log\.js\?v=cl39/.test(html) && /scene\.js\?v=cl39/.test(html) && /styles\.css\?v=cl39/.test(html));
  assert('About points to the standalone site', /Enter Aretoria<\/strong> opens the Aretoria site/.test(html));
}

{
  console.log('\n--- v38: Captain\'s Log profile (name, initials, enterprise names, birthday), local only ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const OWNER = String.fromCharCode(67, 97, 115, 115, 105, 100, 121);
  const served = ['./index.html', './app.js', './captains-log.js', './profile.js', './scene.js', './weather.js', './mec.js', './styles.css', './sw.js', './manifest.webmanifest', './aretoria.js', './aretoria/index.html', './mec.test.js'];
  const PERSONAL = new RegExp([OWNER, ['C', 'W'].join('') + ' Enterprises', '\\b' + ['An', 'am'].join('') + '\\b', ['Optimal', 'Amino'].join(''), '\\b' + ['A', 'G1'].join('') + '\\b', ['Psyl', 'lium'].join(''), ['Crea', 'tine 10g'].join(''), '6:20' + 'am'].join('|'), 'i'); // built at runtime so this file stays clean
  const hits = served.filter((f) => PERSONAL.test(src(f)));
  assert('no hard-coded personal name, initials or enterprise names in served files', hits.length === 0, hits.join(', '));
  const cl = src('./captains-log.js');
  assert('career heads come from the profile; saved field ids unchanged', /\{ id: 'cw_head', type: 'head', label: \(p\) => p\.enterprise \}/.test(cl) && /\{ id: 'anam_head', type: 'head', label: \(p\) => p\.venture \}/.test(cl) && /id: 'cw_checkin'/.test(cl) && /id: 'anam_pipeline'/.test(cl));
  const v0 = profileView({});
  assert('neutral fallbacks: Main work / Side venture, no name, no initials, no birthday', v0.enterprise === 'Main work' && v0.venture === 'Side venture' && v0.name === '' && v0.initials === '' && v0.birthday === '' && DEFAULTS.enterprise === 'Main work');
  assert('initials derive from the name and feed the enterprise default ("AKL Enterprises")', deriveInitials('Ada King-Lovelace') === 'AKL' && profileView({ name: 'Ada King-Lovelace' }).enterprise === 'AKL Enterprises' && profileView({ name: 'Ada', initials: 'al' }).enterprise === 'AL Enterprises');
  assert('typed values win over defaults', (() => { const v = profileView({ name: 'Ada', initials: 'AL', enterprise: 'Lovelace Labs', venture: 'Engines', birthday: '1815-12-10' }); return v.enterprise === 'Lovelace Labs' && v.venture === 'Engines' && v.birthday === '1815-12-10' && v.initials === 'AL'; })());
  assert('cleaning: names like Aretoria (unicode letters, spaces, - \', 24 max); initials letters ≤ 4 upper; labels ≤ 40 without markup', cleanName("  Seán O’Brien ") === "Seán O’Brien" && cleanName('<b>x</b>') === 'bxb' && Array.from(cleanName('y'.repeat(50))).length === 24 && cleanInitials('a.b-c d e') === 'ABCD' && cleanLabel('<script>Acme</script>{x}') === 'scriptAcme/scriptx' && cleanLabel('z'.repeat(80)).length === 40 && cleanDate('2026-13-99') === '2026-13-99' && cleanDate('nope') === '');
  assert('keys: name shared with Aretoria; rest under mec-log-*; birthday key unchanged', NAME_KEY === 'mec-aretoria:name' && NAME_ASKED_KEY === 'mec-aretoria:name-asked' && INITIALS_KEY === 'mec-log-initials' && WORK_KEY === 'mec-log-enterprise' && VENTURE_KEY === 'mec-log-venture' && BDAY_KEY === 'mec-log-birthday' && PROFILE_KEYS.length === 8);
  const pj = src('./profile.js');
  assert('stored in localStorage only; nothing sent anywhere', /localStorage\.setItem\(key, v\)/.test(pj) && !/fetch\(|XMLHttpRequest|sendBeacon/.test(pj + cl));
  assert('setting a name here tells Aretoria not to ask again', /if \(field === 'name' && v\) localStorage\.setItem\(NAME_ASKED_KEY, '1'\)/.test(pj));
  assert('profile renders as text (kicker via textContent; heads escaped or textContent)', /who\.textContent = P\.name \?/.test(cl) && /el\.textContent = labelOf\(f\)/.test(cl) && /esc\(labelOf\(f\)\)/.test(cl));
  const html = src('./index.html');
  assert('Profile panel: name, initials, enterprise, venture, birthday + clear; Birthday button renamed Profile', ['log-name', 'log-initials', 'log-enterprise', 'log-venture', 'log-birthday', 'log-profile-clear'].every((id) => html.includes(`id="${id}"`)) && />Profile<\/button>/.test(html) && !/log-birthday-clear/.test(html));
  assert('clear profile keeps log entries', /clearProfile\(\)/.test(cl) && !/removeItem\(KEY_PREFIX[^)]*\)[^;]*;\s*\n\s*Object\.values\(FIELDS\)/.test(cl) && /function clearProfile\(\) \{ try \{ PROFILE_KEYS\.forEach/.test(pj));
  assert('export header carries the name when set', /Captain’s Log\$\{P\.name \? ` · \$\{P\.name\}` : ''\}/.test(cl));
  assert('life day reads the profile birthday', /const b = P\.birthday;/.test(cl));
}

{
  console.log('\n--- v39: tracker targets + daily checklist from Profile (no personal supplement list or times in code) ---');
  const P = await import('./profile.js?v=t39');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const cl = src('./captains-log.js'), html = src('./index.html');
  const v0 = P.profileView({});
  assert('neutral fallbacks: "Wake ☀️" / "Bed 💤" labels and a generic three-item checklist', v0.wake === 'Wake' && v0.bed === 'Bed' && JSON.stringify(v0.supplements) === JSON.stringify(['Morning supplements', 'Midday supplements', 'Evening supplements']));
  const v = P.profileView({ wake: '5:30am', bed: '9:30pm', supplements: 'Fish oil\n\n  Vitamin D <b>\nMagnesium\nA\nB\nC\nD' });
  assert('typed targets and checklist win; checklist cleaned, blank lines dropped, capped at 6', v.wake === '5:30am' && v.bed === '9:30pm' && v.supplements.length === 6 && v.supplements[1] === 'Vitamin D b' && v.supplements[0] === 'Fish oil');
  assert('saved entries keep their values: first three checklist lines reuse the old ids', JSON.stringify(P.SUPP_IDS.slice(0, 3)) === JSON.stringify(['supp_620', 'supp_930', 'supp_9pm']) && P.SUPP_IDS.length === 6);
  assert('keys mec-log-wake / -bed / -supplements; times ≤ 12 chars', P.WAKE_KEY === 'mec-log-wake' && P.BED_KEY === 'mec-log-bed' && P.SUPPS_KEY === 'mec-log-supplements' && P.cleanTime('x'.repeat(30)).length === 12);
  assert('log renders tracker labels and checklist from the profile', /label: \(p\) => `\$\{p\.wake\} ☀️`/.test(cl) && /label: \(p\) => `\$\{p\.bed\} 💤`/.test(cl) && /\{ id: 'supps', type: 'supps' \}/.test(cl) && /P\.supplements\.map\(\(label, i\) => \(\{ id: SUPP_IDS\[i\], type: 'check', label \}\)\)/.test(cl));
  assert('a changed checklist rebuilds the form without losing the day\'s entry', /if \(shape && next !== shape\) \{ flush\(\); buildForm\(\); fillForm\(\); \}/.test(cl));
  assert('Profile panel has wake, bed and checklist fields', ['log-wake', 'log-bed', 'log-supplements'].every((id) => html.includes(`id="${id}"`)));
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
