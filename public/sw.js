const CACHE_NAME = 'citymint-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept Requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (e.g. POST or Supabase API calls)
  if (request.method !== 'GET') return;

  // Skip browser extension requests or Supabase connection requests
  if (!url.protocol.startsWith('http')) return;
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api')) {
    return; // Let browser handle network request natively
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return from cache, but fetch fresh copy in background for non-static files (stale-while-revalidate)
        if (!url.pathname.includes('/_next/static/')) {
          fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          }).catch(() => {/* Ignore background fetch errors */});
        }
        return cachedResponse;
      }

      // Network fallback
      return fetch(request).then((networkResponse) => {
        // Cache static Next.js assets on the fly
        if (
          networkResponse.status === 200 &&
          (url.pathname.includes('/_next/static/') || url.pathname.includes('/icons/'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        // Return root path for page navigation fallbacks if offline
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
