import Dexie from 'dexie';

// 缓存数据库定义
export class CourseCache extends Dexie {
  courseDetails: Dexie.Table<CourseDetailCache, string>;
  enrollments: Dexie.Table<EnrollmentCache, string>;

  constructor() {
    super('ConnectLMS-Cache');
    
    // 定义数据库结构
    this.version(1).stores({
      courseDetails: 'id, timestamp',   // 课程详情表
      enrollments: 'id, courseId, userId, timestamp'  // 课程注册表
    });
    
    // 定义表的类型
    this.courseDetails = this.table('courseDetails');
    this.enrollments = this.table('enrollments');
  }

  // 删除过期缓存的方法
  async clearExpiredCache(expireTime: number) {
    const cutoff = Date.now() - expireTime;
    
    try {
      // 删除过期的课程详情缓存
      await this.courseDetails
        .where('timestamp')
        .below(cutoff)
        .delete();
      
      // 删除过期的注册信息缓存
      await this.enrollments
        .where('timestamp')
        .below(cutoff)
        .delete();
      
      console.log('已清理过期缓存');
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  // 清理指定课程的缓存
  async clearCourseCache(courseId: string) {
    try {
      // 删除课程详情
      await this.courseDetails
        .where('id')
        .equals(courseId)
        .delete();
      
      // 删除相关的注册信息
      await this.enrollments
        .where('courseId')
        .equals(courseId)
        .delete();
      
      console.log('已清除课程相关缓存:', courseId);
    } catch (error) {
      console.error('清除课程缓存失败:', error);
    }
  }

  // 获取缓存使用情况的方法
  async getCacheStats() {
    try {
      const courseCount = await this.courseDetails.count();
      const enrollmentCount = await this.enrollments.count();
      
      // 估算数据大小
      let totalSize = 0;
      
      // 采样10个课程详情估算大小
      if (courseCount > 0) {
        const courseSample = await this.courseDetails.limit(10).toArray();
        const courseAvgSize = courseSample.reduce((sum, item) => 
          sum + (JSON.stringify(item.data).length || 0), 0) / courseSample.length;
        totalSize += courseAvgSize * courseCount;
      }
      
      // 采样10个注册信息估算大小
      if (enrollmentCount > 0) {
        const enrollmentSample = await this.enrollments.limit(10).toArray();
        const enrollmentAvgSize = enrollmentSample.reduce((sum, item) => 
          sum + (JSON.stringify(item.data).length || 0), 0) / enrollmentSample.length;
        totalSize += enrollmentAvgSize * enrollmentCount;
      }
      
      return {
        courseCount,
        enrollmentCount,
        estimatedSizeKB: Math.round(totalSize / 1024),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        courseCount: 0,
        enrollmentCount: 0,
        estimatedSizeKB: 0,
        timestamp: Date.now()
      };
    }
  }
}

// 缓存项类型定义
interface CacheBase {
  timestamp: number;
}

export interface CourseDetailCache extends CacheBase {
  id: string;      // 课程ID
  data: any;       // 课程详情数据
}

export interface EnrollmentCache extends CacheBase {
  id: string;      // 生成的唯一ID: courseId-userId
  courseId: string; // 课程ID
  userId: string;   // 用户ID
  data: any;       // 注册信息数据
}

// 单例实例
const db = new CourseCache();

// 缓存服务默认配置
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000; // 5分钟缓存过期时间

// 缓存服务API
export const indexedDBCache = {
  // 保存课程详情到缓存
  async saveCourseDetails(courseId: string, data: any): Promise<void> {
    if (!courseId || !data) return;
    
    try {
      // 计算数据大小
      const jsonSize = JSON.stringify(data).length;
      
      // 如果数据过大，跳过缓存
      if (jsonSize > 10 * 1024 * 1024) { // 10MB限制
        console.warn(`缓存数据过大 (${Math.round(jsonSize/1024)}KB)，跳过缓存`);
        return;
      }
      
      // 准备缓存项
      const cacheItem: CourseDetailCache = {
        id: courseId,
        data,
        timestamp: Date.now()
      };
      
      // 保存到数据库
      await db.courseDetails.put(cacheItem);
      console.log(`已缓存课程详情: ${courseId}`);
    } catch (error) {
      console.error('保存课程详情到缓存失败:', error);
    }
  },
  
  // 获取课程详情缓存
  async getCourseDetails(courseId: string, maxAge = DEFAULT_CACHE_EXPIRY): Promise<any | null> {
    if (!courseId) return null;
    
    try {
      // 查询缓存
      const cacheItem = await db.courseDetails
        .where('id')
        .equals(courseId)
        .first();
      
      // 如果没有缓存或缓存已过期
      if (!cacheItem || (Date.now() - cacheItem.timestamp > maxAge)) {
        return null;
      }
      
      console.log('从IndexedDB缓存返回课程详情');
      return cacheItem.data;
    } catch (error) {
      console.error('从缓存获取课程详情失败:', error);
      return null;
    }
  },
  
  // 保存注册信息到缓存
  async saveEnrollment(courseId: string, userId: string, data: any): Promise<void> {
    if (!courseId || !userId || !data) return;
    
    try {
      // 准备缓存项
      const cacheItem: EnrollmentCache = {
        id: `${courseId}-${userId}`,
        courseId,
        userId,
        data,
        timestamp: Date.now()
      };
      
      // 保存到数据库
      await db.enrollments.put(cacheItem);
      console.log(`已缓存课程注册信息: ${courseId}-${userId}`);
    } catch (error) {
      console.error('保存注册信息到缓存失败:', error);
    }
  },
  
  // 获取注册信息缓存
  async getEnrollment(courseId: string, userId: string, maxAge = DEFAULT_CACHE_EXPIRY): Promise<any | null> {
    if (!courseId || !userId) return null;
    
    try {
      // 查询缓存
      const cacheItem = await db.enrollments
        .where('id')
        .equals(`${courseId}-${userId}`)
        .first();
      
      // 如果没有缓存或缓存已过期
      if (!cacheItem || (Date.now() - cacheItem.timestamp > maxAge)) {
        return null;
      }
      
      console.log('从IndexedDB缓存返回注册信息');
      return cacheItem.data;
    } catch (error) {
      console.error('从缓存获取注册信息失败:', error);
      return null;
    }
  },
  
  // 清除指定课程的缓存
  clearCourseCache: (courseId: string) => db.clearCourseCache(courseId),
  
  // 清除所有缓存
  async clearAllCache(): Promise<void> {
    try {
      await db.delete();
      await db.open();
      console.log('已清除所有缓存');
    } catch (error) {
      console.error('清除所有缓存失败:', error);
    }
  },
  
  // 清除过期缓存
  clearExpiredCache: (expireTime = DEFAULT_CACHE_EXPIRY) => db.clearExpiredCache(expireTime),
  
  // 获取缓存统计信息
  getCacheStats: () => db.getCacheStats()
};

// 自动定期清理过期缓存
const startAutoCacheCleanup = () => {
  // 应用启动时清理一次
  indexedDBCache.clearExpiredCache();
  
  // 每10分钟清理一次过期缓存
  setInterval(() => {
    indexedDBCache.clearExpiredCache();
  }, 10 * 60 * 1000);
};

// 启动自动清理
startAutoCacheCleanup();

export default indexedDBCache; 