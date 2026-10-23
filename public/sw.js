const CACHE_NAME = 'salah-surahs-v3';
const ASSETS = [
  './',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png'
];

// Install: pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for same-origin, network fallback
// Pages are served from the app shell at './'. A response that came through a redirect must never be
// handed to a page load: Android refuses it ("This site can't be reached"). Cloudflare redirects /index.html to /.
const unredirect = async (r) => (r && r.redirected ? new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers }) : r);
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || req.mode !== 'navigate' || new URL(req.url).origin !== self.location.origin) return;
  event.stopImmediatePropagation();
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const fresh = fetch('./', { cache: 'no-cache' }).then(async (res) => {
      if (res && res.ok) await cache.put('./', (await unredirect(res)).clone());
      return res;
    }).catch(() => null);
    const cached = await cache.match('./');
    if (cached) { event.waitUntil(fresh); return unredirect(cached); }
    return (await fresh.then(unredirect)) || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Same-origin: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((response) => {
          // Cache successful responses
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback to index for navigation
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});
