'use strict';

const CACHE_NAME = 'te-wedding-20261129-v228';
const NETWORK_TIMEOUT_MS = 4500;

// 僅預快取公開首頁必要資源（嚴格排除任何隱藏頁或測試頁檔案名稱）
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css?v=20261127l',
  './script.js?v=20261127l',
  './games.js?v=20261127a',
  './seating-chart.jpg?v=20261122m',
  './video/wedding-video-1-poster.jpg',
  './photos/avatar-tom.jpg',
  './photos/avatar-eunice.jpg',
];

// 僅允許快取的公開靜態資源白名單（防止帶參數網址或敏感頁面寫入 Cache Storage）
function isCacheablePublicAsset(urlObj) {
  if (urlObj.searchParams.has('k')) return false;

  if (
    urlObj.hostname === 'fonts.googleapis.com' ||
    urlObj.hostname === 'fonts.gstatic.com'
  ) {
    return true;
  }

  if (urlObj.origin !== self.location.origin) {
    return false;
  }

  const p = urlObj.pathname;
  return (
    p.endsWith('/') ||
    p.endsWith('/index.html') ||
    p.endsWith('/style.css') ||
    p.endsWith('/script.js') ||
    p.endsWith('/games.js') ||
    p.endsWith('/seating-chart.jpg') ||
    p.endsWith('/video/wedding-video-1-poster.jpg') ||
    p.endsWith('/photos/avatar-tom.jpg') ||
    p.endsWith('/photos/avatar-eunice.jpg')
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let urlObj;
  try {
    urlObj = new URL(request.url);
  } catch (_e) {
    return;
  }

  // 影音與 Range 請求（例如 iOS Safari 串流 music.m4a / wedding-video-1.mp4）交由瀏覽器原生網路層處理，避免 SW 超時或 206 Partial Content 例外
  if (
    request.headers.has('range') ||
    urlObj.pathname.endsWith('.mp3') ||
    urlObj.pathname.endsWith('.m4a') ||
    urlObj.pathname.endsWith('.mp4') ||
    urlObj.pathname.includes('/audio/')
  ) {
    return;
  }

  if (!isCacheablePublicAsset(urlObj)) {
    return;
  }

  // Network-First 策略：有網路時優先抓最新版並更新快取；慢網逾時則立即回傳快取，同時背景完成網路抓檔並更新快取
  const networkPromise = fetch(request).then((networkResponse) => {
    if (
      networkResponse &&
      (networkResponse.status === 200 || networkResponse.type === 'opaque')
    ) {
      const cloned = networkResponse.clone();
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(request, cloned))
        .catch(() => {});
    }
    return networkResponse;
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT_MS);
  });

  event.waitUntil(networkPromise.catch(() => {}));

  event.respondWith(
    Promise.race([networkPromise, timeoutPromise]).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const exactMatch = await cache.match(request);
      if (exactMatch) return exactMatch;

      const ignoreSearchMatch = await cache.match(request, { ignoreSearch: true });
      if (ignoreSearchMatch) return ignoreSearchMatch;

      if (request.mode === 'navigate') {
        const fallbackIndex = await cache.match('./index.html', { ignoreSearch: true });
        if (fallbackIndex) return fallbackIndex;
      }
      return networkPromise;
    })
  );
});
