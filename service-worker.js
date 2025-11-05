// Use timestamp-based cache versioning for automatic updates
const CACHE_VERSION = 'v2';
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

  // For HTML requests, always try network first, then cache
  const acceptHeader = event.request.headers.get('accept');
  if (event.request.mode === 'navigate' || 
      (acceptHeader && acceptHeader.includes('text/html'))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request).then((response) => {
            return response || caches.match(BASE_PATH + 'index.html');
          });
        })
    );
    return;
  }

  // For other resources (CSS, JS, images), use network-first strategy
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' })
      .then((response) => {
        // Only cache successful responses
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
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

