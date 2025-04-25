import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';

// 本地存储缓存辅助函数
const LOCAL_STORAGE_PREFIX = 'connect-lms-cache-';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 修改为5分钟缓存时间，平衡性能和数据新鲜度

// 从本地存储获取缓存数据
const getFromLocalCache = (key: string) => {
  try {
    const cachedItem = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (!cachedItem) return null;
    
    const { data, timestamp } = JSON.parse(cachedItem);
    
    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('从本地缓存获取数据失败:', error);
    // 如果解析失败，删除可能的损坏缓存
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    } catch (e) {
      // 忽略清理错误
    }
    return null;
  }
};

// 保存数据到本地存储
const saveToLocalCache = (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('保存数据到本地缓存失败:', error);
    // 如果存储失败，尝试清理其他缓存以释放空间
    try {
      // 清理旧的缓存项
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => k.startsWith(LOCAL_STORAGE_PREFIX));
      if (cacheKeys.length > 10) { // 如果缓存项过多
        // 清除最旧的一半缓存
        const keysToRemove = cacheKeys
          .map(k => {
            try {
              const item = localStorage.getItem(k);
              if (!item) return { key: k, timestamp: 0 };
              const { timestamp } = JSON.parse(item);
              return { key: k, timestamp };
            } catch (e) {
              return { key: k, timestamp: 0 };
            }
          })
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, Math.floor(cacheKeys.length / 2))
          .map(item => item.key);
        
        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        // 再次尝试保存
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(cacheItem));
      }
    } catch (e) {
      // 如果清理失败，忽略
    }
  }
};

// 清除指定课程的所有缓存
const clearCourseCache = (courseId: string) => {
  try {
    // 清除课程详情缓存
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}course-details-${courseId}`);
    
    // 清除课程注册相关缓存
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${LOCAL_STORAGE_PREFIX}enrollment-${courseId}`)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('已清除课程相关缓存:', courseId);
  } catch (error) {
    console.error('清除课程缓存失败:', error);
  }
};

// 带重试机制的获取课程注册信息
const fetchEnrollmentInfo = async (courseId: string, userId: string) => {
  if (!courseId || !userId) return null;
  
  // 尝试从本地缓存获取
  const cacheKey = `enrollment-${courseId}-${userId}`;
  const cachedData = getFromLocalCache(cacheKey);
  if (cachedData) {
    console.log('从本地缓存返回课程注册信息');
    return cachedData;
  }
  
  // 使用自定义重试逻辑
  let attempts = 0;
  const maxAttempts = 2;
  
  while (attempts < maxAttempts) {
    try {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('id, progress, status')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
        
      if (error) {
        console.error(`获取课程注册信息失败 (尝试 ${attempts + 1}/${maxAttempts}):`, error);
        attempts++;
        if (attempts < maxAttempts) {
          // 指数退避重试策略
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          continue;
        }
        throw error;
      }
      
      // 保存到本地缓存
      if (enrollments) {
        saveToLocalCache(cacheKey, enrollments);
      }
      
      return enrollments;
    } catch (error) {
      if (attempts >= maxAttempts - 1) throw error;
      attempts++;
      // 指数退避重试
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
    }
  }
};

// 带重试和性能优化的获取课程详情
const fetchCourseDetails = async (courseId: string | undefined) => {
  if (!courseId) return null;
  
  console.log('正在获取课程详情:', courseId);
  
  // 尝试从本地缓存获取
  const cacheKey = `course-details-${courseId}`;
  const cachedData = getFromLocalCache(cacheKey);
  if (cachedData) {
    console.log('从本地缓存返回课程详情');
    return cachedData;
  }
  
  try {
    console.time('fetchCourseDetails');
    const courseDetails = await courseService.getCourseDetails(courseId);
    console.timeEnd('fetchCourseDetails');
    
    // 保存到本地缓存
    if (courseDetails) {
      saveToLocalCache(cacheKey, courseDetails);
    }
    
    return courseDetails;
  } catch (error) {
    console.error('获取课程详情失败:', error);
    // 如果失败，尝试返回过期的缓存数据作为后备
    try {
      const expiredCacheItem = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${cacheKey}`);
      if (expiredCacheItem) {
        const { data } = JSON.parse(expiredCacheItem);
        console.log('使用过期缓存作为后备');
        // 通知用户数据可能过期
        toast.warning('课程数据可能不是最新的，请尝试刷新页面');
        return data;
      }
    } catch (e) {
      // 忽略读取过期缓存的错误
    }
    throw error;
  }
};

export const useCourseData = (courseId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 获取课程详情
  const { 
    data: courseData, 
    isLoading: isLoadingCourse,
    refetch: refetchCourseData,
    error: courseError
  } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2分钟后标记为过期
    gcTime: 10 * 60 * 1000,   // 10分钟后从缓存中移除
    retry: 2,                 // 最多重试2次
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000), // 指数退避重试策略
  });
  
  // 获取用户的课程注册信息
  const {
    data: enrollmentData,
    isLoading: isLoadingEnrollment,
    refetch: refetchEnrollment,
    error: enrollmentError
  } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || ''),
    enabled: !!courseId && !!user?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
  });
  
  // 强制刷新课程数据，清除缓存并重新获取
  const refreshCourseData = () => {
    if (courseId) {
      clearCourseCache(courseId);
      // 使用 React Query 的 invalidateQueries 使缓存失效
      queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId] });
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['enrollment', courseId, user.id] });
      }
      // 手动触发重新获取
      refetchCourseData();
      if (user?.id) {
        refetchEnrollment();
      }
    }
  };

  // 更智能的查找当前课时实现
  const findCurrentLesson = (lessonId: string | undefined): { 
    selectedLesson: Lesson | null; 
    selectedUnit: CourseModule | null 
  } => {
    let selectedLesson = null;
    let selectedUnit = null;
    
    if (!courseData?.modules || courseData.modules.length === 0) {
      return { selectedLesson, selectedUnit };
    }
    
    try {
      if (lessonId) {
        // 优化查找逻辑，避免不必要的循环
        for (const module of courseData.modules) {
          if (!module.lessons || module.lessons.length === 0) continue;
          
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            selectedLesson = lesson;
            selectedUnit = module;
            break;
          }
        }
      }
      
      // 如果没找到指定课时，返回第一个模块的第一个课时
      if (!selectedLesson) {
        // 查找第一个有课时的模块
        for (const module of courseData.modules) {
          if (module.lessons && module.lessons.length > 0) {
            selectedLesson = module.lessons[0];
            selectedUnit = module;
            break;
          }
        }
      }
    } catch (error) {
      console.error('寻找当前课时时出错:', error);
      // 错误处理，返回空结果
    }
    
    return { selectedLesson, selectedUnit };
  };

  // 处理错误
  if (courseError) {
    console.error('加载课程数据失败:', courseError);
  }
  
  if (enrollmentError && user?.id) {
    console.error('加载注册信息失败:', enrollmentError);
  }

  return {
    loading: isLoadingCourse || isLoadingEnrollment,
    courseData,
    error: courseError || (user?.id ? enrollmentError : null),
    progress: enrollmentData?.progress || 0,
    enrollmentId: enrollmentData?.id || null,
    enrollmentStatus: enrollmentData?.status,
    findCurrentLesson,
    refreshCourseData,
    clearCourseCache
  };
};
