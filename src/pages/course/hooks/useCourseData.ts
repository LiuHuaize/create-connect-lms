import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseService, lessonCompletionCache } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import indexedDBCache from '@/lib/indexedDBCache';
import React, { useCallback, useRef, useMemo, useEffect } from 'react';
import { useCourseCompletionStore } from '@/stores/courseCompletionStore';

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

// 全局请求去重跟踪器 - 防止跨组件重复请求
const globalRequestTracker = new Set<string>();

// 紧急修复重复请求的强化缓存配置
const EMERGENCY_CACHE_CONFIG = {
  courseDetails: {
    staleTime: 15 * 60 * 1000,       // 15分钟强缓存
    gcTime: 60 * 60 * 1000,          // 1小时保留
    refetchOnWindowFocus: false,      // 完全禁用窗口聚焦刷新
    refetchOnMount: false,            // 完全禁用挂载时刷新
    refetchOnReconnect: false,        // 禁用重连刷新
    retry: 1,                         // 减少重试
    retryDelay: 2000,                 // 固定重试延迟
    // 关键：确保查询键稳定
    queryKeyHashFn: (queryKey: any) => JSON.stringify(queryKey),
  },

  enrollment: {
    staleTime: 10 * 60 * 1000,       // 10分钟强缓存
    gcTime: 30 * 60 * 1000,          // 30分钟保留
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  }
};

export const useCourseData = (courseId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 使用ref追踪组件挂载状态，避免重复初始化
  const isInitializedRef = useRef(false);

  // 添加hook初始化日志
  React.useEffect(() => {
    console.log('🔧 useCourseData hook 已初始化，courseId:', courseId);
  }, [courseId]);

  // 确保查询键完全一致，避免重复请求
  const courseQueryKey = useMemo(() => ['courseDetails', courseId], [courseId]);
  const enrollmentQueryKey = useMemo(() => ['enrollment', courseId, user?.id], [courseId, user?.id]);
  
  // 获取课程详情 - 使用紧急修复的缓存配置和全局请求去重
  const {
    data: courseData,
    isLoading: isLoadingCourse,
    refetch: refetchCourseData,
    error: courseError
  } = useQuery({
    queryKey: courseQueryKey,
    queryFn: async () => {
      if (!courseId) return null;

      // 使用全局请求跟踪器防止重复请求
      if (globalRequestTracker.has(courseId)) {
        console.warn('🚫 阻止重复的课程数据请求:', courseId);
        // 等待一小段时间，让正在进行的请求完成
        await new Promise(resolve => setTimeout(resolve, 100));
        // 尝试从React Query缓存中获取数据
        const cachedData = queryClient.getQueryData(courseQueryKey);
        if (cachedData) {
          console.log('📋 从缓存返回课程数据:', courseId);
          return cachedData;
        }
        return null;
      }

      globalRequestTracker.add(courseId);
      console.log('📚 开始获取课程详情 (防重复版本):', courseId);

      try {
        const result = await fetchCourseDetails(courseId);
        console.log('✅ 课程详情获取成功:', courseId);
        return result;
      } catch (error) {
        console.error('❌ 课程详情获取失败:', courseId, error);
        throw error;
      } finally {
        globalRequestTracker.delete(courseId);
      }
    },
    enabled: !!courseId,
    ...EMERGENCY_CACHE_CONFIG.courseDetails
  });
  
  // 获取用户的课程注册信息 - 使用紧急修复的缓存配置
  const {
    data: enrollmentData,
    isLoading: isLoadingEnrollment,
    refetch: refetchEnrollment,
    error: enrollmentError
  } = useQuery({
    queryKey: enrollmentQueryKey,
    queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || ''),
    enabled: !!courseId && !!user?.id,
    ...EMERGENCY_CACHE_CONFIG.enrollment
  });
  
  // 从课程详情中设置完成状态
  const { setCompletionStatusFromCourseDetails } = useCourseCompletionStore();
  
  useEffect(() => {
    // 当获取到课程数据且包含完成状态时，更新到store
    console.log('🔄 useCourseData 检查是否需要同步完成状态到 store:', {
      courseId: courseData?.id,
      lessonCompletionCacheExists: !!lessonCompletionCache[courseData?.id || ''],
      lessonCompletionCacheContent: lessonCompletionCache[courseData?.id || ''],
      allCacheKeys: Object.keys(lessonCompletionCache)
    });
    
    if (courseData?.id && lessonCompletionCache[courseData.id]) {
      console.log('✅ 同步课程完成状态到 Zustand store:', courseData.id);
      setCompletionStatusFromCourseDetails(courseData.id);
    } else {
      console.log('❌ 跳过同步 - 条件不满足:', {
        hasCourseId: !!courseData?.id,
        hasCacheData: !!lessonCompletionCache[courseData?.id || '']
      });
    }
  }, [courseData?.id]); // 移除 setCompletionStatusFromCourseDetails 依赖
  
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
        // 同时清除已加入课程的缓存，确保注册状态更新
        await queryClient.invalidateQueries({ queryKey: ['enrolledCourses', user.id] });
      }

      // 手动触发重新获取
      await refetchCourseData();
      if (user?.id) {
        await refetchEnrollment();
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
