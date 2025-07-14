import { useEffect, useMemo } from 'react';
import { useCourseCompletionStore } from '@/stores/courseCompletionStore';

interface UseCourseCompletionOptions {
  courseId?: string;
  // 是否在组件挂载时自动加载
  autoLoad?: boolean;
  // 是否强制清理无效记录
  forceCleanup?: boolean;
}

export function useCourseCompletion(options: UseCourseCompletionOptions = {}) {
  const { courseId, autoLoad = true, forceCleanup = false } = options;
  
  const {
    getCompletionStatus,
    isLessonCompleted,
    loadCompletionStatus,
    updateLessonCompletion,
    loadingCourses,
    completionStatus: storeCompletionStatus
  } = useCourseCompletionStore();
  
  
  // 自动加载完成状态
  useEffect(() => {
    if (courseId && autoLoad) {
      loadCompletionStatus(courseId, forceCleanup);
    }
  }, [courseId, autoLoad, forceCleanup]);
  
  // 获取当前课程的完成状态 - 直接从 store 订阅状态
  const completionStatus = useMemo(() => {
    const status = courseId ? (storeCompletionStatus[courseId] || {}) : {};
    // 只在状态为空时输出调试信息
    if (courseId && Object.keys(status).length === 0) {
      console.log('⚠️ useCourseCompletion: 完成状态为空', { 
        courseId, 
        storeHasData: !!storeCompletionStatus[courseId],
        allStoreKeys: Object.keys(storeCompletionStatus),
        fullStoreContent: storeCompletionStatus
      });
    }
    return status;
  }, [courseId, storeCompletionStatus]);
  
  // 判断是否正在加载
  const isLoading = courseId ? loadingCourses.has(courseId) : false;
  
  // 计算完成的课时数量
  const completedCount = useMemo(() => {
    return Object.values(completionStatus).filter(Boolean).length;
  }, [completionStatus]);
  
  // 包装的课时完成检查函数
  const checkLessonCompleted = (lessonId: string) => {
    if (!courseId) return false;
    return isLessonCompleted(courseId, lessonId);
  };
  
  // 包装的更新函数
  const updateCompletion = (lessonId: string, completed: boolean) => {
    if (!courseId) return;
    updateLessonCompletion(courseId, lessonId, completed);
  };
  
  // 重新加载完成状态
  const reload = async (forceCleanupOnReload = false) => {
    if (!courseId) return;
    await loadCompletionStatus(courseId, forceCleanupOnReload);
  };
  
  return {
    completionStatus,
    isLoading,
    completedCount,
    isLessonCompleted: checkLessonCompleted,
    updateCompletion,
    reload
  };
}