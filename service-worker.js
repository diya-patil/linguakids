const CACHE_NAME = "linguakids-cache-v9.1"; // Incremented version
const APP_VERSION = "9.1"; // version reference for debugging

const urlsToCache = [
  "/",
  "/index.html",
  "/welcome.html",
  "/english.html",
  "/englevel2.html",
  "/englevel3.html",
  "/engames.html",
  "/progress.html",
  "/progress.js",
  "/hindi.html",
  "/hinlevel2.html",
  "/hinlevel3.html",
  "/hingames.html",
  "/hinprogress.html",
  "/marathi.html",
  "/mrlevel2.html",
  "/mrlevel3.html",
  "/mrgames.html",
  "/mrprogress.html",
  "/mrprogress.js",
  "/chinese.html",
  "/chlevel2.html",
  "/chlevel3.html",
  "/chgames.html",
  "/chprogress.html",
  "/chprogress.js",
  "/german.html",
  "/grgames.html",
  "/grlevel2.html",
  "/grlevel3.html",
  "/teacher-portal.html",
  "/study.html",
  "/language-selection.html",
  "/grprogress.js",
  "/chatbot.js",
  "/admin-portal.html",
  "/script.js",
  "/offline.html",
  // Add missing critical files
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
  // Add CSS and font fallbacks
  "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Comic+Neue:wght@400;700&family=Baloo+2:wght@600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Quicksand:wght@400;500;600&display=swap",
  "https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@700;800;900&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
];

// INSTALL
self.addEventListener("install", (event) => {
  console.log(`Service Worker ${APP_VERSION} installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell and assets');
        // Use cache.addAll with error handling for each resource
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err.message);
              // Continue with other resources even if one fails
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('All resources processed for caching');
        // Activate new service worker immediately
        return self.skipWaiting();
      })
  );
});

// FETCH
self.addEventListener("fetch", (event) => {
  const requestURL = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Handle Google Fonts and Font Awesome specifically
  if (requestURL.hostname.includes('fonts.googleapis.com') || 
      requestURL.hostname.includes('fonts.gstatic.com') ||
      requestURL.hostname.includes('cdnjs.cloudflare.com')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(networkResponse => {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, networkResponse.clone());
                  return networkResponse;
                });
            })
            .catch(() => {
              // If font fails to load, return a minimal response
              return new Response('', { status: 200, statusText: 'OK' });
            });
        })
    );
    return;
  }

  // Handle API requests or external resources
  if (requestURL.origin !== location.origin) {
    // For external resources, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetch(event.request))
        .catch(() => new Response('', { status: 200 }))
    );
    return;
  }

  // Never cache manifest or icons? Actually we should cache them for offline
  if (requestURL.pathname.includes("manifest.json") ||
      requestURL.pathname.includes("icon-192") ||
      requestURL.pathname.includes("icon-512")) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => cachedResponse || fetch(event.request))
    );
    return;
  }

  // Network-first for HTML pages with better offline fallback
  if (event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Only cache successful responses
          if (networkResponse.ok) {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If page not in cache, try to return offline.html
            return caches.match("/offline.html").then(offlineResponse => {
              if (offlineResponse) {
                return offlineResponse;
              }
              // Last resort - return a simple offline message
              return new Response(
                '<!DOCTYPE html><html><head><title>Offline</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui;text-align:center;padding:2rem;background:#f0f0f0}h1{color:#666}</style></head><body><h1>🔌 You\'re offline</h1><p>Please check your internet connection.</p><button onclick="window.location.href=\'/\'">Try Home</button></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          });
        })
    );
    return;
  }

  // Cache-first for other assets (images, JS, CSS)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request)
          .then((networkResponse) => {
            // Only cache successful responses
            if (networkResponse.ok) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.warn('Fetch failed:', error);
            // Return a fallback for images
            if (event.request.destination === 'image') {
              return new Response(
                '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="10" y="55" font-family="system-ui" font-size="40">🖼️</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            throw error;
          })
      );
    })
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  console.log(`Service Worker ${APP_VERSION} activating...`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated. Taking control of clients...');
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that a new version is active
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: APP_VERSION
            });
          });
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_DATA') {
    // Handle data sync requests from clients
    console.log('Sync requested while online');
    // You could trigger background sync here
  }
});

// Background sync for offline data (if needed)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData());
  }
});

async function syncProgressData() {
  // Implement progress data sync when back online
  console.log('Syncing progress data...');
  // This would retrieve stored IndexedDB data and sync with server
}