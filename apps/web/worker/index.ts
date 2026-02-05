// Custom service worker code for push notifications
// This will be included by next-pwa

// Listen for push events
self.addEventListener('push', function(event: any) {
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
    (self as any).registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event: any) {
  console.log('[Service Worker] Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList: any[]) {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if ((self as any).clients.openWindow) {
          return (self as any).clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event: any) {
  console.log('[Service Worker] Notification closed:', event);
});

console.log('[Service Worker] Loaded with push notification support');

export {};
