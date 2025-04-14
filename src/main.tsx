import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 注册Service Worker以优化缓存
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js', {
      scope: '/', // 明确设置作用域为根路径
      updateViaCache: 'none' // 禁用通过缓存更新，确保始终获取最新的Service Worker
    })
      .then(registration => {
        console.log('Service Worker注册成功:', registration.scope);
        
        // 强制更新Service Worker
        registration.update();
      })
      .catch(error => {
        console.error('Service Worker注册失败:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
