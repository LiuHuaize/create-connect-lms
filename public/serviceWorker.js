// 为应用程序定义一个缓存版本
const CACHE_NAME = 'connect-lms-cache-v1';
const API_CACHE_NAME = 'connect-lms-api-cache-v1';

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
  
  // 判断是否为API请求
  const isApiRequest = url.pathname.includes('/rest/v1/') || 
                        url.hostname.includes('supabase.co') || 
                        url.pathname.includes('/auth/v1/');
  
  // 对API请求使用不同的缓存策略
  if (isApiRequest) {
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
    const networkResponse = await fetch(request);
    
    // 如果成功获取，复制一份存入缓存
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
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
    const networkResponse = await fetch(request);
    
    // 如果成功获取，复制一份存入缓存
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
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
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker现已激活并接管所有客户端');
      return self.clients.claim();
    })
  );
}); 