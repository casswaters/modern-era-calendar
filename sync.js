/**
 * Private Google Drive sync (v55). Entries go to the Drive "appDataFolder": a hidden
 * folder only this app can read, inside the user's own Drive. No server; the browser
 * talks to Google directly with a short-lived token (scope drive.appdata only).
 * One file, captains-log.json: { format, v, exported, days: { 'YYYY-MM-DD': { t, data } } }.
 * t is the last edit time in ms; data null means the day was cleared. Merge keeps the newer t per day.
 * The same JSON is the portable export (plain JSON, readable anywhere).
 */
export const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
export const FILE_NAME = 'captains-log.json';
export const FORMAT = 'captains-log';
const API = 'https://www.googleapis.com/drive/v3/files';
const UP = 'https://www.googleapis.com/upload/drive/v3/files';

export function emptyDoc() { return { format: FORMAT, v: 1, exported: 0, days: {} }; }

export function validDoc(doc) {
  if (!doc || doc.format !== FORMAT || typeof doc.days !== 'object' || !doc.days) return emptyDoc();
  const days = {};
  for (const [iso, rec] of Object.entries(doc.days)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !rec || typeof rec.t !== 'number') continue;
    days[iso] = { t: rec.t, data: rec.data && typeof rec.data === 'object' ? rec.data : null };
  }
  return { format: FORMAT, v: 1, exported: doc.exported || 0, days };
}

/** Merge two docs day by day; the newer edit wins, ties keep a. Returns { doc, changedA, changedB } (days a or b must take). */
export function mergeDocs(a, b) {
  a = validDoc(a); b = validDoc(b);
  const days = {}, toA = [], toB = [];
  for (const iso of new Set([...Object.keys(a.days), ...Object.keys(b.days)])) {
    const x = a.days[iso], y = b.days[iso];
    if (x && (!y || x.t >= y.t)) { days[iso] = x; if (!y || JSON.stringify(x) !== JSON.stringify(y)) toB.push(iso); }
    else { days[iso] = y; toA.push(iso); }
  }
  return { doc: { format: FORMAT, v: 1, exported: Date.now(), days }, toA, toB };
}

/** Drive client over an injected fetch (tests pass a mock). token() returns a current access token. */
export function driveClient(fetchFn, token) {
  const call = async (url, opt = {}) => {
    const res = await fetchFn(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: `Bearer ${token()}` } });
    if (res.status === 401) { const e = new Error('auth'); e.auth = true; throw e; }
    if (!res.ok) throw new Error(`drive ${res.status}`);
    return res;
  };
  return {
    async find() {
      const q = encodeURIComponent(`name='${FILE_NAME}'`);
      const r = await call(`${API}?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&pageSize=10`);
      const { files = [] } = await r.json();
      return files[0] ? files[0].id : null;
    },
    async read(id) { return validDoc(await (await call(`${API}/${id}?alt=media`)).json()); },
    async create(doc) {
      const b = 'cl' + Math.random().toString(36).slice(2);
      const body = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(doc)}\r\n--${b}--`;
      const r = await call(`${UP}?uploadType=multipart&fields=id`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body });
      return (await r.json()).id;
    },
    async write(id, doc) {
      await call(`${UP}/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc) });
    }
  };
}

/** One full sync: read Drive, merge with local, write back what changed. Returns the merged doc and the days local must take. */
export async function syncOnce(client, localDoc) {
  const id = await client.find();
  const remote = id ? await client.read(id) : emptyDoc();
  const { doc, toA, toB } = mergeDocs(localDoc, remote);
  if (!id) await client.create(doc);
  else if (toB.length) await client.write(id, doc);
  return { doc, toLocal: toA, toDrive: toB.length };
}
