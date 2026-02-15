const CACHE_NAME = 'story-app-v1';
const RUNTIME_CACHE = 'story-app-runtime-v1';
const IMAGE_CACHE = 'story-app-images-v1';

// Assets to cache on install - using relative paths
const STATIC_ASSETS = [
  'index.html',
  'app.css',
  'app.bundle.js',
  'manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      // Get the base path for the service worker
      const baseUrl = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/') + 1);
      const urlsToCache = STATIC_ASSETS.map(asset => new URL(asset, self.location.origin + baseUrl).href);
      console.log('[Service Worker] URLs to cache:', urlsToCache);
      return cache.addAll(urlsToCache).catch(err => {
        console.error('[Service Worker] Cache addAll failed:', err);
        // Continue anyway, we'll cache on fetch
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network first for API calls
  if (url.origin.includes('story-api.dicoding.dev')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache first for images
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Stale-while-revalidate for other requests
  event.respondWith(staleWhileRevalidateStrategy(request));
});

// Network first strategy - for API calls
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache first strategy - for images
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Failed to fetch:', error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received:', event);
  
  let notificationData = {
    title: 'Story App',
    body: 'You have a new notification',
    icon: './images/icon-192x192.png',
    badge: './images/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: 'story-notification',
    requireInteraction: false,
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('[Service Worker] Push data:', data);
      
      notificationData = {
        title: data.title || 'New Story Added!',
        body: data.body || data.message || 'Someone shared a new story',
        icon: data.icon || './images/icon-192x192.png',
        badge: './images/icon-96x96.png',
        image: data.image || null,
        vibrate: [200, 100, 200],
        tag: data.tag || 'story-notification',
        requireInteraction: false,
        data: {
          url: data.url || './#/home',
          storyId: data.storyId || null,
        },
        actions: [
          {
            action: 'view',
            title: 'View Story',
            icon: './images/icon-view.png'
          },
          {
            action: 'close',
            title: 'Close',
            icon: './images/icon-close.png'
          }
        ]
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Default action or 'view' action
  const urlToOpen = event.notification.data?.url || '/#/home';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // If not, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync event - for offline data sync
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

// Function to sync offline stories
async function syncOfflineStories() {
  try {
    console.log('[Service Worker] Syncing offline stories...');
    
    // Open IndexedDB to get offline stories
    const db = await openDatabase();
    const offlineStories = await getOfflineStories(db);
    
    if (offlineStories.length === 0) {
      console.log('[Service Worker] No offline stories to sync');
      return;
    }

    console.log(`[Service Worker] Found ${offlineStories.length} offline stories to sync`);

    // Try to upload each offline story
    for (const story of offlineStories) {
      try {
        const formData = new FormData();
        formData.append('description', story.description);
        
        // Convert base64 to blob for photo
        if (story.photo) {
          const blob = await fetch(story.photo).then(r => r.blob());
          formData.append('photo', blob, 'photo.jpg');
        }
        
        if (story.lat && story.lon) {
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);
        }

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${story.token}`,
          },
          body: formData,
        });

        if (response.ok) {
          console.log('[Service Worker] Story synced successfully:', story.id);
          await deleteOfflineStory(db, story.id);
          
          // Notify all clients about successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'STORY_SYNCED',
              storyId: story.id
            });
          });
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync story:', error);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    throw error;
  }
}

// IndexedDB helpers for sync
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StoryAppDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getOfflineStories(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-stories'], 'readonly');
    const store = transaction.objectStore('offline-stories');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function deleteOfflineStory(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['offline-stories'], 'readwrite');
    const store = transaction.objectStore('offline-stories');
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
