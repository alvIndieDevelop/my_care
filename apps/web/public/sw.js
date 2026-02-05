// Import workbox for caching strategies
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Initialize workbox
workbox.setConfig({ debug: false });

// Precache static assets
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Cache strategies (same as next-pwa config)
workbox.routing.registerRoute(
  /^https:\/\/.*\.supabase\.co\/.*/i,
  new workbox.strategies.NetworkFirst({
    cacheName: 'supabase-api',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

workbox.routing.registerRoute(
  /\.(?:js|css)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 32,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// ===== PUSH NOTIFICATION HANDLING =====

// Listen for push events
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push received:', event);
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    data = {
      title: 'MyCare',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
    };
  }
  
  const title = data.title || 'MyCare';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-72x72.png',
    tag: data.tag || 'mycare-notification',
    data: {
      url: data.url || '/',
      ...data.data,
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed:', event);
});

console.log('[Service Worker] Loaded with push notification support');
