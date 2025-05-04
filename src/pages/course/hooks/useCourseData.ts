import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import indexedDBCache from '@/lib/indexedDBCache';

// 带重试机制的获取课程注册信息
const fetchEnrollmentInfo = async (courseId: string, userId: string) => {
  if (!courseId || !userId) return null;
  
  // 尝试从IndexedDB缓存获取
  const cachedData = await indexedDBCache.getEnrollment(courseId, userId);
  if (cachedData) {
    console.log('从IndexedDB缓存返回课程注册信息');
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
      
      // 保存到IndexedDB缓存
      if (enrollments) {
        await indexedDBCache.saveEnrollment(courseId, userId, enrollments);
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
  
  // 尝试从IndexedDB缓存获取
  const cachedData = await indexedDBCache.getCourseDetails(courseId);
  if (cachedData) {
    console.log('从IndexedDB缓存返回课程详情');
    return cachedData;
  }
  
  try {
    console.time('fetchCourseDetails');
    const courseDetails = await courseService.getCourseDetails(courseId);
    console.timeEnd('fetchCourseDetails');
    
    // 保存到IndexedDB缓存
    if (courseDetails) {
      await indexedDBCache.saveCourseDetails(courseId, courseDetails);
    }
    
    return courseDetails;
  } catch (error) {
    console.error('获取课程详情失败:', error);
    console.timeEnd('fetchCourseDetails');
    throw error;
  }
};

// 定义不同类型数据的缓存配置常量
const CACHE_CONFIG = {
  // 课程详情 - 长时间缓存，因为不频繁更新
  courseDetails: {
    staleTime: 10 * 60 * 1000,  // 10分钟内保持新鲜(原为2分钟)
    gcTime: 60 * 60 * 1000,     // 1小时内保留缓存(原为10分钟)
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
  },
  // 课程注册信息 - 短时间缓存，因为会随用户进度变化
  enrollment: {
    staleTime: 1 * 60 * 1000,   // 1分钟内保持新鲜(原为2分钟)
    gcTime: 5 * 60 * 1000,      // 5分钟内保留缓存(原为10分钟)
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
  }
};

export const useCourseData = (courseId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 获取课程详情 - 使用优化后的缓存配置
  const { 
    data: courseData, 
    isLoading: isLoadingCourse,
    refetch: refetchCourseData,
    error: courseError
  } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId,
    ...CACHE_CONFIG.courseDetails
  });
  
  // 获取用户的课程注册信息 - 使用优化后的缓存配置
  const {
    data: enrollmentData,
    isLoading: isLoadingEnrollment,
    refetch: refetchEnrollment,
    error: enrollmentError
  } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || ''),
    enabled: !!courseId && !!user?.id,
    ...CACHE_CONFIG.enrollment,
    // 针对课程注册信息添加自动刷新功能
    refetchInterval: user?.id ? 3 * 60 * 1000 : false,  // 每3分钟自动刷新一次
    refetchOnWindowFocus: true,  // 页面获得焦点时刷新
  });
  
  // 强制刷新课程数据，清除缓存并重新获取
  const refreshCourseData = async () => {
    if (courseId) {
      // 清除IndexedDB缓存
      await indexedDBCache.clearCourseCache(courseId);
      
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
    clearCourseCache: (courseId: string) => indexedDBCache.clearCourseCache(courseId)
  };
};
