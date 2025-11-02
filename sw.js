
const CACHE_NAME = 'secure-vault-cache-v1';

// On install, cache essential assets (or just prepare cache).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Service Worker installed and cache opened.');
      // Pre-caching is difficult with hashed asset names from Vite.
      // We will cache on the fly during fetch events.
    })
  );
});

// On activate, clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// On fetch, use a cache-then-network strategy for most requests.
self.addEventListener('fetch', event => {
  // Don't cache API calls to our function proxy
  if (event.request.url.includes('/.netlify/functions/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Use a "stale-while-revalidate" like strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If we got a valid response, update the cache
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('Fetch failed; returning offline page instead.', err);
            // Optionally, return a fallback offline page from cache
            // return caches.match('/offline.html');
        });
        
        // Return cached response immediately if available, otherwise wait for fetch.
        return response || fetchPromise;
      });
    })
  );
});
