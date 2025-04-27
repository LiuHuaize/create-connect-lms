/**
 * 创建一个防抖函数，延迟调用 fn，直到上一次调用过去了 wait 毫秒
 * 
 * @param fn 要防抖的函数
 * @param wait 等待的毫秒数
 * @returns 防抖处理后的函数
 */
export default function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      // 清除上一次的定时器
      if (timeout) {
        clearTimeout(timeout);
      }
      
      // 设置新的定时器
      timeout = setTimeout(() => {
        try {
          const result = fn(...args);
          // 如果结果是 Promise，正确处理 resolve/reject
          if (result instanceof Promise) {
            result.then(resolve).catch(reject);
          } else {
            resolve(result as ReturnType<T>);
          }
        } catch (error) {
          reject(error);
        }
      }, wait);
    });
  };
} 