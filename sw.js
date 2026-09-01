const CACHE_NAME = 'viaje-europa-26-v2';
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
  // Clima: siempre red, sin cachear
  if (event.request.url.indexOf('open-meteo.com') !== -1) {
    event.respondWith(fetch(event.request).catch(function(){ return new Response('{}', {headers:{'Content-Type':'application/json'}}); }));
    return;
  }
  // Todo lo demás (HTML, manifest): red primero para traer siempre lo último,
  // y si no hay conexión, se usa lo último que quedó guardado en caché.
  event.respondWith(
    fetch(event.request).then(function(response){
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      return response;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
