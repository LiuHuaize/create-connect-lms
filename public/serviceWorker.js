// 为应用程序定义一个缓存版本
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'connect-lms-cache-' + CACHE_VERSION;
const API_CACHE_NAME = 'connect-lms-api-cache-' + CACHE_VERSION;

// 需要缓存的静态资源列表
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/assets/vendor.js',
  '/assets/ui.js',
  '/assets/blocknote.js'
];

// Service Worker安装后缓存指定的静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker安装中...');
  
  // 强制立即激活，不等待旧的Service Worker终止
  self.skipWaiting();
  
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
  const url = new URL(event.request.url);
  
  // 排除不支持缓存的URL协议
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // 不处理非http和https请求，让浏览器默认处理
  }
  
  // 判断是否为API请求但不是认证相关请求
  const isApiRequest = url.pathname.includes('/rest/v1/') || 
                        url.hostname.includes('supabase.co');
  
  // 判断是否为认证相关请求
  const isAuthRequest = url.pathname.includes('/auth/v1/');
  
  // 对认证请求直接使用网络，不缓存
  if (isAuthRequest) {
    event.respondWith(fetch(event.request));
  }
  // 对API请求使用不同的缓存策略
  else if (isApiRequest) {
    // 只缓存GET请求
    if (event.request.method === 'GET') {
      event.respondWith(networkFirstThenCache(event.request));
    } else {
      // 非GET请求直接走网络
      event.respondWith(fetch(event.request));
    }
  } else {
    // 对静态资源使用缓存优先策略
    event.respondWith(cacheFirstThenNetwork(event.request));
  }
});

// 网络优先策略 - 适用于API请求
async function networkFirstThenCache(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // 首先尝试从网络获取
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取，复制一份存入缓存
    if (networkResponse.ok) {
      // 确保只缓存HTTP/HTTPS请求
      const url = new URL(request.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.error('缓存请求失败:', cacheError);
        }
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('网络请求失败，尝试从缓存获取', request.url);
    
    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 如果缓存也没有，则抛出错误
    throw error;
  }
}

// 缓存优先策略 - 适用于静态资源
async function cacheFirstThenNetwork(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // 首先尝试从缓存获取
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 缓存中没有，则从网络获取
  try {
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取，复制一份存入缓存
    if (networkResponse.ok) {
      // 确保只缓存HTTP/HTTPS请求
      const url = new URL(request.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        try {
          await cache.put(request, networkResponse.clone());
        } catch (cacheError) {
          console.error('缓存请求失败:', cacheError);
        }
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('网络请求失败，无法获取资源', request.url);
    throw error;
  }
}

// 当安装新版本Service Worker时，激活它并清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker激活中...');
  
  const cacheWhitelist = [CACHE_NAME, API_CACHE_NAME];
  
  // 立即接管所有页面
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('删除旧缓存', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即激活并接管所有客户端
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker现已激活并接管所有客户端');
    })
  );
}); 