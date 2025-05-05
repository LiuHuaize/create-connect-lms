import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 定义清除所有缓存的函数
const clearAllCaches = async () => {
  if (!navigator.serviceWorker) return;

  // 尝试向所有激活的Service Worker发送清除缓存的消息
  const registrations = await navigator.serviceWorker.getRegistrations();
  registrations.forEach(registration => {
    if (registration.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHES' });
    }
  });
  
  console.log('缓存清除请求已发送');
};

// 在全局对象上暴露清除缓存的方法，方便调试
window.clearCaches = clearAllCaches;

// Service Worker刷新检测
let refreshing = false;
if (navigator.serviceWorker) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    console.log('Service Worker 已更新，刷新页面...');
    window.location.reload();
  });
}

// 先渲染应用，然后在空闲时注册Service Worker
createRoot(document.getElementById("root")!).render(<App />);

// 延迟注册Service Worker
const registerServiceWorker = () => {
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

  if ('serviceWorker' in navigator) {
    const swUrl = `/serviceWorker.js?port=${window.location.port}`;
    navigator.serviceWorker.register(swUrl, {
      scope: '/',
      updateViaCache: 'none'
    })
    .then(registration => {
      console.log('Service Worker注册成功:', registration.scope);
    })
    .catch(error => {
      console.error('Service Worker注册失败:', error);
    });
  }
};

// 使用requestIdleCallback或setTimeout在浏览器空闲时注册Service Worker
if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(registerServiceWorker);
} else {
  // 使用setTimeout作为后备方案
  setTimeout(registerServiceWorker, 2000);
}
