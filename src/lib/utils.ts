import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 创建一个防抖函数，限制函数的执行频率
 * @param fn 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      fn(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * 清除所有应用缓存
 * @returns Promise<boolean> - 是否成功清除缓存
 */
export async function clearAllCaches(): Promise<boolean> {
  if (!navigator.serviceWorker) return false;

  try {
    // 尝试向所有激活的Service Worker发送清除缓存的消息
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) return false;
    
    const clearPromises = registrations.map(registration => {
      return new Promise<boolean>(resolve => {
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
    
    const results = await Promise.all(clearPromises);
    const success = results.some(result => result === true);
    
    // 如果通过Service Worker消息未成功清除缓存，尝试直接清除
    if (!success) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('通过直接访问Cache API清除缓存');
      return true;
    }
    
    return success;
  } catch (error) {
    console.error('清除缓存失败:', error);
    return false;
  }
}

// 公开清除缓存方法到window对象，方便调试
if (typeof window !== 'undefined') {
  (window as any).clearCaches = clearAllCaches;
}
