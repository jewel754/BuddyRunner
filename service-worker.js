const CACHE_NAME = 'buddyrunner-v3';
const urlsToCache = [
  '/BuddyRunner/',
  '/BuddyRunner/index.html',
  '/BuddyRunner/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js',
  'https://cdn-icons-png.flaticon.com/512/726/726048.png'
];

// Install service worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch with network first, then cache fallback
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like Firebase
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('fonts.googleapis.com') &&
      !event.request.url.includes('gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'New notification from BuddyRunner',
    icon: 'https://cdn-icons-png.flaticon.com/512/726/726048.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/726/726048.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('BuddyRunner', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/BuddyRunner/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-missions') {
    event.waitUntil(syncMissions());
  }
});

async function syncMissions() {
  // Implement offline sync logic here
  console.log('Syncing missions in background...');
}
