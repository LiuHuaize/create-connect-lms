// 为应用程序定义一个缓存版本
const CACHE_VERSION = 'v5';
const CACHE_NAME = (self.location.port || 'default') + '-connect-lms-cache-' + CACHE_VERSION;
const API_CACHE_NAME = (self.location.port || 'default') + '-connect-lms-api-cache-' + CACHE_VERSION;

// 需要缓存的静态资源列表 - 仅缓存基本资源
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/vendor.js'
];

// 不缓存的路径列表
const noCachePaths = [
  '/auth',
  '/login',
  '/dashboard'
];

// 最小化预加载资源列表
const preloadResources = [
  '/assets/index.css'
];

// 检查URL是否应该被缓存
function shouldCache(url) {
  // 不缓存不同端口的请求
  if (self.location.port && url.port && self.location.port !== url.port) {
    return false;
  }
  
  // 检查路径是否在不缓存列表中
  for (const path of noCachePaths) {
    if (url.pathname.includes(path)) {
      return false;
    }
  }
  
  return true;
}

// Service Worker安装后缓存指定的静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker安装中...', self.location.port);
  
  // 强制立即激活，不等待旧的Service Worker终止
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('已打开缓存:', CACHE_NAME);
        // 仅缓存基本资源，避免过度缓存
        return cache.addAll(urlsToCache);
      })
  );
});

// 当浏览器请求资源时，首先查看是否有缓存
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 排除不支持缓存的URL协议
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return; // 不处理非http和https请求
  }
  
  // 检查是否应该缓存此请求
  if (!shouldCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // 判断是否为API请求或认证相关请求
  const isApiRequest = url.pathname.includes('/rest/v1/') || 
                       url.hostname.includes('supabase.co');
  const isAuthRequest = url.pathname.includes('/auth/v1/');
  
  // 对认证请求直接使用网络，永不缓存
  if (isAuthRequest) {
    event.respondWith(fetch(event.request));
  }
  // 对API请求使用网络优先策略，但缓存时间很短
  else if (isApiRequest) {
    // 只缓存GET请求
    if (event.request.method === 'GET') {
      event.respondWith(networkFirstWithShortCache(event.request));
    } else {
      // 非GET请求直接走网络
      event.respondWith(fetch(event.request));
    }
  } else {
    // 对静态资源使用网络优先策略
    event.respondWith(networkFirstThenCache(event.request));
  }
});

// 网络优先策略，但缓存时间很短 - 适用于API请求
async function networkFirstWithShortCache(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // 尝试从网络获取
  try {
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取，简单复制存入缓存，但设置很短的过期时间
    if (networkResponse.ok) {
      const url = new URL(request.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        try {
          // 创建一个新的响应，添加过期时间（1分钟）
          const clonedResponse = networkResponse.clone();
          const headers = new Headers(clonedResponse.headers);
          headers.append('sw-fetched-on', Date.now().toString());
          headers.append('sw-expires', (Date.now() + 60000).toString()); // 1分钟后过期
          
          const responseToCache = new Response(await clonedResponse.blob(), {
            status: clonedResponse.status,
            statusText: clonedResponse.statusText,
            headers: headers
          });
          
          cache.put(request, responseToCache);
        } catch (cacheError) {
          console.error('缓存请求失败:', cacheError);
        }
      }
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时，尝试从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否已过期
      const fetchedOn = cachedResponse.headers.get('sw-fetched-on');
      const expires = cachedResponse.headers.get('sw-expires');
      
      if (fetchedOn && expires) {
        if (Date.now() < parseInt(expires)) {
          return cachedResponse;
        } else {
          // 缓存已过期，删除它
          await cache.delete(request);
        }
      } else {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// 网络优先策略 - 适用于一般资源
async function networkFirstThenCache(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // 首先尝试从网络获取
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取且应该缓存此URL，复制一份存入缓存
    if (networkResponse.ok && shouldCache(new URL(request.url))) {
      try {
        await cache.put(request, networkResponse.clone());
      } catch (cacheError) {
        console.error('缓存请求失败:', cacheError);
      }
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 当安装新版本Service Worker时，激活它并清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker激活中...');
  
  // 当前端口的缓存白名单
  const currentPortCaches = [
    CACHE_NAME, 
    API_CACHE_NAME
  ];
  
  // 立即接管所有页面
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 保留当前端口的最新缓存，删除其他所有缓存
            if (!currentPortCaches.includes(cacheName)) {
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
      
      // 通知所有客户端Service Worker已更新
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
    })
  );
});

// 提供一个消息API，允许客户端清除缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('清除缓存:', cacheName);
            return caches.delete(cacheName);
          })
        ).then(() => {
          // 通知客户端缓存已清除
          event.source.postMessage({
            type: 'CACHES_CLEARED'
          });
        });
      })
    );
  }
}); 