
const CACHE_NAME = 'mvault-static-v2';
const DATA_CACHE_NAME = 'mvault-data-v1';

// Assets to cache immediately on installation
const PRE_CACHE_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/manifest.json',
  '/metadata.json',
  '/components/icons.tsx',
  '/components/Sidebar.tsx',
  '/components/Shared.tsx',
  '/components/AuthScreen.tsx',
  '/components/ModalController.tsx',
  '/components/HistoryModal.tsx',
  '/components/InfoModals.tsx',
  '/components/ErrorBoundary.tsx',
  '/components/forms/AccountForm.tsx',
  '/components/forms/NoteForm.tsx',
  '/components/forms/EventForm.tsx',
  '/components/forms/TodoForm.tsx',
  '/components/cards/AccountCard.tsx',
  '/components/cards/NoteCard.tsx',
  '/components/cards/EventItem.tsx',
  '/components/cards/TodoItem.tsx',
  '/views/DashboardView.tsx',
  '/views/VaultView.tsx',
  '/views/NotesView.tsx',
  '/views/EventsView.tsx',
  '/views/TodosView.tsx',
  '/hooks/useLocalStorage.ts',
  '/hooks/useClipboard.ts',
  '/utils/security.ts',
  '/services/db.ts'
];

// External dependencies from CDN - these are versioned so we use Cache-First
const EXTERNAL_DEPENDENCIES = [
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/dexie@^4.2.1'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching app shell');
      // We don't fail the install if external deps fail (they might be dynamic)
      cache.addAll(PRE_CACHE_ASSETS);
      return cache.addAll(EXTERNAL_DEPENDENCIES).catch(err => console.warn('SW: Some external deps failed to pre-cache', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('SW: Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests that aren't our specific CDNs
  const isCdn = url.hostname.includes('aistudiocdn.com') || url.hostname.includes('tailwindcss.com');
  const isLocal = url.origin === self.location.origin;

  if (!isLocal && !isCdn) return;

  // Navigation requests: Network-First, fallback to Cache (Offline Mode)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // CDN Dependencies: Cache-First (they are immutable/versioned)
  if (isCdn) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(networkResponse => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      })
    );
    return;
  }

  // Local Assets: Stale-While-Revalidate (ensure fast load, but update in background)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
          // If network fails, the cachedResponse (if any) is already being returned
      });
      return cachedResponse || fetchPromise;
    })
  );
});
