const CACHE_NAME = 'crop-v2';
const ASSETS = [
  '/OPERACIONAL9/',
  '/OPERACIONAL9/index.html',
  '/OPERACIONAL9/manifest.json',
  '/OPERACIONAL9/icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Offline', {status: 503})))
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title:'CROP', body:'Nova mensagem'};
  e.waitUntil(
    self.registration.showNotification(data.title || 'CROP', {
      body: data.body || '',
      icon: '/OPERACIONAL9/icon.png',
      badge: '/OPERACIONAL9/icon.png'
    })
  );
});
