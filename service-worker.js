const CACHE_NAME = "vocabulary-pwa-v4";
const AUDIO_CACHE = "vocabulary-audio-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./vocab/catalogue.json",
  "./vocabulary-icon-180.png",
  "./vocabulary-icon-192.png",
  "./vocabulary-icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k =>
        k !== CACHE_NAME && k !== AUDIO_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if(event.request.method !== "GET") return;

  const url=new URL(event.request.url);
  const networkFirst =
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/manifest.json") ||
    url.pathname.endsWith("/vocab/catalogue.json");

  if(networkFirst) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy=response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request,copy));
        return response;
      }).catch(()=>caches.match(event.request).then(r=>r||caches.match("./index.html")))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if(cached) return cached;

        return fetch(event.request).then(response => {
          if(response.ok) {
            const copy=response.clone();
            const cacheName=url.pathname.match(/\.(wav|mp3|m4a|ogg)$/i) ?
                AUDIO_CACHE : CACHE_NAME;
            caches.open(cacheName).then(cache =>
              cache.put(event.request,copy));
          }
          return response;
        });
      })
    );
  }
});
