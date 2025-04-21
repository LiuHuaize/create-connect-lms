import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 定义清除所有缓存的函数
const clearAllCaches = async () => {
  if (!navigator.serviceWorker) return;

  // 尝试向所有激活的Service Worker发送清除缓存的消息
  const registrations = await navigator.serviceWorker.getRegistrations();
  const clearPromises = registrations.map(registration => {
    return new Promise(resolve => {
      // 创建一个消息通道
      const messageChannel = new MessageChannel();
      
      // 设置接收消息的处理函数
      messageChannel.port1.onmessage = event => {
        if (event.data && event.data.type === 'CACHES_CLEARED') {
          console.log('缓存已清除');
          resolve(true);
        }
      };
      
      // 向Service Worker发送清除缓存的消息
      if (registration.active) {
        registration.active.postMessage(
          { type: 'CLEAR_CACHES' },
          [messageChannel.port2]
        );
        
        // 5秒超时
        setTimeout(() => resolve(false), 5000);
      } else {
        resolve(false);
      }
    });
  });
  
  await Promise.all(clearPromises);
  console.log('所有缓存清除完成');
};

// 在全局对象上暴露清除缓存的方法，方便调试
window.clearCaches = clearAllCaches;

// 添加Service Worker检测刷新的功能
let refreshing = false;
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (refreshing) return;
  refreshing = true;
  console.log('Service Worker 已更新，刷新页面...');
  window.location.reload();
});

// 注册Service Worker以优化缓存
if ('serviceWorker' in navigator) {
  // 延迟注册Service Worker，确保页面完全加载
  window.addEventListener('load', () => {
    // 检查URL参数，如果有clear-cache参数，清除所有缓存
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('clear-cache')) {
      console.log('检测到clear-cache参数，正在清除缓存...');
      clearAllCaches().then(() => {
        // 移除URL参数并刷新页面
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
        window.location.reload();
      });
      return;
    }

    // 先检查是否已有Service Worker
    navigator.serviceWorker.getRegistrations().then(registrations => {
      // 如果已经有注册的Service Worker，强制更新
      if (registrations.length > 0) {
        console.log('更新已存在的Service Worker');
        // 为当前端口单独注册Service Worker
        const swUrl = `/serviceWorker.js?port=${window.location.port}`;
        navigator.serviceWorker.register(swUrl, {
          scope: '/',
          updateViaCache: 'none' 
        })
        .then(registration => {
          console.log('Service Worker更新成功:', registration.scope);
          registration.update();
        })
        .catch(error => {
          console.error('Service Worker更新失败:', error);
        });
      } else {
        // 没有注册过，创建新的注册
        const swUrl = `/serviceWorker.js?port=${window.location.port}`;
        navigator.serviceWorker.register(swUrl, {
          scope: '/', // 明确设置作用域为根路径
          updateViaCache: 'none' // 禁用通过缓存更新
        })
        .then(registration => {
          console.log('Service Worker注册成功:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker注册失败:', error);
        });
      }
    });
  });

  // 添加消息监听器，处理Service Worker消息
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_ACTIVATED') {
      console.log('Service Worker已激活，版本:', event.data.version);
    } else if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('缓存已更新:', event.data.url);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
