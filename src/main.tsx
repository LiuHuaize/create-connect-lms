import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 导入BlockNote必要的样式
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// 注册Service Worker以优化缓存
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(registration => {
        console.log('Service Worker注册成功:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker注册失败:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
