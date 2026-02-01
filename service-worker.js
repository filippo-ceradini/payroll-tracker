// Use timestamp-based cache versioning for automatic updates
const CACHE_VERSION = 'v10';
const CACHE_NAME = `payroll-tracker-${CACHE_VERSION}`;

// Get base path from service worker location
const getBasePath = () => {
  const path = self.location.pathname;
  const swIndex = path.lastIndexOf('/service-worker.js');
  if (swIndex === -1) return '/';
  const basePath = path.substring(0, swIndex);
  return basePath.endsWith('/') ? basePath : basePath + '/';
};

const BASE_PATH = getBasePath();

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with base path:', BASE_PATH);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to cache files, but don't fail if some fail
        const urlsToCache = [
          BASE_PATH + 'index.html',
          BASE_PATH + 'styles.css',
          BASE_PATH + 'app.js',
          BASE_PATH + 'manifest.json',
          BASE_PATH + 'icon-192.png',
          BASE_PATH + 'icon-512.png'
        ];
        
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url, { cache: 'no-cache' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
              })
              .catch(err => {
                console.warn('Failed to cache:', url, err);
              });
          })
        );
      })
      .catch(err => {
        console.error('Cache setup failed:', err);
      })
  );
  // Force the new service worker to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first for API requests (don't cache API responses)
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-First Strategy for App Shell (HTML, CSS, JS, Images)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response immediately if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache valid responses for next time
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old cache versions
          if (cacheName !== CACHE_NAME && cacheName.startsWith('payroll-tracker-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately to activate the new service worker
      return self.clients.claim();
    })
  );
});
