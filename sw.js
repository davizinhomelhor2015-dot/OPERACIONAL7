const CACHE = 'crop-v6';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Instalar — cachear assets estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Ativar — limpar caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch — network first, cache fallback
// Firebase e googleapis nunca são cacheados
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Nunca cachear Firebase, Google APIs, fontes externas
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('fonts.google')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Só cachear respostas válidas
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(e.request)
          .then(cached => cached || new Response('Offline', {
            status: 503,
            headers: {'Content-Type': 'text/plain'}
          }))
      )
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title: 'CROP', body: 'Nova mensagem'};
  e.waitUntil(
    self.registration.showNotification(data.title || 'CROP', {
      body:    data.body || '',
      icon:    './icon.png',
      badge:   './icon.png',
      vibrate: [200, 100, 200],
      tag:     'crop-notification',
      renotify: true
    })
  );
});

// Clique na notificação — abrir o app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true})
      .then(cs => {
        if (cs.length > 0) return cs[0].focus();
        return clients.openWindow('./');
      })
  );
});
