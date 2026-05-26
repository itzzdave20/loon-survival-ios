const CACHE_NAME = "loon-survival-web-v3";
const scope = self.registration.scope;
const asset = path => new URL(path, scope).href;
const resourceBase = scope.endsWith("/webapp/") ? new URL("../", scope).href : scope;
const resource = path => new URL(path, resourceBase).href;
const ASSETS = [
  asset("./"),
  asset("index.html"),
  asset("styles.css"),
  asset("app.js"),
  asset("manifest.webmanifest"),
  asset("icons/apple-touch-icon.png"),
  asset("icons/icon-192.png"),
  asset("icons/icon-512.png"),
  resource("resources/maps/arena_map.txt"),
  resource("resources/objects/arena_objects.csv"),
  resource("resources/textures/wall/2.png"),
  resource("resources/textures/wall/3.png"),
  resource("resources/textures/wall/5.png"),
  resource("resources/textures/sky/cloudy_sky.png"),
  resource("resources/textures/controller/gun.png"),
  resource("resources/textures/controller/gun_firing.png"),
  resource("resources/textures/controller/skull.png"),
  resource("resources/sprites/npc/caco_demon/0.png"),
  resource("resources/sprites/animated_sprites/red_light/0.png")
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
    )
  );
});
