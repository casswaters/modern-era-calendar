/**
 * Sync UI (v55). Loaded only when sync-config.js holds a client ID.
 * Adds a "Drive sync" button and panel to the log. Google sign in uses the Google Identity
 * Services token flow (popup, scope drive.appdata only); the token lives in memory only.
 * Saves sync a few seconds later while a token is valid; otherwise changes wait for Sync now.
 */
import { SCOPE, FILE_NAME, driveClient, syncOnce, validDoc, mergeDocs } from './sync.js?v=cl56';

const ON_KEY = 'mec-sync-on', LAST_KEY = 'mec-sync-last', DIRTY_KEY = 'mec-sync-dirty';
const GIS = 'https://accounts.google.com/gsi/client';

export function start({ clientId, localDoc, apply }) {
  const actions = document.querySelector('.log-actions');
  if (!actions) return;
  const btn = document.createElement('button');
  btn.className = 'btn xs'; btn.id = 'log-sync-btn'; btn.type = 'button';
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'log-sync');
  btn.textContent = 'Drive sync';
  actions.appendChild(btn);
  const panel = document.createElement('div');
  panel.className = 'log-settings'; panel.id = 'log-sync'; panel.hidden = true;
  panel.innerHTML = `<p class="log-settings-note">Keeps your entries in a private app folder in your own Google Drive. Only you can see it, and this site can see nothing else in your Drive.</p>
    <p class="log-settings-note" id="log-sync-status" role="status"></p>
    <div class="log-actions">
      <button class="btn xs" id="log-sync-now" type="button">Sync now</button>
      <button class="btn xs" id="log-sync-export" type="button">Download backup</button>
      <button class="btn xs ghost" id="log-sync-off" type="button">Turn off</button>
    </div>`;
  actions.after(panel);
  const $ = (id) => panel.querySelector('#' + id);
  const status = (m) => { $('log-sync-status').textContent = m; };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} return null; };

  let token = '', expires = 0, busy = false, later = null, tokenClient = null, pendingResolve = null;
  const hasToken = () => token && Date.now() < expires - 60000;

  function idle() {
    const last = Number(ls(LAST_KEY)) || 0;
    const when = last ? new Date(last).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    if (ls(ON_KEY) !== '1') status('Not connected. Sync now asks you to sign in with Google once.');
    else if (ls(DIRTY_KEY) === '1') status(`Changes not on Drive yet. Tap Sync now.${when ? ` Last sync ${when}.` : ''}`);
    else status(when ? `Up to date. Last sync ${when}.` : 'Connected.');
  }

  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = GIS; s.async = true;
      s.onload = () => res(); s.onerror = () => rej(new Error('gis'));
      document.head.appendChild(s);
    });
  }
  function getToken() {
    if (hasToken()) return Promise.resolve(token);
    return new Promise((res, rej) => {
      if (!tokenClient) {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId, scope: SCOPE,
          callback: (r) => {
            const p = pendingResolve; pendingResolve = null;
            if (r && r.access_token) { token = r.access_token; expires = Date.now() + (Number(r.expires_in) || 3600) * 1000; p && p.res(token); }
            else p && p.rej(new Error('denied'));
          },
          error_callback: () => { const p = pendingResolve; pendingResolve = null; p && p.rej(new Error('closed')); }
        });
      }
      pendingResolve = { res, rej };
      tokenClient.requestAccessToken({ prompt: ls(ON_KEY) === '1' ? '' : 'consent' });
    });
  }

  async function run(interactive) {
    if (busy) return;
    if (!navigator.onLine) { ls(DIRTY_KEY, '1'); status('Offline. Your entries are safe here and will sync when you are back online.'); return; }
    busy = true; $('log-sync-now').disabled = true;
    try {
      if (!hasToken()) {
        if (!interactive) { ls(DIRTY_KEY, '1'); idle(); return; }
        status('Opening Google sign in…');
        await loadGis(); await getToken();
      }
      status('Syncing…');
      const r = await syncOnce(driveClient(fetch.bind(window), () => token), localDoc());
      if (r.toLocal.length) apply(r.doc, r.toLocal);
      ls(ON_KEY, '1'); ls(DIRTY_KEY, null); ls(LAST_KEY, String(Date.now()));
      idle();
    } catch (e) {
      ls(DIRTY_KEY, '1');
      if (e && e.auth) { token = ''; status('Google sign in expired. Tap Sync now.'); }
      else if (e && /denied|closed|gis/.test(e.message)) status('Sign in did not finish. Nothing changed. Tap Sync now to try again.');
      else status('Could not reach Drive. Your entries are safe here. Tap Sync now to try again.');
    } finally { busy = false; $('log-sync-now').disabled = false; }
  }

  btn.addEventListener('click', () => {
    panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) idle();
  });
  $('log-sync-now').addEventListener('click', () => run(true));
  $('log-sync-off').addEventListener('click', () => {
    if (token && window.google && google.accounts) try { google.accounts.oauth2.revoke(token, () => {}); } catch {}
    token = ''; expires = 0; ls(ON_KEY, null); ls(LAST_KEY, null); ls(DIRTY_KEY, null);
    status('Sync is off. Your entries stay in this browser, and the copy in Drive stays where it is.');
  });
  $('log-sync-export').addEventListener('click', () => {
    const doc = validDoc(mergeDocs(localDoc(), {}).doc);
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = FILE_NAME.replace('.json', `-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status('Backup downloaded as plain JSON.');
  });
  window.addEventListener('mec-log-saved', () => {
    if (ls(ON_KEY) !== '1') return;
    ls(DIRTY_KEY, '1');
    clearTimeout(later); later = setTimeout(() => run(false), 3000);
  });
  window.addEventListener('online', () => { if (ls(ON_KEY) === '1' && ls(DIRTY_KEY) === '1') run(false); });
  idle();
}
