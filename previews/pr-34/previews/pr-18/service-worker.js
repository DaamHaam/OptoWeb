
const CACHE_NAME = 'opto-vr-cache-v0.70';
const URLS_TO_CACHE = [
  'index.html',
  'styles.css',
  'main.js',
  'manifest.json',
  'modules/targetPointer.js',
  'modules/goNoGo.js',
  'modules/stroop.js',
  'visuals/optokinetic.js',
  'visuals/opticalFlow.js',
  'utils/colorPalettes.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
