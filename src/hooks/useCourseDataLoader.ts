import { useState, useEffect, useCallback } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useLocalBackup } from './useLocalBackup';

interface UseCourseDataLoaderProps {
  courseId: string | null | undefined;
  onDataLoaded?: (course: Course, modules: CourseModule[]) => void;
}

interface UseCourseDataLoaderResult {
  course: Course | null;
  modules: CourseModule[];
  isLoading: boolean;
  loadingDetails: boolean;
  moduleDataLoaded: boolean;
  loadingProgress: number;
  loadingMessage: string;
  error: Error | null;
  restoreFromBackup: () => boolean;
  hasBackup: boolean;
  reloadCourse: () => Promise<void>;
}

/**
 * 性能优化的课程数据加载器
 * - 实现分段加载大型课程数据
 * - 支持本地备份恢复
 * - 提供加载进度反馈
 */
export const useCourseDataLoader = ({
  courseId,
  onDataLoaded
}: UseCourseDataLoaderProps): UseCourseDataLoaderResult => {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [moduleDataLoaded, setModuleDataLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('准备加载...');
  const [error, setError] = useState<Error | null>(null);

  // 使用本地备份钩子
  const {
    hasBackup,
    restoreFromBackup: restoreBackup,
    saveLocalBackup
  } = useLocalBackup({
    courseId,
    course: course || {
      title: '',
      description: '',
      short_description: '',
      author_id: '',
      status: 'draft',
      price: null,
      tags: [],
      category: null
    },
    modules,
    isLoading,
    moduleDataLoaded
  });

  // 从本地备份恢复课程
  const restoreFromBackup = useCallback(() => {
    const backupData = restoreBackup();
    if (backupData) {
      setCourse(backupData.course);
      setModules(backupData.modules);
      setIsLoading(false);
      setLoadingDetails(false);
      setModuleDataLoaded(true);
      setLoadingProgress(100);
      setLoadingMessage('已从本地备份恢复');
      
      if (onDataLoaded) {
        onDataLoaded(backupData.course, backupData.modules);
      }
      
      toast.success('已从本地备份恢复数据');
      return true;
    }
    return false;
  }, [restoreBackup, onDataLoaded]);

  // 加载课程数据
  const loadCourseData = useCallback(async () => {
    if (!courseId) {
      setIsLoading(false);
      setLoadingDetails(false);
      setModuleDataLoaded(true);
      setLoadingProgress(100);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingDetails(true);
      setModuleDataLoaded(false);
      setLoadingProgress(0);
      setLoadingMessage('加载课程基本信息...');
      setError(null);

      // 阶段1: 加载课程基本信息
      const courseDetails = await courseService.getCourseBasicInfo(courseId);
      setCourse(courseDetails);
      setLoadingProgress(30);
      setLoadingMessage('加载课程模块信息...');
      setLoadingDetails(false);

      // 阶段2: 加载模块信息 (不包含课时内容)
      const modulesData = await courseService.getCourseModules(courseId);
      setLoadingProgress(50);
      
      // 设置模块但暂不设置课时
      const modulesWithoutLessons = modulesData.map(module => ({
        ...module,
        lessons: []
      }));
      setModules(modulesWithoutLessons);

      // 获取所有模块的数量，用于计算进度
      const totalModules = modulesData.length;
      let loadedModules = 0;

      // 阶段3: 分批加载每个模块的课时
      const batchSize = 2; // 每批加载的模块数
      const modulesWithLessons = [...modulesWithoutLessons];

      // 分批处理每个模块的课时
      for (let i = 0; i < totalModules; i += batchSize) {
        const currentBatch = modulesData.slice(i, i + batchSize);
        
        setLoadingMessage(`加载模块 ${i + 1}-${Math.min(i + batchSize, totalModules)} 的课时 (共${totalModules}个)...`);
        
        // 并行加载当前批次中每个模块的课时
        const lessonsPromises = currentBatch.map(module => 
          courseService.getModuleLessons(module.id)
        );
        
        const lessonsBatch = await Promise.all(lessonsPromises);
        
        // 更新进度
        loadedModules += currentBatch.length;
        const progressPercentage = 50 + Math.floor((loadedModules / totalModules) * 50);
        setLoadingProgress(progressPercentage);
        
        // 更新对应模块的课时
        for (let j = 0; j < currentBatch.length; j++) {
          const moduleIndex = modulesWithLessons.findIndex(m => m.id === currentBatch[j].id);
          if (moduleIndex !== -1) {
            modulesWithLessons[moduleIndex].lessons = lessonsBatch[j];
          }
          
          // 每加载一个模块就更新状态，而不是等待全部加载完成
          // 这样用户可以更快地看到部分内容
          setModules([...modulesWithLessons]);
        }
      }

      // 全部加载完成
      setModuleDataLoaded(true);
      setIsLoading(false);
      setLoadingProgress(100);
      setLoadingMessage('课程加载完成');
      
      // 加载完成后创建一个本地备份
      setTimeout(() => {
        saveLocalBackup();
      }, 1000);
      
      // 调用回调函数
      if (onDataLoaded) {
        onDataLoaded(courseDetails, modulesWithLessons);
      }
    } catch (error) {
      console.error('加载课程失败:', error);
      setError(error instanceof Error ? error : new Error('加载课程失败，请重试'));
      setIsLoading(false);
      setLoadingDetails(false);
      setLoadingProgress(0);
      setLoadingMessage('加载失败');
      
      toast.error('加载课程失败，请重试');
      
      // 如果有本地备份，提示用户是否需要恢复
      if (hasBackup) {
        const shouldRestore = window.confirm('加载服务器数据失败，是否从本地备份恢复？');
        if (shouldRestore) {
          restoreFromBackup();
        }
      }
    }
  }, [courseId, onDataLoaded, hasBackup, restoreFromBackup, saveLocalBackup]);

  // 提供一个方法来重新加载课程
  const reloadCourse = useCallback(async () => {
    await loadCourseData();
  }, [loadCourseData]);

  // 初始加载
  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  return {
    course,
    modules,
    isLoading,
    loadingDetails,
    moduleDataLoaded,
    loadingProgress,
    loadingMessage,
    error,
    restoreFromBackup,
    hasBackup,
    reloadCourse
  };
}; 