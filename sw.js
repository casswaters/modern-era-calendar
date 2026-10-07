/* MEC service worker — network-first app shell, offline fallback (Captain's Log / Aretoria; captains-log-v28) */
const CACHE = 'captains-log-v28';
/* Aretoria portrait/shrine/guardian/realm images (assets/aretoria/) are deliberately NOT precached;
   they are fetched only when the portal is entered, then kept by the runtime cache. */
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './mec.js',
  './weather.js',
  './captains-log.js',
  './portal.js',
  './scene.js',
  './aretoria.js',
  './aretoria-data.js',
  './aretoria-art.js',
  './aretoria.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.svg',
  './icons/favicon.ico',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    ).then(() => caches.open(CACHE).then((c) => c.addAll(ASSETS)))
     .then(() => self.clients.claim())
  );
});

function isShell(url) {
  const p = url.pathname;
  return p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.html') || p.endsWith('/') || p.endsWith('/modern-era-calendar');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isShell(url)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
