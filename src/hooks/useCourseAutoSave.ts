import { useState, useEffect, useRef, useCallback } from 'react';
import { Course, CourseModule } from '@/types/course';
import { toast } from 'sonner';
import debounce from '@/utils/debounce';

interface UseCourseAutoSaveProps {
  courseId?: string | null;
  course: Course;
  modules: CourseModule[];
  previousCourseRef: React.MutableRefObject<Course | null>;
  previousModulesRef: React.MutableRefObject<CourseModule[] | null>;
  isLoading: boolean;
  moduleDataLoaded: boolean;
  saveCourse: () => Promise<string | undefined>;
  enabled?: boolean;
}

interface UseCourseAutoSaveResult {
  isAutoSaving: boolean;
  lastSaved: Date | null;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
  autoSaveStatus: 'idle' | 'saving' | 'success' | 'error' | 'retry';
  retryCount: number;
  timeUntilNextSave: number | null;
}

// 自动保存状态本地存储键
const AUTO_SAVE_ENABLED_KEY = 'course_auto_save_enabled';

// 手动禁用自动保存
localStorage.setItem(AUTO_SAVE_ENABLED_KEY, 'false');

export const useCourseAutoSave = ({
  courseId,
  course,
  modules,
  previousCourseRef,
  previousModulesRef,
  isLoading,
  moduleDataLoaded,
  saveCourse,
  enabled = false // 默认为false
}: UseCourseAutoSaveProps): UseCourseAutoSaveResult => {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  // 禁用自动保存功能
  const [autoSaveEnabled, setAutoSaveEnabledState] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'retry'>('idle');
  const [retryCount, setRetryCount] = useState(0);
  const [timeUntilNextSave, setTimeUntilNextSave] = useState<number | null>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // 设置自动保存状态，并保存到本地存储
  const setAutoSaveEnabled = useCallback((value: boolean) => {
    setAutoSaveEnabledState(value);
    localStorage.setItem(AUTO_SAVE_ENABLED_KEY, String(value));
    
    // 当用户启用自动保存时，显示一个提示
    if (value) {
      toast.success('自动保存已启用', {
        description: '你的课程内容将自动保存',
        duration: 3000,
      });
    } else {
      toast.info('自动保存已禁用', {
        description: '请记得手动保存你的更改',
        duration: 3000,
      });
    }
  }, []);

  // 使用防抖函数包装自动保存，避免频繁保存
  const debouncedSave = useCallback(
    debounce(async () => {
      if (isAutoSaving) return;
      
      try {
        setIsAutoSaving(true);
        setAutoSaveStatus('saving');
        
        // 如果没有标题，不进行自动保存
        if (!course.title.trim()) {
          setIsAutoSaving(false);
          setAutoSaveStatus('idle');
          return;
        }

        // 添加视觉反馈 - 开始保存
        const toastId = toast.loading('自动保存中...', { id: 'auto-save-toast' });
        
        await saveCourse();
        
        // 重置重试计数器
        setRetryCount(0);
        
        // 更新最后保存时间
        const now = new Date();
        setLastSaved(now);
        
        // 更新视觉反馈 - 保存成功
        toast.success('自动保存成功', {
          id: toastId,
          duration: 1500,
        });
        
        setAutoSaveStatus('success');
      } catch (error) {
        console.error('自动保存失败:', error);
        setAutoSaveStatus('error');
        
        // 更新视觉反馈 - 保存失败
        toast.error('自动保存失败，将稍后重试', {
          id: 'auto-save-toast',
          duration: 3000,
        });
        
        // 如果自动保存失败，计划重试
        scheduleRetry();
      } finally {
        setIsAutoSaving(false);
      }
    }, 2000), // 2秒延迟，减少频繁保存
    [course, modules, saveCourse]
  );

  // 改进的变更检测
  const checkForChanges = useCallback(() => {
    // 如果没有之前的状态参考，认为有变化
    if (!previousCourseRef.current || !previousModulesRef.current) {
      return true;
    }

    // 比较课程基本信息
    const prevCourse = previousCourseRef.current;
    const currentCourse = course;
    
    // 使用JSON.stringify进行深度比较关键字段
    if (
      prevCourse.title !== currentCourse.title ||
      prevCourse.description !== currentCourse.description ||
      prevCourse.short_description !== currentCourse.short_description ||
      prevCourse.status !== currentCourse.status ||
      prevCourse.cover_image !== currentCourse.cover_image ||
      JSON.stringify(prevCourse.tags) !== JSON.stringify(currentCourse.tags) ||
      prevCourse.category !== currentCourse.category ||
      prevCourse.price !== currentCourse.price
    ) {
      return true;
    }

    // 比较模块数量
    const prevModules = previousModulesRef.current;
    if (prevModules.length !== modules.length) {
      return true;
    }

    // 比较模块包含的课时数量，检测课时添加/删除
    const prevModuleMap = new Map(prevModules.map(m => [m.id, m]));
    for (const currentModule of modules) {
      const prevModule = prevModuleMap.get(currentModule.id);
      
      // 如果是新模块，或模块标题/顺序有变化
      if (!prevModule || 
          currentModule.title !== prevModule.title || 
          currentModule.order_index !== prevModule.order_index) {
        return true;
      }
      
      // 比较课时数量
      const currentLessons = currentModule.lessons || [];
      const prevLessons = prevModule.lessons || [];
      if (currentLessons.length !== prevLessons.length) {
        return true;
      }
      
      // 使用Map优化课时比较
      const prevLessonMap = new Map(prevLessons.map(l => [l.id, l]));
      for (const currentLesson of currentLessons) {
        const prevLesson = prevLessonMap.get(currentLesson.id);
        
        // 如果课时不存在或有变化
        if (!prevLesson || 
            currentLesson.title !== prevLesson.title || 
            currentLesson.type !== prevLesson.type || 
            currentLesson.order_index !== prevLesson.order_index) {
          return true;
        }
        
        // 内容比较 - 只对比内容的哈希或特定关键字段
        // 避免大内容的深度比较，提高性能
        try {
          // 对于不同类型的课时，可以有不同的比较策略
          if (currentLesson.type === 'text') {
            if (currentLesson.content?.text !== prevLesson.content?.text) {
              return true;
            }
          } else if (currentLesson.type === 'quiz') {
            // 对于测验类型，比较问题数量
            if ((currentLesson.content?.questions?.length || 0) !== 
                (prevLesson.content?.questions?.length || 0)) {
              return true;
            }
          } else if (JSON.stringify(currentLesson.content) !== JSON.stringify(prevLesson.content)) {
            // 其他类型，使用完整比较
            return true;
          }
        } catch (e) {
          console.error('比较课时内容时出错:', e);
          // 出错时保守处理，视为有变化
          return true;
        }
      }
    }

    // 如果所有比较都通过，则没有变化
    return false;
  }, [course, modules, previousCourseRef, previousModulesRef]);

  // 安排自动保存失败后的重试
  const scheduleRetry = useCallback(() => {
    // 清除之前的定时器
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // 基于重试次数确定延迟时间，实现指数退避策略
    const baseDelay = 15000; // 15秒基础延迟
    const maxDelay = 120000; // 最长2分钟
    
    // 更新重试计数器
    setRetryCount(prev => prev + 1);
    
    // 计算下一次重试的延迟时间，最多重试5次
    const nextRetryCount = retryCount + 1;
    const exponentialDelay = Math.min(
      baseDelay * Math.pow(1.5, Math.min(nextRetryCount, 5)), 
      maxDelay
    );
    
    setAutoSaveStatus('retry');
    setTimeUntilNextSave(Math.round(exponentialDelay / 1000));
    
    // 设置倒计时更新
    countdownIntervalRef.current = setInterval(() => {
      setTimeUntilNextSave(prev => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    
    // 设置重试定时器
    retryTimeoutRef.current = setTimeout(() => {
      if (autoSaveEnabled && checkForChanges()) {
        // 更新状态
        toast.loading('正在重试自动保存...', { id: 'auto-save-retry-toast' });
        debouncedSave();
      }
    }, exponentialDelay);
  }, [autoSaveEnabled, checkForChanges, debouncedSave, retryCount]);

  // 监听课程和模块变更，触发自动保存
  useEffect(() => {
    // 如果自动保存被禁用，则不执行任何操作
    if (!autoSaveEnabled) return;
    
    // 如果课程未加载完成，不执行自动保存
    if (isLoading || !moduleDataLoaded) return;

    // 检查是否有courseId（新建课程未保存时没有id）
    if (!course.id && !courseId) return;

    // 只有当课程或模块发生变化时才触发自动保存
    if (checkForChanges()) {
      // 清除之前的定时器
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // 延迟触发防抖保存 - 给用户留出更多时间继续编辑
      autoSaveTimeoutRef.current = setTimeout(() => {
        debouncedSave();
      }, 5000); // 等待5秒钟，再触发防抖保存
    }

    // 组件卸载时清除定时器
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [
    course, 
    modules, 
    autoSaveEnabled, 
    isLoading, 
    moduleDataLoaded, 
    courseId, 
    checkForChanges, 
    debouncedSave
  ]);

  // 在组件卸载时尝试保存更改
  useEffect(() => {
    return () => {
      // 如果自动保存被启用且有未保存的更改，尝试保存
      if (autoSaveEnabled && checkForChanges() && !isLoading && moduleDataLoaded) {
        saveCourse().catch(error => {
          console.error('组件卸载时保存失败:', error);
        });
      }
    };
  }, [autoSaveEnabled, checkForChanges, isLoading, moduleDataLoaded, saveCourse]);

  return {
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    retryCount,
    timeUntilNextSave
  };
}; 