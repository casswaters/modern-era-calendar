/**
 * MEC unit tests — PDF Section 7 acceptance checks + leap/slot extras.
 * Run: node mec.test.js
 */
import {
  DAY_NAMES, REN, is_leap, slots, mec_year,
  gregorian_to_mec, mec_to_gregorian, format_mec,
  easter_western, nth_weekday, last_weekday, monday_on_or_before,
  gregorian_holidays, holidays_on, format_mec_html, format_mec_parts, format_gregorian,
  jewish_holidays, hebrew_to_gregorian, MARKET_NOTES, market_note,
  islamic_holidays, ISLAMIC_RANGE
} from './mec.js';

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

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
