// Service Worker for Web Push Notifications
// Handles incoming push events and notification click actions

// Take over from any older SW immediately so PWA users get fixes without
// having to fully close every window first.
self.addEventListener('install', function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

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

// Browsers (especially iOS) occasionally rotate or invalidate the push
// subscription endpoint. When that happens this event fires inside the SW
// and we have a brief window to silently re-subscribe. Without this the
// row in `push_subscriptions` goes stale and the device stops getting
// pushes until the user manually re-enables them.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

self.addEventListener('pushsubscriptionchange', function (event) {
  event.waitUntil(
    (async () => {
      try {
        const res = await fetch('/api/push/vapid-key');
        if (!res.ok) return;
        const { key } = await res.json();
        if (!key) return;
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const json = newSub.toJSON();
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: json.endpoint,
            p256dh: json.keys && json.keys.p256dh,
            auth: json.keys && json.keys.auth,
          }),
        });
      } catch (err) {
        // Best-effort recovery; nothing more we can do from the SW.
      }
    })()
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
