// Offline support for the published build: after the first visit Cartografo opens without a connection.
// Pages (HTML) are network-first so a new release shows up at once; everything else (hashed scripts,
// textures, prop renders, Google Fonts) is served from the cache and refreshed in the background.
const CACHE = 'cartografo-v1';

/** Cache every built file the manifest lists, so the TV view and the menus (loaded on demand) work offline. */
async function precache(c) {
  try {
    const m = await (await fetch('manifest.json', { cache: 'no-store' })).json();
    const files = new Set();
    for (const ch of Object.values(m)) for (const f of [ch.file, ...(ch.css || []), ...(ch.assets || [])]) if (f) files.add(f);
    const missing = [];
    for (const f of files) if (!(await c.match(f))) missing.push(f);
    await c.addAll(missing);
  } catch { /* no manifest (dev server): runtime caching still applies */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(async (c) => { await c.add('./'); await precache(c); }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const cacheable = (url) => url.origin === self.location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || !cacheable(url)) return;
  if (req.mode === 'navigate') {
    // the app is a single page: any navigation (including ?player=1) falls back to the cached shell
    // a fresh page may belong to a new release: also fetch its scripts while online
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); e.waitUntil(caches.open(CACHE).then(async (c) => { await c.put('./', copy); await precache(c); })); }
      return res;
    }).catch(() => caches.match('./')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const hit = await c.match(req);
    const net = fetch(req).then((res) => {
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
