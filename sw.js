'use strict';

const CACHE_NAME = 'te-wedding-20261129-v4';
const NETWORK_TIMEOUT_MS = 2500;

// 僅預快取公開首頁必要資源（嚴格排除任何隱藏頁或測試頁檔案名稱）
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css?v=20261111a',
  './script.js?v=20261111a',
  './seating-chart.jpg?v=20261109a',
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
    p.endsWith('/seating-chart.jpg')
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

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let urlObj;
  try {
    urlObj = new URL(request.url);
  } catch (_e) {
    return;
  }

  if (!isCacheablePublicAsset(urlObj)) {
    return;
  }

  // Network-First 策略：有網路時永遠抓取最新版本並更新快取；斷網或逾時才自動退回離線快取
  event.respondWith(
    fetchWithTimeout(request, NETWORK_TIMEOUT_MS)
      .then((networkResponse) => {
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
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const exactMatch = await cache.match(request);
        if (exactMatch) return exactMatch;

        const ignoreSearchMatch = await cache.match(request, { ignoreSearch: true });
        if (ignoreSearchMatch) return ignoreSearchMatch;

        if (request.mode === 'navigate') {
          const fallbackIndex = await cache.match('./index.html', { ignoreSearch: true });
          if (fallbackIndex) return fallbackIndex;
        }
        throw new Error('Offline and no cached asset available');
      })
  );
});
