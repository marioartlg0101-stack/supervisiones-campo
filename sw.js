const CACHE_NAME = 'supervisiones-campo-v1';
const ARCHIVOS_A_GUARDAR = [
  './',
  './index.html',
  './manifest.json'
];

// Al instalar, guarda una copia de la app en el celular
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_A_GUARDAR))
  );
});

// Limpia versiones viejas del caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: intenta con internet primero (para tener la versión más nueva),
// si no hay señal, usa la copia guardada. Así siempre abre, con o sin internet.
self.addEventListener('fetch', (event) => {
  // Las llamadas al backend (Apps Script) NUNCA se guardan en caché, siempre van directo
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return respuesta;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
  );
});
