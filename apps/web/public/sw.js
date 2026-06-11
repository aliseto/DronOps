/* global self, caches, fetch, URL */
/* DronOps service worker (P0 offline shell). Conservative by design for a
 * compliance system: NO caching of authenticated record data — only the
 * offline fallback page and static icons. Capture queueing lives in
 * IndexedDB (client), not here. */
const CACHE = "dronops-shell-v1";
const SHELL = ["/offline", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  if (new URL(req.url).pathname === "/icon.svg") {
    event.respondWith(caches.match(req).then((hit) => hit ?? fetch(req)));
  }
});
