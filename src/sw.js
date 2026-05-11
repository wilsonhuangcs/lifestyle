/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Workbox precache (replaces the generateSW manifest)
precacheAndRoute(self.__WB_MANIFEST);

// Google Fonts — cache for a year
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 })],
  })
);

// Supabase — NetworkFirst so data is fresh, with short offline fallback
registerRoute(
  ({ url }) => url.origin === 'https://dswetxilqyzvrgocqobf.supabase.co',
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 10,
  })
);

// Allow the page to trigger an immediate activation after a build update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Web Push handler ─────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'Notification', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Lifestyle';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-64x64.png',
    tag: payload.tag,
    data: payload.data || {},
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of all) {
      try {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client && targetUrl !== '/') {
            try { await client.navigate(targetUrl); } catch { /* ignored */ }
          }
          return;
        }
      } catch { /* ignored */ }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
