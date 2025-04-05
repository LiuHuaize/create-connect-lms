// 为应用程序定义一个缓存版本
const CACHE_NAME = 'connect-lms-cache-v1';

// 需要缓存的静态资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

// Service Worker安装后缓存指定的静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('已打开缓存');
        return cache.addAll(urlsToCache);
      })
  );
});

// 当浏览器请求资源时，首先查看是否有缓存
self.addEventListener('fetch', (event) => {
  // 判断是否为API请求，对API请求使用更细致的缓存控制
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    // 对于API请求，使用网络优先、缓存备用策略
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 对成功的响应进行缓存
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // 仅缓存GET请求
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时从缓存获取
          return caches.match(event.request);
        })
    );
  } else {
    // 对于静态资源，使用缓存优先、网络备用策略
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // 若缓存中找到响应，则返回缓存的响应
          if (response) {
            return response;
          }
          
          // 否则发起网络请求
          return fetch(event.request).then(
            (response) => {
              // 确保响应有效
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // 克隆响应，因为响应是流，只能使用一次
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            }
          );
        })
    );
  }
});

// 当安装新版本Service Worker时，激活它并清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 删除不在白名单中的缓存
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 