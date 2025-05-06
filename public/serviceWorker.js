// 为应用程序定义一个缓存版本
const CACHE_VERSION = 'v6';
const CACHE_NAME = (self.location.port || 'default') + '-connect-lms-cache-' + CACHE_VERSION;
const API_CACHE_NAME = (self.location.port || 'default') + '-connect-lms-api-cache-' + CACHE_VERSION;
const CRITICAL_CACHE_NAME = (self.location.port || 'default') + '-connect-lms-critical-cache-' + CACHE_VERSION;

// 需要缓存的静态资源列表 - 扩展基本资源
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/vendor.js',
  '/assets/index.css',
  '/assets/index.js',
  '/logo-yi.svg'
];

// 关键资源列表 - 最高优先级缓存和加载
const criticalResources = [
  '/assets/index.css',
  '/logo-yi.svg',
  '/assets/vendor.js',
  '/index.html'
];

// 不缓存的路径列表
const noCachePaths = [
  '/auth',
  '/login',
  '/dashboard'
];

// 扩展预加载资源列表
const preloadResources = [
  '/assets/index.css',
  '/assets/vendor.js',
  '/logo-yi.svg',
  '/assets/BlockNoteRenderer.DZShM0QE.css',
  '/assets/editor.CZ2bpOV-.css',
  '/assets/index.ClxVaXAb.css'
];

// 添加调试日志记录函数
function swLog(message, ...args) {
  console.log(`[ServiceWorker ${CACHE_VERSION}] ${message}`, ...args);
}

// 错误日志记录函数
function swError(message, ...args) {
  console.error(`[ServiceWorker ${CACHE_VERSION} ERROR] ${message}`, ...args);
}

// 检查URL是否应该被缓存
function shouldCache(url) {
  // 不缓存不同端口的请求
  if (self.location.port && url.port && self.location.port !== url.port) {
    swLog('不缓存不同端口的请求:', url.toString());
    return false;
  }
  
  // 检查路径是否在不缓存列表中
  for (const path of noCachePaths) {
    if (url.pathname.includes(path)) {
      swLog('在不缓存列表中的路径:', url.pathname);
      return false;
    }
  }
  
  swLog('将缓存URL:', url.toString());
  return true;
}

// 检查URL是否是关键资源
function isCriticalResource(url) {
  for (const resource of criticalResources) {
    if (url.pathname.endsWith(resource)) {
      swLog('检测到关键资源:', url.pathname);
      return true;
    }
  }
  return false;
}

// Service Worker安装后缓存指定的静态资源
self.addEventListener('install', (event) => {
  swLog('Service Worker安装中...', self.location.port);
  
  // 强制立即激活，不等待旧的Service Worker终止
  self.skipWaiting();
  
  event.waitUntil(
    Promise.all([
      // 缓存基本资源
      caches.open(CACHE_NAME)
        .then((cache) => {
          swLog('已打开缓存:', CACHE_NAME);
          // 为每个URL添加单独的错误处理，以便某一资源失败不影响其他资源
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url)
                .then(() => swLog('成功缓存:', url))
                .catch(err => swError('缓存失败:', url, err));
            })
          );
        }),
      // 单独缓存关键资源到专门的缓存空间
      caches.open(CRITICAL_CACHE_NAME)
        .then((cache) => {
          swLog('已打开关键资源缓存:', CRITICAL_CACHE_NAME);
          return Promise.all(
            criticalResources.map(url => {
              return cache.add(url)
                .then(() => swLog('成功缓存关键资源:', url))
                .catch(err => swError('缓存关键资源失败:', url, err));
            })
          );
        })
    ])
  );
});

// 当浏览器请求资源时，首先查看是否有缓存
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  swLog('获取请求:', url.pathname);
  
  // 排除不支持缓存的URL协议
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    swLog('不处理非http/https请求:', url.protocol);
    return; // 不处理非http和https请求
  }
  
  // 检查是否应该缓存此请求
  if (!shouldCache(url)) {
    event.respondWith(fetch(event.request)
      .then(response => {
        swLog('直接从网络获取 (不缓存):', url.toString());
        return response;
      })
      .catch(err => {
        swError('网络请求失败 (不缓存):', url.toString(), err);
        throw err;
      })
    );
    return;
  }
  
  // 判断是否为API请求或认证相关请求
  const isApiRequest = url.pathname.includes('/rest/v1/') || 
                       url.hostname.includes('supabase.co');
  const isAuthRequest = url.pathname.includes('/auth/v1/');
  
  // 检查是否是关键资源
  const isCritical = isCriticalResource(url);
  
  // 对认证请求直接使用网络，永不缓存
  if (isAuthRequest) {
    swLog('认证请求，直接从网络获取:', url.toString());
    event.respondWith(fetch(event.request));
  }
  // 对API请求使用网络优先策略，但缓存时间很短
  else if (isApiRequest) {
    // 只缓存GET请求
    if (event.request.method === 'GET') {
      swLog('API GET请求，使用网络优先策略:', url.toString());
      event.respondWith(networkFirstWithShortCache(event.request));
    } else {
      // 非GET请求直接走网络
      swLog('API非GET请求，直接从网络获取:', url.toString());
      event.respondWith(fetch(event.request));
    }
  }
  // 对关键资源使用缓存优先策略
  else if (isCritical) {
    swLog('关键资源，使用缓存优先策略:', url.toString());
    event.respondWith(cacheFirstThenNetwork(event.request));
  }
  // 对其他静态资源使用网络优先策略
  else {
    swLog('普通资源，使用网络优先策略:', url.toString());
    event.respondWith(networkFirstThenCache(event.request));
  }
});

// 缓存优先策略 - 适用于关键资源
async function cacheFirstThenNetwork(request) {
  const url = new URL(request.url);
  swLog('缓存优先策略 - 正在检查缓存:', url.pathname);
  
  const criticalCache = await caches.open(CRITICAL_CACHE_NAME);
  const cache = await caches.open(CACHE_NAME);
  
  // 先尝试从关键缓存获取
  let cachedResponse = await criticalCache.match(request);
  
  // 如果关键缓存没有，尝试从常规缓存获取
  if (!cachedResponse) {
    swLog('在关键缓存中未找到，检查常规缓存:', url.pathname);
    cachedResponse = await cache.match(request);
  }
  
  if (cachedResponse) {
    swLog('从缓存中找到资源:', url.pathname);
    // 后台更新缓存
    fetch(request.clone())
      .then((networkResponse) => {
        if (networkResponse.ok) {
          swLog('后台更新关键资源缓存:', url.pathname);
          criticalCache.put(request, networkResponse.clone());
        }
      })
      .catch(error => swError('后台更新关键资源失败:', url.pathname, error));
    
    return cachedResponse;
  }
  
  // 如果缓存中没有，从网络获取并缓存
  try {
    swLog('缓存中未找到，从网络获取:', url.pathname);
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      swLog('从网络获取成功，更新缓存:', url.pathname);
      await criticalCache.put(request, networkResponse.clone());
    } else {
      swError('从网络获取但响应不成功:', url.pathname, networkResponse.status);
    }
    
    return networkResponse;
  } catch (error) {
    swError('从网络获取失败:', url.pathname, error);
    throw error;
  }
}

// 网络优先策略，但缓存时间很短 - 适用于API请求
async function networkFirstWithShortCache(request) {
  const url = new URL(request.url);
  swLog('网络优先策略(短期缓存) - 尝试从网络获取:', url.pathname);
  
  const cache = await caches.open(API_CACHE_NAME);
  
  // 尝试从网络获取
  try {
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取，简单复制存入缓存，但设置很短的过期时间
    if (networkResponse.ok) {
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
          swLog('API响应已短期缓存:', url.pathname);
        } catch (cacheError) {
          swError('缓存API请求失败:', url.pathname, cacheError);
        }
      }
    } else {
      swLog('API响应不成功，不缓存:', url.pathname, networkResponse.status);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时，尝试从缓存获取
    swError('从网络获取API失败，尝试缓存:', url.pathname, error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否已过期
      const fetchedOn = cachedResponse.headers.get('sw-fetched-on');
      const expires = cachedResponse.headers.get('sw-expires');
      
      if (fetchedOn && expires) {
        if (Date.now() < parseInt(expires)) {
          swLog('使用未过期的API缓存:', url.pathname);
          return cachedResponse;
        } else {
          // 缓存已过期，删除它
          swLog('API缓存已过期，删除:', url.pathname);
          await cache.delete(request);
        }
      } else {
        swLog('使用API缓存 (未设置过期时间):', url.pathname);
        return cachedResponse;
      }
    }
    
    swError('无法获取API资源 (网络和缓存都失败):', url.pathname);
    throw error;
  }
}

// 网络优先策略 - 适用于一般资源
async function networkFirstThenCache(request) {
  const url = new URL(request.url);
  swLog('网络优先策略 - 尝试从网络获取:', url.pathname);
  
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // 首先尝试从网络获取
    const networkResponse = await fetch(request.clone());
    
    // 如果成功获取且应该缓存此URL，复制一份存入缓存
    if (networkResponse.ok && shouldCache(url)) {
      try {
        await cache.put(request, networkResponse.clone());
        swLog('从网络获取成功，已缓存:', url.pathname);
      } catch (cacheError) {
        swError('缓存网络响应失败:', url.pathname, cacheError);
      }
    } else if (!networkResponse.ok) {
      swLog('网络响应不成功，不缓存:', url.pathname, networkResponse.status);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败，尝试从缓存获取
    swError('从网络获取失败，尝试缓存:', url.pathname, error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      swLog('从缓存获取成功:', url.pathname);
      return cachedResponse;
    }
    
    swError('无法获取资源 (网络和缓存都失败):', url.pathname);
    throw error;
  }
}

// 当安装新版本Service Worker时，激活它并清理旧缓存
self.addEventListener('activate', (event) => {
  swLog('Service Worker激活中...');
  
  // 当前端口的缓存白名单
  const currentPortCaches = [
    CACHE_NAME, 
    API_CACHE_NAME,
    CRITICAL_CACHE_NAME
  ];
  
  // 立即接管所有页面
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then((cacheNames) => {
        swLog('当前所有缓存:', cacheNames);
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 保留当前端口的最新缓存，删除其他所有缓存
            if (!currentPortCaches.includes(cacheName)) {
              swLog('删除旧缓存', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即激活并接管所有客户端
      self.clients.claim()
    ]).then(() => {
      swLog('Service Worker现已激活并接管所有客户端');
      
      // 通知所有客户端Service Worker已更新
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION
          });
        });
      });
      
      // 预加载关键资源
      caches.open(CRITICAL_CACHE_NAME).then(cache => {
        swLog('开始预加载关键资源...');
        preloadResources.forEach(resource => {
          swLog('尝试预加载:', resource);
          fetch(resource).then(response => {
            if (response.ok) {
              cache.put(resource, response);
              swLog('预加载资源成功:', resource);
            } else {
              swError('预加载资源失败 (状态码):', resource, response.status);
            }
          }).catch(err => {
            swError('预加载资源失败 (网络错误):', resource, err);
          });
        });
      });
    })
  );
});

// 提供一个消息API，允许客户端清除缓存
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    swLog('收到清除缓存请求');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        swLog('准备清除的缓存:', cacheNames);
        return Promise.all(
          cacheNames.map(cacheName => {
            swLog('清除缓存:', cacheName);
            return caches.delete(cacheName);
          })
        ).then(() => {
          // 通知客户端缓存已清除
          swLog('所有缓存已清除，正在通知客户端');
          event.source.postMessage({
            type: 'CACHES_CLEARED'
          });
        });
      })
    );
  }
}); 