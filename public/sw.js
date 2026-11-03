// Defensive service worker: this site does not use one.
// It exists only so that any stale service worker registration on this
// origin (e.g. from a previous project served on the same port) gets
// replaced by this script, which unregisters itself on activation.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll())
  );
});
