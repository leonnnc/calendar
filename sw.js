/* ============================================================
   sw.js â€” service worker del Calendario
   Estrategia: cache primero con revalidaciÃ³n en segundo plano
   (stale-while-revalidate), red de respaldo y navegaciÃ³n
   con la red primero para que las actualizaciones lleguen solas.
   IMPORTANTE: al tocar cualquier archivo de la app, subir VERSION.
   ============================================================ */

const VERSION = 'calendario-v21';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/firebase.js',
  './js/stickers.js',
  './js/emoji.js',
  './assets/fonts/fonts.css',
  './assets/fonts/caveat-normal-400-latin.woff2',
  './assets/fonts/dancing-script-normal-400-latin.woff2',
  './assets/fonts/gochi-hand-normal-400-latin.woff2',
  './assets/fonts/kalam-normal-300-latin.woff2',
  './assets/fonts/kalam-normal-400-latin.woff2',
  './assets/fonts/kalam-normal-700-latin.woff2',
  './assets/fonts/patrick-hand-normal-400-latin.woff2',
  './assets/fonts/shadows-into-light-normal-400-latin.woff2',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(SHELL.map(async (url) => {
      try {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (res && res.ok) await cache.put(url, res);
      } catch (err) {
        // Un recurso que falte no debe romper la instalaciÃ³n.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(req);
      } catch (err) {
        const cache = await caches.open(VERSION);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // La configuraciÃ³n de Firebase NO se cachea nunca: si se sirviera una
  // copia vieja, pegar tus datos no surtirÃ­a efecto y parecerÃ­a roto.
  if (url.pathname.endsWith('/js/firebase-config.js')) {
    event.respondWith((async () => {
      try {
        /* no-store: GitHub Pages cachea sus archivos unos 10 minutos, y si no,
           cambiar la clave del panel (o la configuraciÃ³n) tardarÃ­a en surtir
           efecto y parecerÃ­a que no funciona. */
        return await fetch(req, { cache: 'no-store' });
      } catch (err) {
        const cache = await caches.open(VERSION);
        return (await cache.match(req)) || Response.error();
      }
    })());
    return;
  }

  // Cache primero con revalidaciÃ³n: se responde al instante y, si hay red,
  // se refresca la copia para la prÃ³xima carga.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req);
    const fresh = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(() => null);

    if (hit) { fresh; return hit; }
    const res = await fresh;
    return res || (await cache.match(req, { ignoreSearch: true })) || Response.error();
  })());
});
