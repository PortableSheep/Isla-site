// Service Worker for Web Push Notifications
// Handles incoming push events and notification click actions

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'New notification', body: event.data.text(), link: '/' };
  }

  const title = payload.title || 'Isla';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { link: payload.link || '/' },
    tag: payload.tag || 'isla-notification',
    renotify: true,
  };

  // Suppress the push notification if the user is already looking at the site
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clients) {
        const isVisible = clients.some(
          (client) => client.visibilityState === 'visible'
        );
        if (isVisible) return;
        return self.registration.showNotification(title, options);
      })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clients) {
        // Focus an existing window if one is open
        for (const client of clients) {
          if ('focus' in client) {
            client.navigate(link);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(link);
        }
      })
  );
});
