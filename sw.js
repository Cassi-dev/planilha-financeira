const cacheName = 'planilha-v1';
const staticAssets = ['./', './index.html', './style.css', './script.js'];

self.addEventListener('install', async e => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});