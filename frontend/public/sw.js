// JobTrackId Service Worker (PWA)
// Versi cache statis untuk performa cepat dan keandalan offline

const CACHE_NAME = 'jobtrack-pwa-v1';
const PRECACHE_ASSETS = [
  '/app.html',
  '/icon-logo.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Jangan cache panggilan API ke backend atau permintaan skema non-http
  if (
    requestUrl.pathname.startsWith('/api/') ||
    event.request.method !== 'GET' ||
    !event.request.url.startsWith('http')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stale-While-Revalidate untuk aset frontend
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika offline dan mengakses halaman HTML navigasi, berikan app.html dari cache
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/app.html');
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
