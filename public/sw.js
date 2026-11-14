// Shows SignConnect notifications when the site is closed (Web Push).
// The browser wakes this file up when the server sends a push. It is registered by src/services/webPush.ts.

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }

  event.waitUntil(
    self.registration.showNotification(message.title || 'SignConnect', {
      body: message.body || '',
      icon: '/logo.png',
      badge: '/favicon.png',
      // The same notification twice replaces itself instead of piling up.
      tag: message.notification_id ? `notification-${message.notification_id}` : undefined,
      data: message.data || {},
    }),
  );
});

// Tapping the notification brings SignConnect to the front, or opens it if it is closed.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      if (windows.length > 0) return windows[0].focus();
      return self.clients.openWindow('/');
    }),
  );
});
