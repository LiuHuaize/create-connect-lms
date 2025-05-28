import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import indexedDBCache from '@/lib/indexedDBCache';
import { useCallback, useRef } from 'react';

// 性能监控工具 - 使用Map避免Timer重复，添加清理机制
const performanceTimers = new Map<string, number>();

const startTimer = (name: string) => {
  // 如果timer已存在，先清理再创建新的
  if (performanceTimers.has(name)) {
    console.warn(`⚠️ Timer '${name}' 已存在，清理旧Timer并创建新的`);
    performanceTimers.delete(name);
  }
  performanceTimers.set(name, performance.now());
  console.log(`⏱️ 开始计时: ${name}`);
};

const endTimer = (name: string) => {
  const startTime = performanceTimers.get(name);
  if (startTime) {
    const duration = performance.now() - startTime;
    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
    performanceTimers.delete(name);
    return duration;
  } else {
    console.warn(`⚠️ Timer '${name}' 不存在`);
    return 0;
  }
};

// 添加清理所有timer的函数
const clearAllTimers = () => {
  performanceTimers.clear();
  console.log('🧹 已清理所有性能监控Timer');
};

// 带重试机制的获取课程注册信息
const fetchEnrollmentInfo = async (courseId: string, userId: string) => {
  if (!courseId || !userId) return null;
  
  // 使用时间戳确保唯一性，避免Timer冲突
  const timerId = `fetchEnrollment_${courseId}_${userId}_${Date.now()}`;
  startTimer(timerId);
  
  try {
    const { data: enrollments, error } = await supabase
      .from('course_enrollments')
      .select('id, progress, status')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
      
    if (error) {
      console.error('获取课程注册信息失败:', error);
      endTimer(timerId);
      throw error;
    }
    
    endTimer(timerId);
    return enrollments;
  } catch (error) {
    console.error('获取课程注册信息失败:', error);
    endTimer(timerId);
    throw error;
  }
};

// 带重试和性能优化的获取课程详情
const fetchCourseDetails = async (courseId: string | undefined) => {
  if (!courseId) return null;
  
  // 使用时间戳确保唯一性，避免Timer冲突
  const timerId = `fetchCourseDetails_${courseId}_${Date.now()}`;
  console.log('📚 正在获取课程详情:', courseId);
  startTimer(timerId);
  
  try {
    const courseDetails = await courseService.getCourseDetails(courseId);
    endTimer(timerId);
    return courseDetails;
  } catch (error) {
    console.error('❌ 获取课程详情失败:', error);
    endTimer(timerId);
    throw error;
  }
};

// 进一步优化缓存配置，彻底阻止重复请求
const CACHE_CONFIG = {
  // 课程详情 - 大幅增加缓存时间，几乎完全阻止重复请求
  courseDetails: {
    staleTime: 15 * 60 * 1000,       // 15分钟，课程内容变化很不频繁
    gcTime: 30 * 60 * 1000,          // 30分钟，长时间保持缓存
    retry: 1,                        // 只重试1次，减少网络负担
    retryDelay: 1000,                // 固定1秒重试延迟
    refetchOnWindowFocus: false,     // 完全禁用窗口聚焦重新获取
    refetchOnMount: false,           // 完全禁用挂载时重新获取
    refetchOnReconnect: false,       // 禁用重连时刷新，减少请求
    // 在开发模式下特别重要：阻止 React StrictMode 的重复挂载
  },
  // 课程注册信息 - 保持较短缓存但阻止重复请求
  enrollment: {
    staleTime: 5 * 60 * 1000,        // 5分钟
    gcTime: 15 * 60 * 1000,          // 15分钟
    retry: 1,                        // 只重试1次
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,           // 禁用挂载时重新获取
    refetchOnReconnect: false,       // 禁用重连时刷新
  }
};

export const useCourseData = (courseId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 使用ref追踪组件挂载状态，避免重复初始化
  const isInitializedRef = useRef(false);
  
  // 稳定的查询键，避免不必要的重新创建
  const courseQueryKey = ['courseDetails', courseId];
  const enrollmentQueryKey = ['enrollment', courseId, user?.id];
  
  // 获取课程详情 - 使用优化后的缓存配置
  const { 
    data: courseData, 
    isLoading: isLoadingCourse,
    refetch: refetchCourseData,
    error: courseError
  } = useQuery({
    queryKey: courseQueryKey,
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
    queryKey: enrollmentQueryKey,
    queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || ''),
    enabled: !!courseId && !!user?.id,
    ...CACHE_CONFIG.enrollment
  });
  
  // 标记为已初始化，避免重复请求
  if (!isInitializedRef.current && (courseData || courseError)) {
    isInitializedRef.current = true;
  }
  
  // 使用useCallback确保函数引用稳定
  const refreshCourseData = useCallback(async () => {
    if (courseId) {
      console.log('🔄 强制刷新课程数据:', courseId);
      
      // 清理性能监控timers
      clearAllTimers();
      
      // 重置初始化状态
      isInitializedRef.current = false;
      
      // 使用 React Query 的 invalidateQueries 使缓存失效
      await queryClient.invalidateQueries({ queryKey: courseQueryKey });
      if (user?.id) {
        await queryClient.invalidateQueries({ queryKey: enrollmentQueryKey });
      }
      
      // 手动触发重新获取
      refetchCourseData();
      if (user?.id) {
        refetchEnrollment();
      }
    }
  }, [courseId, user?.id, queryClient, refetchCourseData, refetchEnrollment]);

  // 优化的查找当前课时实现
  const findCurrentLesson = useCallback((lessonId: string | undefined): { 
    selectedLesson: Lesson | null; 
    selectedUnit: CourseModule | null 
  } => {
    let selectedLesson = null;
    let selectedUnit = null;
    
    // 正确的类型检查和断言
    const typedCourseData = courseData as (Course & { modules?: CourseModule[] }) | undefined;
    
    if (!typedCourseData?.modules || typedCourseData.modules.length === 0) {
      return { selectedLesson, selectedUnit };
    }
    
    try {
      if (lessonId) {
        // 优化查找逻辑，避免不必要的循环
        for (const module of typedCourseData.modules) {
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
        for (const module of typedCourseData.modules) {
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
  }, [courseData]);

  // 处理错误，避免重复日志
  if (courseError && !isInitializedRef.current) {
    console.error('加载课程数据失败:', courseError);
  }
  
  if (enrollmentError && user?.id && !isInitializedRef.current) {
    console.error('加载注册信息失败:', enrollmentError);
  }

  // 正确类型断言enrollmentData
  const typedEnrollmentData = enrollmentData as { id: string; progress: number; status: string } | undefined;

  return {
    loading: isLoadingCourse || isLoadingEnrollment,
    courseData,
    error: courseError || (user?.id ? enrollmentError : null),
    progress: typedEnrollmentData?.progress || 0,
    enrollmentId: typedEnrollmentData?.id || null,
    enrollmentStatus: typedEnrollmentData?.status,
    findCurrentLesson,
    refreshCourseData,
  };
};
