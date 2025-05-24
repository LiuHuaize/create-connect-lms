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
  
  // 暂时移除IndexedDB缓存，专注React Query
  /*
  // 尝试从IndexedDB缓存获取
  const cachedData = await indexedDBCache.getEnrollment(courseId, userId);
  if (cachedData) {
    console.log('从IndexedDB缓存返回课程注册信息');
    return cachedData;
  }
  */
  
  // 简化重试逻辑，让React Query统一处理重试
  try {
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select('id, progress, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
      
    if (error) {
      console.error('获取课程注册信息失败:', error);
      throw error;
    }
    
    // 暂时移除IndexedDB缓存保存
    /*
    // 保存到IndexedDB缓存
    if (enrollments) {
      await indexedDBCache.saveEnrollment(courseId, userId, enrollments);
    }
    */
    
    return enrollments;
  } catch (error) {
    console.error('获取课程注册信息失败:', error);
    throw error;
  }
};

// 带重试和性能优化的获取课程详情
const fetchCourseDetails = async (courseId: string | undefined) => {
  if (!courseId) return null;
  
  console.log('正在获取课程详情:', courseId);
  console.time('fetchCourseDetails');
  
  // 暂时移除IndexedDB缓存，专注React Query
  /*
  // 尝试从IndexedDB缓存获取
  const cachedData = await indexedDBCache.getCourseDetails(courseId);
  if (cachedData) {
    console.log('从IndexedDB缓存返回课程详情');
    return cachedData;
  }
  */
  
  try {
    const courseDetails = await courseService.getCourseDetails(courseId);
    console.timeEnd('fetchCourseDetails');
    
    // 暂时移除IndexedDB缓存保存
    /*
    // 保存到IndexedDB缓存
    if (courseDetails) {
      await indexedDBCache.saveCourseDetails(courseId, courseDetails);
    }
    */
    
    return courseDetails;
  } catch (error) {
    console.error('获取课程详情失败:', error);
    console.timeEnd('fetchCourseDetails');
    throw error;
  }
};

// 定义不同类型数据的缓存配置常量 - 根据优化建议更新
const CACHE_CONFIG = {
  // 课程详情 - 优化缓存配置，减少不必要请求
  courseDetails: {
    staleTime: 5 * 60 * 1000,    // 5分钟内认为是新鲜的
    gcTime: 30 * 60 * 1000,      // 30分钟后清理
    retry: 1,                     // 只重试1次
    retryDelay: 1000,            // 固定1秒延迟
    refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
  },
  // 课程注册信息 - 优化缓存配置，减少自动刷新
  enrollment: {
    staleTime: 2 * 60 * 1000,    // 2分钟内认为是新鲜的  
    gcTime: 10 * 60 * 1000,      // 10分钟后清理
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    // 移除自动刷新，减少不必要请求
    // refetchInterval: user?.id ? 3 * 60 * 1000 : false,
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
    ...CACHE_CONFIG.enrollment
  });
  
  // 强制刷新课程数据，清除缓存并重新获取
  const refreshCourseData = async () => {
    if (courseId) {
      // 暂时移除IndexedDB缓存清理，专注React Query
      /*
      // 清除IndexedDB缓存
      await indexedDBCache.clearCourseCache(courseId);
      */
      
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
    // 暂时移除IndexedDB缓存清理功能
    // clearCourseCache: (courseId: string) => indexedDBCache.clearCourseCache(courseId)
  };
};
