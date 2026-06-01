const CACHE = "thai-helper-v4";
const ASSETS = [
  "/manifest.webmanifest",
  "/assets/app-logo-new-cutout.png",
  "/assets/paotang-logo.png",
  "/assets/support-qr.jpg",
  "/assets/support-illustration.png",
  "/assets/tips-illustration.png",
  "/assets/tct_logo.png",
  "/assets/tct_6040.svg",
  "/assets/mascot-vector-animated.gif",
  "/assets/mascot-vector-cutout.png",
  "/assets/mascot-ref.png",
  "/assets/calendar-ref.png",
  "/assets/hourglass-ref.png",
  "/assets/install-android.png",
  "/assets/install-ios.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(ASSETS).catch(() => undefined)
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
