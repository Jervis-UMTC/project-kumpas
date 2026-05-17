const CACHE_NAME = 'project-kumpas-v4';
const AUDIO_MANIFEST = '/audio/ceb/manifest.json';
const CORE_ASSETS = ['/', '/index.html', '/manifest.json', '/kumpas-logo.png', AUDIO_MANIFEST];

async function findInitialAssets() {
  const response = await fetch('/index.html', { cache: 'reload' });
  const html = await response.text();
  const buildAssets = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((asset) => asset.startsWith('/assets/'));

  return [...new Set([...CORE_ASSETS, ...buildAssets])];
}

async function findAudioAssets() {
  const response = await fetch(AUDIO_MANIFEST, { cache: 'reload' });

  if (!response.ok) {
    return [];
  }

  const manifest = await response.json();
  return Array.isArray(manifest.assets) ? manifest.assets : [];
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const assets = await findInitialAssets().catch(() => CORE_ASSETS);
      await cache.addAll(assets);

      const audioAssets = await findAudioAssets().catch(() => []);
      await Promise.all(audioAssets.map((asset) => cache.add(asset).catch(() => undefined)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('/'));
    }),
  );
});
