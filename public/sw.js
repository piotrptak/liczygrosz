/* LiczyGrosz service worker. __CACHE_VERSION__, __BASE_URL__ and __PRECACHE__ are filled in by scripts/postbuild-web.mjs. */
const CACHE = 'liczygrosz-__CACHE_VERSION__';
const BASE = '__BASE_URL__/';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('liczygrosz-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cross-origin isolation is required for SharedArrayBuffer, which expo-sqlite uses on the web.
const isolate = (response) => {
  if (!response || response.status === 0 || response.type === 'opaque') return response;
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    // Network first so updates arrive quickly; the SPA shell answers every route when offline.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(BASE, copy));
            return isolate(response);
          }
          return caches.match(BASE).then((cached) => isolate(cached || response));
        })
        .catch(() => caches.match(BASE).then(isolate))
    );
    return;
  }

  // Build output is content-hashed, so cache first is safe.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return isolate(cached);
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return isolate(response);
      });
    })
  );
});
