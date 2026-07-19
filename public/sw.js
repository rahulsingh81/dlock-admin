// Dlock Admin service worker — SCOPED TO /admin/ ONLY.
// It never intercepts requests for the main website (dlockservices.com/…),
// only pages/assets under /admin/. This makes the admin installable as an app
// and lets the shell load when offline, without touching the public site.
const CACHE = 'dlock-admin-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin GET requests under /admin/. Everything else
  // (the website at /, API calls to /api/…) passes straight through.
  if (req.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/admin/')) {
    return;
  }
  // Network-first so the admin is always fresh online; fall back to cache offline.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('/admin/index.html')))
  );
});
