const CACHE_NAME = 'viaje-europa-26-v1';
const ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  // Clima: siempre red primero (dato en vivo), sin romper si falla
  if (event.request.url.indexOf('open-meteo.com') !== -1) {
    event.respondWith(fetch(event.request).catch(function(){ return new Response('{}', {headers:{'Content-Type':'application/json'}}); }));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).then(function(response){
        return caches.open(CACHE_NAME).then(function(cache){
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(function(){ return cached; });
    })
  );
});
