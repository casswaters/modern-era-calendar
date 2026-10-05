/**
 * Modern Era Calendar — UI
 */
import {
  DAY_NAMES, MONTH_NAMES, REN,
  is_leap, slots, mec_year,
  gregorian_to_mec, mec_to_gregorian,
  format_mec, format_mec_html, format_gregorian,
  next_renaissance_day, renaissance_after_month,
  gregorian_day_of_year, ordinal_to_gregorian,
  holidays_on, holiday_map
} from './mec.js';

const HOLIDAY_ICONS = {
  1: '🌐',
  3: '🌍',
  5: '🌿',
  7: '⚡',
  8: '✨',
  10: '🔮'
};

const GHOLIDAY_ICONS = {
  new_year: '🎊',
  mlk: '✊',
  valentine: '❤️',
  presidents: '🇺🇸',
  st_patrick: '☘️',
  easter: '🐰',
  mothers: '💐',
  memorial: '🎖️',
  juneteenth: '🖤',
  fathers: '👔',
  independence: '🎆',
  labor: '🛠️',
  halloween: '🎃',
  veterans: '🪖',
  thanksgiving: '🦃',
  xmas_eve: '🎄',
  christmas: '🎄',
  new_years_eve: '🥂'
};

/* ---------- Theme ---------- */
const themeToggle = document.getElementById('theme-toggle');
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', t === 'light' ? '#f4f6fb' : '#0f1117');
  localStorage.setItem('mec-theme', t);
}
{
  const saved = localStorage.getItem('mec-theme');
  const prefer = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(saved || prefer);
}
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});

/* ---------- State ---------- */
function todayParts() {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}

let viewYear, viewMonth; // Gregorian year + MEC month being viewed
const t0 = todayParts();
{
  const todayMec = gregorian_to_mec(t0.y, t0.m, t0.d);
  viewYear = t0.y;
  viewMonth = todayMec.mec_month;
}

/* ---------- Today banner ---------- */
function renderTodayBanner() {
  const t = todayParts();
  const rec = gregorian_to_mec(t.y, t.m, t.d);
  document.getElementById('header-year').textContent = String(rec.mec_year);
  document.getElementById('today-greg').textContent = `Gregorian: ${format_gregorian(t.y, t.m, t.d)}`;
  const mecEl = document.getElementById('today-mec');
  mecEl.innerHTML = format_mec_html(rec);

  const todayGhols = holidays_on(t.y, t.m, t.d);
  const next = next_renaissance_day(t.y, t.m, t.d);
  const box = document.getElementById('next-ren');
  let html = '';
  if (todayGhols.length) {
    html += todayGhols.map(h =>
      `<span class="chip ghol">${GHOLIDAY_ICONS[h.id] || '📅'} ${h.name}</span>`
    ).join('');
  }
  if (rec.kind === 'renaissance') {
    html += `<span class="chip">${HOLIDAY_ICONS[rec.mec_month] || '✦'} ${rec.holiday_name}</span>`;
  }
  if (next && next.days_until > 0) {
    const g = next.gregorian;
    const when = next.days_until === 1 ? 'tomorrow' : `in ${next.days_until} days`;
    html +=
      `<span class="chip">${HOLIDAY_ICONS[next.month] || '✦'} ${next.name}</span>` +
      `<span class="chip neutral">${when} · ${format_gregorian(g.year, g.month, g.day)}</span>`;
  } else if (next && next.days_until === 0) {
    html += `<span class="chip neutral">today · ${format_gregorian(next.gregorian.year, next.gregorian.month, next.gregorian.day)}</span>`;
  }
  box.innerHTML = html;
}

function renderDayDetail(rec, g, extra = '') {
  const ghols = holidays_on(g.year, g.month, g.day);
  let html = `<div class="detail-mec">${format_mec_html(rec)}</div>`;
  html += `<div class="detail-greg">Gregorian: ${format_gregorian(g.year, g.month, g.day)}</div>`;
  if (rec.kind === 'renaissance') {
    html += `<div class="detail-tags"><span class="chip">${HOLIDAY_ICONS[rec.mec_month] || '✦'} ${rec.holiday_name}</span></div>`;
  }
  if (ghols.length) {
    html += `<div class="detail-tags">` +
      ghols.map(h =>
        `<span class="chip ghol">${GHOLIDAY_ICONS[h.id] || '📅'} ${h.name}</span>`
      ).join('') +
      `</div>`;
  }
  if (extra) html += `<div class="detail-extra">${extra}</div>`;
  document.getElementById('day-detail').innerHTML = html;
}

/* ---------- Month grid ---------- */
function mecMonthSlots(year, month) {
  const list = slots(year);
  const regular = list.filter(s => s.month === month && s.kind === 'regular');
  return regular; // 30 days
}

function gregorianForSlot(year, month, day) {
  return mec_to_gregorian(year, month, day);
}

function renderMonth() {
  const year = viewYear;
  const month = viewMonth;
  const my = mec_year(year);
  document.getElementById('month-title').textContent = MONTH_NAMES[month - 1];
  document.getElementById('month-year').textContent =
    `MEC Year ${my} · Gregorian ${year}`;

  const grid = document.getElementById('month-grid');
  grid.innerHTML = '';
  const today = todayParts();
  const days = mecMonthSlots(year, month);

  // Holiday maps cover this Gregorian year and neighbors (MEC month can spill)
  const maps = {
    [year - 1]: holiday_map(year - 1),
    [year]: holiday_map(year),
    [year + 1]: holiday_map(year + 1)
  };

  for (const slot of days) {
    const g = gregorianForSlot(year, month, slot.day);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day-cell';
    cell.setAttribute('role', 'gridcell');
    if (slot.name === 'Centiday') cell.classList.add('centiday');
    if (g.year === today.y && g.month === today.m && g.day === today.d) {
      cell.classList.add('today');
    }
    const ghols = (maps[g.year] || holiday_map(g.year)).get(`${g.month}-${g.day}`) || [];
    if (ghols.length) cell.classList.add('has-ghol');
    const shortName = slot.name.slice(0, 3);
    const mark = ghols.length
      ? `<span class="ghol-mark" title="${ghols.map(h => h.name).join(', ')}">${GHOLIDAY_ICONS[ghols[0].id] || '•'}</span>`
      : '';
    cell.innerHTML =
      `<span class="mec-d">${slot.day}</span>` +
      `<span class="name">${shortName}</span>` +
      `<span class="greg">${g.month}/${g.day}</span>` +
      mark;
    const gholTitle = ghols.length ? ' · ' + ghols.map(h => h.name).join(', ') : '';
    cell.title = `${MONTH_NAMES[month - 1]} ${slot.day} · ${slot.name} · Cycle ${slot.cycle} · ${format_gregorian(g.year, g.month, g.day)}${gholTitle}`;
    cell.addEventListener('click', () => {
      const rec = gregorian_to_mec(g.year, g.month, g.day);
      const extra = slot.name === 'Centiday' ? 'Centiday (rest-day candidate)' : '';
      renderDayDetail(rec, g, extra);
    });
    grid.appendChild(cell);
  }

  // Renaissance holiday chip
  const wrap = document.getElementById('holiday-wrap');
  const hol = renaissance_after_month(year, month);
  if (hol) {
    const g = mec_to_gregorian(year, month, 31);
    wrap.hidden = false;
    wrap.innerHTML =
      `<div class="holiday-chip">` +
      `<div class="icon">${HOLIDAY_ICONS[month] || '✦'}</div>` +
      `<div><div class="h-title">${hol}</div>` +
      `<div class="h-meta">After ${MONTH_NAMES[month - 1]} 30 · ${format_gregorian(g.year, g.month, g.day)} · Year ${my}</div></div>` +
      `</div>`;
  } else {
    wrap.hidden = true;
    wrap.innerHTML = '';
  }
}

function shiftMonth(delta) {
  viewMonth += delta;
  if (viewMonth < 1) { viewMonth = 12; viewYear--; }
  if (viewMonth > 12) { viewMonth = 1; viewYear++; }
  renderMonth();
}

document.getElementById('prev-month').addEventListener('click', () => shiftMonth(-1));
document.getElementById('next-month').addEventListener('click', () => shiftMonth(1));
document.getElementById('jump-today').addEventListener('click', () => {
  const t = todayParts();
  const rec = gregorian_to_mec(t.y, t.m, t.d);
  viewYear = t.y;
  viewMonth = rec.mec_month;
  renderMonth();
  showPanel('calendar');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- Tabs ---------- */
function showPanel(name) {
  if (name === 'today') {
    document.getElementById('jump-today').click();
    name = 'calendar';
  }
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === name);
  });
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name || (name === 'calendar' && t.dataset.tab === 'today' && false));
    if (t.dataset.tab === name) t.classList.add('active');
    else if (!(name === 'calendar' && t.dataset.tab === 'calendar')) {
      if (t.dataset.tab !== name) t.classList.remove('active');
    }
  });
  // Fix tab active states cleanly
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
}
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => showPanel(t.dataset.tab));
});

/* ---------- Converter ---------- */
function fillMonthSelect(sel) {
  sel.innerHTML = MONTH_NAMES.map((n, i) =>
    `<option value="${i + 1}">${n}</option>`).join('');
}
fillMonthSelect(document.getElementById('g-m'));
fillMonthSelect(document.getElementById('m-m'));

function seedConverter() {
  const t = todayParts();
  document.getElementById('g-y').value = t.y;
  document.getElementById('g-m').value = t.m;
  document.getElementById('g-d').value = t.d;
  const rec = gregorian_to_mec(t.y, t.m, t.d);
  document.getElementById('m-y').value = t.y;
  document.getElementById('m-m').value = rec.mec_month;
  document.getElementById('m-d').value = rec.kind === 'renaissance' ? 31 : rec.mec_day;
}
seedConverter();

document.getElementById('g-to-mec').addEventListener('click', () => {
  const y = +document.getElementById('g-y').value;
  const m = +document.getElementById('g-m').value;
  const d = +document.getElementById('g-d').value;
  const out = document.getElementById('g-result');
  try {
    const rec = gregorian_to_mec(y, m, d);
    const ghols = holidays_on(y, m, d);
    out.innerHTML = `<div class="detail-mec">${format_mec_html(rec)}</div>` +
      (ghols.length
        ? `<div class="detail-tags" style="margin-top:8px">` +
          ghols.map(h => `<span class="chip ghol">${GHOLIDAY_ICONS[h.id] || '📅'} ${h.name}</span>`).join('') +
          `</div>`
        : '');
  } catch (e) {
    out.textContent = 'Invalid date: ' + e.message;
  }
});

document.getElementById('m-to-g').addEventListener('click', () => {
  const y = +document.getElementById('m-y').value;
  const m = +document.getElementById('m-m').value;
  const d = +document.getElementById('m-d').value;
  const out = document.getElementById('m-result');
  try {
    const g = mec_to_gregorian(y, m, d);
    const rec = gregorian_to_mec(g.year, g.month, g.day);
    const ghols = holidays_on(g.year, g.month, g.day);
    out.innerHTML = `<strong>${format_gregorian(g.year, g.month, g.day)}</strong>` +
      `<div class="detail-mec" style="margin-top:6px">${format_mec_html(rec)}</div>` +
      (ghols.length
        ? `<div class="detail-tags" style="margin-top:8px">` +
          ghols.map(h => `<span class="chip ghol">${GHOLIDAY_ICONS[h.id] || '📅'} ${h.name}</span>`).join('') +
          `</div>`
        : '');
  } catch (e) {
    out.textContent = 'Invalid MEC date: ' + e.message;
  }
});

/* ---------- PWA install ---------- */
let deferredPrompt = null;
const installBtn = document.getElementById('install-btn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

/* ---------- Service worker ---------- */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

/* ---------- Init ---------- */
renderTodayBanner();
renderMonth();

// Auto-convert on load for converter panel defaults
document.getElementById('g-to-mec').click();
document.getElementById('m-to-g').click();
