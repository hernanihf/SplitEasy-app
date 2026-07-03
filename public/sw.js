// Minimal service worker: enables PWA installability and offers a basic
// offline fallback for navigations. Static assets are content-hashed by the
// Expo web export, so we cache them on demand rather than precaching a list.
const CACHE = 'spliteasy-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // App-shell style: serve the cached shell for navigations when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/').then((cached) => cached || caches.match(request)))
    );
    return;
  }

  // Other GETs: network-first, falling back to whatever we cached before.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Payload shape sent by the backend (pushPayload in push_service.go):
// {"title": string, "body": string, "data": {"url": string}}.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'SplitEasy', {
      body: payload.body,
      icon: '/icons/pwa-192.png',
      data: payload.data,
    })
  );
});

// Clicking the notification focuses an already-open tab on the target URL if
// one exists, otherwise opens a new one — the standard Web Push pattern,
// since a plain `clients.openWindow` would stack duplicate tabs on repeat
// clicks.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
