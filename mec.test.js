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
  REALMS, GUIDE, HUB, VIRTUES, CREED, OPENING, CLOSING, REALM_IDS, PORTRAIT_DIR, SHRINE_IMAGE, SHRINE_IMAGE_MOBILE,
  validateTree, validateAll, reflectionKey, ritualFor, tokenContext, fillTokens,
  advisorsFor, advisorDialogue, advisorKey, slugify,
  readMs, READ_BASE_MS, READ_PER_CHAR_MS, guardianRole, guardianLine, guardianPortraitPath,
  irishnuPortraitPath, realmBackdropPath, HUB_ART, IRISHNU_PORTRAIT,
  GP, GPm, GUARDIAN_DIR, RP, RPm, REALM_DIR, ART_MOBILE_MQ, mobileArtPath, pickArtPath
} from './aretoria-data.js';
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
  console.log('\n--- Aretoria: realms, advisors, dialogue integrity ---');
  assert('seven realms incl. Shadow', REALMS.length === 7 && REALM_IDS.includes('shadow'));
  assert('realm ids match legacy portal ids', eq([...REALM_IDS].sort(), ['courage', 'humanity', 'justice', 'shadow', 'temperance', 'transcendence', 'wisdom']));
  assert('every realm has a guardian with name + source', REALMS.every((r) => r.guardian && r.guardian.name && ['notes', 'neutral'].includes(r.guardian.source)));
  assert('realm colours are hex', REALMS.every((r) => /^#[0-9a-f]{6}$/.test(r.color)));
  const allErr = validateAll();
  assert('all dialogue trees valid (choices → real nodes, all reachable)', allErr.length === 0, allErr.slice(0, 5).join('; '));
  for (const r of REALMS) {
    const n = Object.keys(r.dialogue.nodes).length;
    assert(`${r.id}: 3–5 dialogue nodes`, n >= 3 && n <= 5, String(n));
    assert(`${r.id}: has a saving reflection node`, Object.values(r.dialogue.nodes).some((x) => x.input && x.choices.some((c) => c.save)));
  }
  assert('Irishnu tree valid', validateTree(GUIDE.dialogue).length === 0);
  assert('validator catches a dangling choice', validateTree({ start: 'a', nodes: { a: { text: 'x', choices: [{ label: 'y', next: 'nope' }] } } }).length > 0);
  assert('validator catches an unreachable node', validateTree({ start: 'a', nodes: { a: { text: 'x', choices: [{ label: 'y', next: '@close' }] }, b: { text: 'z', choices: [{ label: 'q', next: '@hub' }] } } }).length > 0);
  assert('legacy reflection key format', reflectionKey('2026-10-05', 'wisdom') === 'mec-realm:2026-10-05:wisdom');
  assert('ritual: Monday → daily (Wisdom)', ritualFor(new Date(2026, 9, 5)).realm === 'wisdom');
  assert('ritual: Sunday → self-audit (Justice)', ritualFor(new Date(2026, 9, 4)).id === 'sunday-audit');
  assert('ritual: 1st & 3rd Saturday → relationship', ritualFor(new Date(2026, 9, 3)).id === 'relationship' && ritualFor(new Date(2026, 9, 17)).id === 'relationship');
  assert('ritual: 2nd Saturday → daily', ritualFor(new Date(2026, 9, 10)).id === 'daily');
  assert('ritual: last day of month → monthly review', ritualFor(new Date(2026, 9, 31)).id === 'monthly');
  const ctx = tokenContext(new Date(2026, 9, 4));
  const texts = [GUIDE, ...REALMS].flatMap((x) => Object.values(x.dialogue.nodes).flatMap((n) => [n.text, ...n.choices.map((c) => c.label + ' ' + c.next)]));
  assert('no unresolved {tokens} in dialogue', texts.every((t) => !/\{\w+\}/.test(fillTokens(t, ctx))));
}

{
  console.log('\n--- Aretoria: Hall of Virtues + Creed ---');
  assert('81 virtues', VIRTUES.length === 81, String(VIRTUES.length));
  assert('virtue slugs unique, lowercase letters only', new Set(VIRTUES.map((v) => v.slug)).size === VIRTUES.length && VIRTUES.every((v) => /^[a-z]+$/.test(v.slug) && v.slug === slugify(v.name)));
  assert('every virtue maps to a realm', VIRTUES.every((v) => REALM_IDS.includes(v.realm) && v.essence));
  const withArt = VIRTUES.filter((v) => v.portrait);
  assert('portrait paths point into assets/aretoria/portraits', withArt.every((v) => v.portrait === `${PORTRAIT_DIR}${v.slug}.jpg`));
  assert('every portrait file exists', withArt.every((v) => existsSync(new URL(v.portrait, import.meta.url))), withArt.filter((v) => !existsSync(new URL(v.portrait, import.meta.url))).map((v) => v.slug).join(','));
  assert('shrine image exists', existsSync(new URL(SHRINE_IMAGE, import.meta.url)));
  assert('all 81 virtues have a portrait (24 own + 57 generated)', withArt.length === 81 && VIRTUES.filter((v) => v.wide).length === 57 && VIRTUES.filter((v) => !v.wide).length === 24);
  assert("Cassidy's own portraits stay tall (not flagged wide)", ['acceptance', 'resolve', 'creativity', 'reverence', 'quietudeness', 'tolerance'].every((s) => !VIRTUES.find((v) => v.slug === s).wide));
  assert('generated portraits are web-sized (<150 KB)', VIRTUES.filter((v) => v.wide).every((v) => statSync(new URL(v.portrait, import.meta.url)).size < 150000));
  assert('every realm but Shadow offers an advisor', REALMS.filter((r) => r.id !== 'shadow').every((r) => advisorsFor(r.id).length > 0));
  assert('advisor dialogues valid', withArt.every((v) => validateTree(advisorDialogue(v)).length === 0));
  assert('advisor key extends legacy key', advisorKey('2026-10-05', withArt[0]) === `mec-realm:2026-10-05:${withArt[0].realm}:${withArt[0].slug}`);
  assert('creed closing affirmation', eq(CREED.affirmation, ['This is the nature of reality.', 'This is who we are.', 'I am part of this.']));
  assert('creed has five body paragraphs', CREED.paragraphs.length === 5 && CREED.title === 'The Divine Evolution Creed');
  assert('opening + closing lines', OPENING.startsWith('Within me blooms Aretoria') && CLOSING.startsWith('Thus, I stand'));
  const sw = readFileSync(new URL('./sw.js', import.meta.url), 'utf8');
  assert('SW is captains-log-v19 and precaches Aretoria code', /captains-log-v19/.test(sw) && !/mec-v27/.test(sw) && ['aretoria.js', 'aretoria-data.js', 'aretoria-art.js', 'aretoria.css'].every((f) => sw.includes(`./${f}`)));
  assert('SW does not precache portraits', !/assets\/aretoria\/[^']*\.jpg/.test(sw.replace(/\/\*[\s\S]*?\*\//g, '')));
}

{
  console.log('\n--- Aretoria v25: narration timing, Irishnu, Guardians, wording ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  // 1. narration lines stay readable
  assert('readMs: at least 4 s even for an empty line', readMs('') >= 4000 && READ_BASE_MS >= 4000);
  assert('readMs: ≈4 s + 60 ms per character', readMs('x'.repeat(100)) === READ_BASE_MS + 100 * READ_PER_CHAR_MS && READ_PER_CHAR_MS >= 60);
  assert('readMs grows with length', readMs('a short line') < readMs(OPENING));
  assert('opening line holds ≥ 4 s + 60 ms/char (≈18 s)', readMs(OPENING) >= 4000 + 60 * OPENING.length);
  assert('closing line holds ≥ 4 s + 60 ms/char', readMs(CLOSING) >= 4000 + 60 * CLOSING.length);
  const aj = noComments(src('./aretoria.js'));
  assert('intro + outro timers use readMs (no fixed 2.6–3.9 s fades)', /readMs\(OPENING\)/.test(aj) && /readMs\(CLOSING\)/.test(aj) && !/setTimeout\(finishIntro, 3900\)/.test(aj) && !/setTimeout\(finishOutro, reduced\(\) \? 2200 : 2600\)/.test(aj));
  assert('continue hint text present (tap / click / Enter)', /Tap to continue/.test(aj) && /press Enter to continue/.test(aj) && /ar-narr-hint/.test(aj));
  assert('Enter and Space advance narration', /e\.key === 'Enter'/.test(aj) && /e\.key === ' '/.test(aj) && /advanceIntro\(\)/.test(aj) && /leaveOutro\(\)/.test(aj));
  assert('Esc / ✕ on narration leave at once', /exitNow\(\)/.test(aj) && /ar-narr-x/.test(aj) && /immediate: true/.test(aj));
  assert('reduced motion still honoured in narration', /if \(reduced\(\)\) \{\s*intro\.classList\.add\('still'\)/.test(aj));
  const css = src('./aretoria.css');
  assert('CSS: hint styled + outro no longer fades out on its own', /\.ar-narr-hint\.show/.test(css) && !/78% \{ opacity: 1; \} 100% \{ opacity: 0; \}/.test(css));
  // 2. Irishnu: the Guide (his wit stays unannounced)
  assert('Irishnu is titled the Guide', GUIDE.name === 'Irishnu' && GUIDE.title === 'the Guide');
  const guideText = JSON.stringify(GUIDE);
  assert('Irishnu is never labelled a jester/fool/clown in visible text', !/jester|clown|fool|motley|harlequin|trickster/i.test(guideText));
  assert('Irishnu keeps the lore: axis, one whole, Shadow, real-circumstances question', /one whole/.test(guideText) && /Shadow/.test(guideText) && /real circumstances/.test(guideText) && /Eirena/.test(guideText));
  assert('Irishnu dialogue rewritten (v24 greeting gone)', !/I keep the doors and walk beside you/.test(guideText));
  const art = src('./aretoria-art.js');
  assert('Irishnu figure keeps hood + staff, no costume', /irishnu: \{[^}]*head: 'hood'[^}]*emblem: 'staff'/.test(art) && !/jester|bells|motley|harlequin/i.test(noComments(art)));
  // 3. Guardians
  assert('every realm host is a Guardian with a warrior type', REALMS.every((r) => r.guardian.warrior && guardianRole(r).startsWith('Guardian of')));
  const types = Object.fromEntries(REALMS.map((r) => [r.id, r.guardian.warrior]));
  assert('warrior types fit the realms', types.courage === 'storm-forged champion' && types.justice === 'paladin of the balance' && types.humanity === 'warrior-healer' && types.temperance === 'disciplined monk-warrior' && types.wisdom === 'battle-sage' && types.transcendence === 'celestial seraph-knight' && types.shadow === 'veiled sentinel', JSON.stringify(types));
  assert('every Guardian introduces itself as Guardian in its greeting', REALMS.every((r) => /Guardian of/.test(r.dialogue.nodes.greet.text)));
  assert('guardianLine reads naturally', guardianLine(REALMS.find((r) => r.id === 'courage')) === 'Valorix the Stormheart, Guardian of Courage, a storm-forged champion');
  assert('GP builds assets/aretoria/guardians/<slug>.jpg', GP('valorix') === 'assets/aretoria/guardians/valorix.jpg' && GUARDIAN_DIR === 'assets/aretoria/guardians/');
  assert('guardianPortraitPath: null → drawn figure, string → path', guardianPortraitPath({ guardianPortrait: null }) === null && guardianPortraitPath({ guardianPortrait: GP('sophia') }) === GP('sophia'));
  const dataSrc = src('./aretoria-data.js');
  assert('GP() is declared before REALMS (safe to use inside realm entries)', dataSrc.indexOf('export const GP =') > -1 && dataSrc.indexOf('export const GP =') < dataSrc.indexOf('export const REALMS ='));
  assert('guardian portrait is lazy with drawn-figure fallback', /ar-host-photo/.test(aj) && /loading="lazy"/.test(aj) && /badPortraits\.add/.test(aj));
  const sw = src('./sw.js');
  assert('SW does not precache guardian portraits', !/guardians\//.test(noComments(sw)));
  // 3b/4. wording
  const visible = [JSON.stringify(REALMS), guideText, JSON.stringify(VIRTUES), ...VIRTUES.map((v) => JSON.stringify(advisorDialogue(v)))].join(' ');
  assert('no "keeper" in Aretoria text', !/keeper/i.test(visible) && !/keeper/i.test(noComments(src('./aretoria.js'))) && !/keeper/i.test(src('./portal.js')));
  assert('no Version 2 / chakra realms in user-facing text', !/chakra|version 2/i.test(visible + noComments(src('./aretoria.js')) + src('./portal.js') + src('./index.html')));
  assert('Version 1 only: six virtue realms + Shadow', eq(REALMS.filter((r) => r.id !== 'shadow').map((r) => r.id).sort(), ['courage', 'humanity', 'justice', 'temperance', 'transcendence', 'wisdom']));
  // cache-busting
  const html = src('./index.html');
  const allSrc = html + ['./app.js', './captains-log.js', './portal.js', './aretoria.js'].map(src).join('');
  assert('all asset queries are ?v=cl19 (no leftover ?v=27)', /\?v=cl19/.test(html) && !/\?v=27\b/.test(allSrc));
  assert('aretoria.css loads with ?v=cl19', /const VERSION = 'cl19';/.test(src('./aretoria.js')));
}

{
  console.log('\n--- Aretoria v26: painted guardians, Irishnu, realm backdrops ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const GUARDIAN_SLUG = { courage: 'valorix', justice: 'justar', humanity: 'amara', temperance: 'moder', wisdom: 'sophia', transcendence: 'auria', shadow: 'shadow' };
  assert('every realm has a painted guardianPortrait via GP(slug)', REALMS.every((r) => r.guardianPortrait === GP(GUARDIAN_SLUG[r.id])));
  assert('all 7 guardian portraits exist on disk', REALMS.every((r) => existsSync(new URL(r.guardianPortrait, import.meta.url))));
  assert('guardian portraits are web-sized (<220 KB)', REALMS.every((r) => statSync(new URL(r.guardianPortrait, import.meta.url)).size < 220000));
  assert('Irishnu portrait is set and exists', IRISHNU_PORTRAIT === GP('irishnu') && GUIDE.portrait === IRISHNU_PORTRAIT && existsSync(new URL(IRISHNU_PORTRAIT, import.meta.url)));
  assert('irishnuPortraitPath returns the Guide portrait', irishnuPortraitPath() === IRISHNU_PORTRAIT);
  assert('Irishnu portrait is web-sized (<220 KB)', statSync(new URL(IRISHNU_PORTRAIT, import.meta.url)).size < 220000);
  assert('every realm has a painted realmBackdrop via RP(id)', REALMS.every((r) => r.realmBackdrop === RP(r.id)));
  assert('RP builds assets/aretoria/realms/<id>.jpg', RP('courage') === 'assets/aretoria/realms/courage.jpg' && REALM_DIR === 'assets/aretoria/realms/');
  assert('all 7 realm backdrops exist on disk', REALMS.every((r) => existsSync(new URL(r.realmBackdrop, import.meta.url))));
  assert('realm backdrops are web-sized (<250 KB)', REALMS.every((r) => statSync(new URL(r.realmBackdrop, import.meta.url)).size < 250000));
  assert('realmBackdropPath: null → CSS scene, string → path', realmBackdropPath({ realmBackdrop: null }) === null && realmBackdropPath(REALMS[0]) === REALMS[0].realmBackdrop);
  const aj = noComments(src('./aretoria.js'));
  assert('hub uses Irishnu portrait with drawn-figure fallback', /irishnuPhoto|irishnuPortraitPath/.test(aj) && /ar-guide/.test(aj) && /badPortraits/.test(aj));
  assert('realm views use paintedScene when backdrop present', /paintedScene/.test(aj) && /realmBackdropPath/.test(aj) && /ar-l-realm/.test(aj));
  assert('guardian + guide portraits stay lazy-loaded', /loading="lazy"/.test(aj));
  const css = src('./aretoria.css');
  assert('CSS: face-friendly guardian crop + realm veil', /object-position:\s*50%\s*28%/.test(css) && /ar-l-realmveil/.test(css) && /ar-guide\.ar-host-photo/.test(css));
  const sw = src('./sw.js');
  assert('SW is captains-log-v19 and does not precache guardians or realms', /captains-log-v19/.test(sw) && !/guardians\//.test(noComments(sw)) && !/realms\//.test(noComments(sw)));
  assert('entry shrine path unchanged', SHRINE_IMAGE === 'assets/aretoria/shrine.jpg' && existsSync(new URL(SHRINE_IMAGE, import.meta.url)));
  const guideText = JSON.stringify(GUIDE);
  assert('still no jester/fool/motley wording for Irishnu', !/jester|clown|fool|motley|harlequin|trickster/i.test(guideText));
  assert('About mentions painted guardians / realm scenes', /painted/.test(src('./index.html')));
  assert('warrior types still shown in dialogue titles', /guardianRole\(r\).*warrior|warrior/.test(aj) && REALMS.every((r) => r.guardian.warrior));
}


{
  console.log('\n--- Aretoria v27: Axial hub painted backdrop (entry still shrine) ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert('HUB.realmBackdrop is RP(axial)', HUB.realmBackdrop === RP('axial') && RP('axial') === 'assets/aretoria/realms/axial.jpg');
  assert('axial backdrop exists on disk', existsSync(new URL(HUB.realmBackdrop, import.meta.url)));
  assert('axial backdrop is web-sized (<200 KB)', statSync(new URL(HUB.realmBackdrop, import.meta.url)).size < 200000);
  assert('realmBackdropPath(HUB) returns axial.jpg', realmBackdropPath(HUB) === RP('axial'));
  const aj = noComments(src('./aretoria.js'));
  assert('hub view uses paintedScene via HUB backdrop (not SHRINE_IMAGE for axial scene)', /realmBackdropPath\(HUB\)/.test(aj) && /paintedScene/.test(aj));
  assert('entry cinematic uses resolveArt(SHRINE_IMAGE)', /resolveArt\(SHRINE_IMAGE\)/.test(aj) && /url\('\$\{shrine\}'\)/.test(aj));
  assert('hub shrine fallback uses resolveArt shrine var', /SCENES\.axial\(shrine\)/.test(aj) && /resolveArt\(SHRINE_IMAGE\)/.test(aj));
  // Stronger: hub prefers painted; shrine only as fallback when painted missing
  assert('axial hub prefers painted backdrop; shrine only as no-paint fallback', /hub \? realmBackdropPath\(HUB\)/.test(aj) && /SCENES\.axial\(shrine\)/.test(aj));
  const sw = src('./sw.js');
  assert('SW captains-log-v19 does not precache axial.jpg / realms/', /captains-log-v19/.test(sw) && !/realms\//.test(noComments(sw)) && !/axial\.jpg/.test(noComments(sw)));
  assert('About mentions shrine fly-through / Axial painted backdrop', /shrine fly-through|floating-island|Axial hub/.test(src('./index.html')));
}


{
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  console.log('\n--- No realm colour coding (shared ivory/gold palette) ---');
  const ajNC = noComments(src('./aretoria.js'));
  const cssNC = src('./aretoria.css');
  assert('aretoria.js never reads r.color (no per-realm colour coding)', !/\br\.color\b/.test(ajNC) && /SHARED_ACCENT/.test(ajNC));
  assert('gates/filters/cards carry no inline --c realm colour', !/style="--c:/.test(ajNC));
  assert('CSS pins --c to one shared gold', /\.ar-gate, \.ar-filter, \.ar-vcard \{ --c: #f1d58e; \}/.test(cssNC));
  assert('hub orb ring + hub particles are gold, not rainbow', !/rgba\(158,240,200/.test(cssNC) && !/'#9ef0c8', '#7fb8ff'/.test(ajNC));
  assert('Shadow gate is deep bronze/marble, not violet', !/#b9a6e8/.test(cssNC));
}

{
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  console.log('\n--- Axial hub v13: desktop ellipse arc on the bridges, phone grid above the painting ---');
  const ajA = noComments(src('./aretoria.js'));
  const ids = ['courage', 'justice', 'humanity', 'temperance', 'wisdom', 'transcendence', 'shadow'];
  const D = HUB_ART.desk.gates;
  assert('HUB_ART.desk has an arch point for all 7 gates', ids.every((id) => Array.isArray(D[id]) && D[id].length === 2));
  assert('HUB_ART art sizes match the shipped JPEGs (1280×720 / 576×1248)', HUB_ART.desk.w === 1280 && HUB_ART.desk.h === 720 && HUB_ART.mob.w === 576 && HUB_ART.mob.h === 1248);
  assert('desktop gates run left→right Courage…Transcendence', ids.slice(0, 6).every((id, i, a) => i === 0 || D[id][0] > D[a[i - 1]][0]));
  const pairs = [['courage', 'transcendence'], ['justice', 'wisdom'], ['humanity', 'temperance']];
  assert('desktop arc is mirrored about the centre (x pairs sum to 1280, equal y)', pairs.every(([l, r]) => Math.abs(D[l][0] + D[r][0] - 1280) <= 2 && Math.abs(D[l][1] - D[r][1]) <= 2));
  assert('desktop arc sweeps: outer pair lowest, inner pair highest', D.courage[1] > D.justice[1] && D.justice[1] > D.humanity[1]);
  // all six on one ellipse centred on the plaza (cx 640): fit a, b from the outer + inner pair, the middle pair must lie on it
  const e = (() => { const [x1, y1] = [D.humanity[0] - 640, D.humanity[1]], [x3, y3] = [D.courage[0] - 640, D.courage[1]]; const cy = 372;
    const A1 = x1 * x1, B1 = (cy - y1) ** 2, A3 = x3 * x3, B3 = (cy - y3) ** 2; const v = (A3 - A1) / (A3 * B1 - A1 * B3), u = (1 - B1 * v) / A1; return { u, v, cy }; })();
  const onE = ([x, y]) => (x - 640) ** 2 * e.u + (e.cy - y) ** 2 * e.v;
  assert('justice/wisdom lie on the same plaza ellipse (±6%)', Math.abs(onE(D.justice) - 1) < 0.06 && Math.abs(onE(D.wisdom) - 1) < 0.06);
  assert('gates slid back toward the plaza (not at the archways): Courage x ≥ 280, Transcendence x ≤ 1000, inner pair y ≥ 250', D.courage[0] >= 280 && D.transcendence[0] <= 1000 && D.humanity[1] >= 250 && D.temperance[1] >= 250);
  assert('Shadow centred on the front bridge, orb on the rune', D.shadow[0] === 640 && D.shadow[1] > HUB_ART.desk.rune[1] + 100 && HUB_ART.desk.rune[0] === 640);
  assert('mobile hub is a grid with a painting band rect', HUB_ART.mob.layout === 'grid' && Array.isArray(HUB_ART.mob.band) && HUB_ART.mob.band.length === 4 && HUB_ART.mob.band[3] > HUB_ART.mob.rune[1] && HUB_ART.mob.band[1] < HUB_ART.mob.rune[1]);
  assert('phone grid order is the six realms left→right; Shadow the centred 7th tile', /const HUB_GRID_ORDER = \['courage', 'justice', 'humanity', 'temperance', 'wisdom', 'transcendence'\]/.test(src('./aretoria.js')) && /id === 'shadow' \? 2 : Math\.floor\(k \/ 3\)/.test(ajA) && /id === 'shadow' \? 1 : k % 3/.test(ajA));
  assert('grid sits between the header and the painting band top', /\.ar-top'\)/.test(ajA) && /toScreen\(\[0, art\.band\[1\]\]\)/.test(ajA) && /classList\.toggle\('ar-hubgrid', mobile\)/.test(ajA));
  assert('layoutHub maps desktop gates by realm name, Shadow on x = cx, orb on the rune', /art\.gates\[id\]/.test(ajA) && /id === 'shadow'\) x = w \/ 2/.test(ajA) && /toScreen\(art\.rune\)/.test(ajA));
  const cssG = noComments(src('./aretoria.css'));
  assert('phone grid tiles: ≥ 44px tap target, no bob, guardian names hidden ≤ 380px', /\.ar-hubgrid \.ar-gate \{ width: min\(31vw, 116px\); animation: none;/.test(cssG) && /@media \(max-width: 380px\), \(max-width: 699px\) and \(max-height: 720px\) \{[\s\S]*?\.ar-hubgrid \.ar-gate-sub \{ display: none; \}/.test(cssG));
  assert('no gold centre thread element in the hub', !/ar-thread|gold-thread|center-thread/.test(ajA + src('./aretoria.css')));
  const mobAx = new URL('./assets/aretoria/realms/mobile/axial.jpg', import.meta.url);
  assert('mobile axial backdrop exists and is < 200 KB', existsSync(mobAx) && statSync(mobAx).size < 200000);
}

{
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  console.log('\n--- Hall of Virtues: uniform cards (v14) ---');
  const cssH = noComments(src('./aretoria.css')); const jsH = noComments(src('./aretoria.js'));
  const rule = (sel) => { const m = cssH.match(new RegExp('(?:^|\\n)' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\{([^}]*)\\}')); return m ? m[1] : ''; };
  assert('grid rows are uniform (grid-auto-rows: 1fr)', /grid-auto-rows: 1fr/.test(rule('.ar-vgrid')));
  assert('art frame is a fixed 3:4 box that clips (aspect-ratio, overflow hidden, flex: none)', /aspect-ratio: 3 \/ 4/.test(rule('.ar-vart')) && /overflow: hidden/.test(rule('.ar-vart')) && /flex: none/.test(rule('.ar-vart')));
  assert('portrait is absolutely placed + object-fit: cover (its own aspect cannot grow the frame)', /position: absolute/.test(rule('.ar-vart img')) && /object-fit: cover/.test(rule('.ar-vart img')) && /height: calc\(100% - 2 \* var\(--vp\)\)/.test(rule('.ar-vart img')));
  assert('names are one fixed-height line (nowrap + ellipsis), realm line nowrap', /white-space: nowrap/.test(rule('.ar-vname')) && /text-overflow: ellipsis/.test(rule('.ar-vname')) && /height: 1\.3em/.test(rule('.ar-vname')) && /white-space: nowrap/.test(rule('.ar-vrealm')));
  assert('essence is an overlay inside the art frame (never grows the card)', /position: absolute/.test(rule('.ar-vess')) && /<span class="ar-vart\$\{[^}]*\}">\$\{art\}<span class="ar-vess">/.test(jsH));
  assert('long names are scaled to fit (fitHallNames on render, open and resize)', /function fitHallNames\(\)/.test(jsH) && (jsH.match(/fitHallNames\(\);/g) || []).length >= 2 && /layoutHub\(\); fitHallNames\(\);/.test(jsH));
  assert('no hyphenated wrapping of names on phones', !/\.ar-vname \{[^}]*hyphens/.test(cssH));
}

{
  console.log('\n--- Captain\'s Log v1 identity (Aretoria stays embedded) ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const html = src('./index.html');
  const man = src('./manifest.webmanifest');
  assert('document title is Captain\'s Log', /<title>Captain.s Log<\/title>/.test(html));
  assert('apple-mobile-web-app-title is Captain\'s Log', /apple-mobile-web-app-title" content="Captain.s Log"/.test(html));
  assert('header brand is Captain\'s Log (CL mark)', /brand-mark[^>]*>CL<\/div>/.test(html) && /<h1>Captain.s Log<\/h1>/.test(html));
  assert('About is About Captain\'s Log', /About Captain.s Log/.test(html));
  assert('does not claim Apple Notes sync', !/sync(?:s|ed)? to Apple Notes/i.test(html) || /Nothing here syncs to Apple Notes/.test(html));
  assert('MEC still present as a feature', /Modern Era Calendar/.test(html) && /month-grid/.test(html));
  assert('Aretoria portal still enterable on homepage', /id="portal-enter"/.test(html) && /Enter the Realms/.test(html) && /aretoria\.js/.test(src('./portal.js')));
  assert('standalone Aretoria link present', /casswaters\.github\.io\/aretoria\//.test(html) && /portal-standalone/.test(html));
  assert('manifest name Captain\'s Log', /"name": "Captain.s Log"/.test(man));
  assert('localStorage Captain\'s Log keys stay mec-log:', /mec-log:/.test(src('./captains-log.js')) && /KEY_PREFIX = 'mec-log:'/.test(src('./captains-log.js')));
  assert('Aretoria reflection keys stay mec-realm:', reflectionKey('2026-10-05', 'wisdom') === 'mec-realm:2026-10-05:wisdom');
}


{
  console.log('\n--- Aretoria v28: responsive mobile portrait art ---');
  const src = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');
  const noComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const GUARDIAN_SLUG = { courage: 'valorix', justice: 'justar', humanity: 'amara', temperance: 'moder', wisdom: 'sophia', transcendence: 'auria', shadow: 'shadow' };
  assert('ART_MOBILE_MQ matches CSS mobile breakpoint', ART_MOBILE_MQ === '(max-width: 699px)');
  assert('mobileArtPath / pickArtPath scheme', mobileArtPath(RP('courage')) === RPm('courage') && pickArtPath(GP('valorix'), true) === GPm('valorix') && pickArtPath(GP('valorix'), false) === GP('valorix'));
  assert('shrine mobile path', mobileArtPath(SHRINE_IMAGE) === SHRINE_IMAGE_MOBILE && existsSync(new URL(SHRINE_IMAGE_MOBILE, import.meta.url)));
  assert('all realm + axial mobile backdrops exist', ['axial', ...REALMS.map((r) => r.id)].every((id) => existsSync(new URL(RPm(id), import.meta.url))));
  assert('all guardian + irishnu mobile portraits exist', [...Object.values(GUARDIAN_SLUG), 'irishnu'].every((s) => existsSync(new URL(GPm(s), import.meta.url))));
  const aj = noComments(src('./aretoria.js'));
  assert('aretoria.js has resolveArt + artMQ listener', /resolveArt/.test(aj) && /ART_MOBILE_MQ/.test(aj) && /refreshArtIfBreakpointChanged/.test(aj));
  assert('SW captains-log-v19; VERSION cl19', /captains-log-v19/.test(src('./sw.js')) && /const VERSION = 'cl19';/.test(src('./aretoria.js')));
  assert('virtue thumbs stay shared (gap: no mobile virtue portraits this pass)', VIRTUES.filter((v) => v.portrait).every((v) => !String(v.portrait).includes('/mobile/')));
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
