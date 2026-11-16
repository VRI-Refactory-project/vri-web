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
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      // A chat message is not needed as a popup if the person is already looking at SignConnect.
      const lookingAtApp = windows.some((w) => w.visibilityState === 'visible');
      if (message.category === 'chat_message' && lookingAtApp) return;

      return self.registration.showNotification(message.title || 'SignConnect', {
        body: message.body || '',
        icon: '/logo.png',
        badge: '/favicon.png',
        tag: message.notification_id ? `notification-${message.notification_id}` : undefined,
        data: message.data || {},
      });
    }),
  );
});

// Tapping the notification brings SignConnect to the front, or opens it if it is closed.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
      // No link in the notification (the old ones): behave as before.
      if (!url) return windows.length > 0 ? windows[0].focus() : self.clients.openWindow('/');

      if (windows.length === 0) return self.clients.openWindow(url);
      try {
        await windows[0].navigate(url);
      } catch {
        // An older tab this file does not control cannot be moved, so open the chat in a new one.
        return self.clients.openWindow(url);
      }
      return windows[0].focus();
    }),
  );
});
