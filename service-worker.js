const CACHE_NAME = 'habit-tracker-cache-v1';
const RESOURCES_TO_CACHE = [
    '/',
    '/index.html',

    '/css/settings.css',
    '/css/modals.css',
    '/css/main.css',
    '/css/habitList.css',

    '/index.js',
    '/habitTracker.js',
    '/workoutManager.js',
    '/settings.js',
    '/app.js',
    '/notification.js',
    '/storage.js',
    
    '/manifest.json',
];

// Delete old caches
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

// Install event: cache all files
self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(RESOURCES_TO_CACHE);
      })
    );
  });

// Fetch event: serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the request is successful, update the cache
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // If network fetch fails, return the cached version
          return caches.match(event.request);
        })
    );
  });
  
