const CACHE_NAME = "fkg-bebas-pustaka-v2";
const APP_SHELL = ["/manifest.webmanifest", "/logo.webp", "/favicon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // jangan cache POST server functions

  const url = new URL(request.url);

  // Aset statis bertanda hash (JS/CSS build output) & gambar -> cache-first
  if (/\.(js|css|png|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          }),
      ),
    );
    return;
  }

  // Navigasi HTML (SSR) -> network-first, fallback ke cache kalau offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request)),
    );
  }
});
