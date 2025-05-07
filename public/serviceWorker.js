// Service Worker已被禁用
// 本文件仅作为占位符保留，不执行任何缓存操作

self.addEventListener('install', (event) => {
  // 立即激活，不执行任何缓存操作
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 清理所有现有缓存
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('删除缓存:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('所有缓存已删除');
      return self.clients.claim();
    })
  );
});

// 不拦截任何请求，让浏览器正常处理
self.addEventListener('fetch', (event) => {
  // 不使用event.respondWith，让浏览器默认处理所有请求
}); 