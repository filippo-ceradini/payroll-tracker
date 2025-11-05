const CACHE_NAME = 'payroll-tracker-v1';

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
            return fetch(url)
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
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, try to serve index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(BASE_PATH + 'index.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

