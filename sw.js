const BUILD_ID = '__BUILD_ID__';
const PRECACHE = __PRECACHE__;
const SCOPE = self.registration.scope;
const CACHE_PREFIX = `ai-preschool-studio:${encodeURIComponent(SCOPE)}:`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const INDEX_URL = new URL('./index.html', SCOPE).href;
const ROOT_URL = new URL('./', SCOPE).href;
const STATIC_URLS = new Set(PRECACHE.map(path => new URL(path, SCOPE).href));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if ((await caches.keys()).includes(CACHE_NAME)) {
      const existing = await caches.open(CACHE_NAME);
      if ((await Promise.all([...STATIC_URLS].map(url => existing.match(url)))).every(Boolean)) return;
      await caches.delete(CACHE_NAME);
    }
    try {
      // Fetch and validate the complete release before making any cache entries.
      const entries = await Promise.all([...STATIC_URLS].map(async url => {
        const response = await fetch(new Request(url, {cache: 'reload', credentials: 'omit', redirect: 'error'}));
        if (!response.ok || response.type === 'opaque' || response.redirected) {
          throw new Error('The complete offline release could not be downloaded.');
        }
        // Drain each download now so queued requests can reuse bounded browser connections.
        const body = await response.arrayBuffer();
        return [url, new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        })];
      }));
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(entries.map(([url, response]) => cache.put(url, response)));
      // Deliberately wait for explicit confirmation instead of skipWaiting here.
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== new URL(SCOPE).origin || url.search || !STATIC_URLS.has(url.href)) return;
  // The shell and every asset come from this worker's release, never a newer network release.
  const key = request.mode === 'navigate' && (url.href === ROOT_URL || url.href === INDEX_URL) ? INDEX_URL : url.href;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(key) || new Response('Offline release unavailable. Reconnect and reload to repair the app cache.', {
      status: 503,
      headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}
    });
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  } else if (event.data?.type === 'GET_VERSION' && event.ports?.[0]) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheReady = (await Promise.all([...STATIC_URLS].map(url => cache.match(url)))).every(Boolean);
      event.ports[0].postMessage({type: 'VERSION', buildId: BUILD_ID, cacheReady});
    })());
  }
});
