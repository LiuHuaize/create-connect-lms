/**
 * 内存管理与优化工具函数
 * 用于帮助处理大型数据集和优化内存使用
 */

/**
 * 深度清理对象的引用，帮助垃圾回收
 * @param obj 任意对象
 */
export const clearObject = (obj: any): void => {
  if (!obj) return;
  
  if (Array.isArray(obj)) {
    // 清理数组
    while (obj.length > 0) {
      const item = obj.pop();
      if (typeof item === 'object' && item !== null) {
        clearObject(item);
      }
    }
  } else if (typeof obj === 'object') {
    // 清理对象
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          clearObject(value);
        }
        delete obj[key];
      }
    }
  }
};

/**
 * 压缩大型内容，如果是字符串且超过大小限制，将被截断并添加说明
 * @param content 内容
 * @param type 内容类型
 * @param maxSize 最大大小（字节）
 * @returns 压缩后的内容
 */
export const compressLargeContent = (
  content: any, 
  type: 'text' | 'json' | 'other' = 'other', 
  maxSize: number = 1000000
): any => {
  if (!content) return content;
  
  // 处理字符串
  if (typeof content === 'string') {
    if (content.length > maxSize) {
      console.warn(`内容长度(${content.length})超过限制(${maxSize})，将被截断`);
      return content.substring(0, maxSize) + '... [内容过长，已截断]';
    }
    return content;
  }
  
  // 处理JSON对象
  if (type === 'json' && typeof content === 'object') {
    try {
      const jsonString = JSON.stringify(content);
      if (jsonString.length > maxSize) {
        console.warn(`JSON内容长度(${jsonString.length})超过限制(${maxSize})，将被精简`);
        return JSON.parse(jsonString.substring(0, maxSize) + '"}'); // 尝试保留有效的JSON格式
      }
    } catch (error) {
      console.error('压缩JSON内容失败:', error);
    }
  }
  
  return content;
};

/**
 * 尝试调度垃圾回收
 * 注意：这个函数在大多数生产环境中不会真正触发GC，
 * 但在启用了--expose-gc的Node环境或某些调试模式的浏览器中可能有效。
 */
export const scheduleGarbageCollection = (): void => {
  // 释放可能的循环引用
  setTimeout(() => {
    try {
      // 尝试直接调用GC（在支持的环境中）
      if (typeof window !== 'undefined' && window.gc) {
        window.gc();
      }
      
      // 在不支持直接GC的环境中，使用一些技巧促进GC
      const array = new Array(10000);
      for (let i = 0; i < 10000; i++) {
        array[i] = new Object();
      }
    } catch (error) {
      // 忽略错误
    }
  }, 100);
};

/**
 * 安全的浅拷贝函数，避免使用JSON.parse/stringify深拷贝导致的内存问题
 * @param obj 要拷贝的对象
 * @returns 浅拷贝的对象
 */
export const shallowCopy = <T>(obj: T): T => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return [...obj] as unknown as T;
  }
  
  if (typeof obj === 'object') {
    return { ...obj };
  }
  
  return obj;
};

/**
 * 分批处理大型数组，避免一次性处理大量数据导致内存问题
 * @param array 要处理的数组
 * @param batchSize 批处理大小
 * @param processFn 处理函数
 * @param doneFn 完成回调
 */
export const processBatch = async <T, R>(
  array: T[],
  batchSize: number,
  processFn: (items: T[]) => Promise<R[]>,
  doneFn?: (results: R[]) => void
): Promise<R[]> => {
  if (!array || array.length === 0) return [];
  
  const results: R[] = [];
  const totalItems = array.length;
  const totalBatches = Math.ceil(totalItems / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, totalItems);
    const batch = array.slice(start, end);
    
    // 处理当前批次
    const batchResults = await processFn(batch);
    results.push(...batchResults);
    
    // 在批次之间添加短暂延迟，允许GC工作
    if (i < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 5));
      scheduleGarbageCollection();
    }
  }
  
  if (doneFn) {
    doneFn(results);
  }
  
  return results;
};

/**
 * 检查对象大小（近似值）
 * @param obj 要检查的对象
 * @returns 大小估计（字节）
 */
export const estimateObjectSize = (obj: any): number => {
  if (!obj) return 0;
  
  try {
    const jsonStr = JSON.stringify(obj);
    return jsonStr.length * 2; // UTF-16 编码每个字符占2字节
  } catch (error) {
    console.warn('估计对象大小失败:', error);
    return 0;
  }
}; 