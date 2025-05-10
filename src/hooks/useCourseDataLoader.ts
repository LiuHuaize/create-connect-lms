import { useState, useEffect, useCallback } from 'react';
import { Course, CourseModule, Lesson, LessonContent } from '@/types/course';
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
      setLoadingMessage('正在加载课程数据...');
      setError(null);

      // 首先尝试使用Edge Function优化版本加载课程数据
      try {
        const moduleId = null; // 首次加载时没有当前模块
        const mode = 'learning'; // 使用学习模式加载
        
        setLoadingProgress(20);
        setLoadingMessage('请求优化课程数据...');
        
        // 使用优化的方法获取所有必要数据
        const courseWithModules = await courseService.getCourseOptimized(courseId, mode, moduleId);
        
        // 更新课程信息
        setCourse(courseWithModules);
        setLoadingProgress(60);
        
        // 更新模块信息
        if (courseWithModules.modules && courseWithModules.modules.length > 0) {
          setModules(courseWithModules.modules);
          setLoadingProgress(100);
          
          // 找到知识学习模块或第一个模块作为默认展开
          const knowledgeModule = courseWithModules.modules.find(m => m.title.includes('知识学习'));
          const defaultExpandedModule = knowledgeModule || courseWithModules.modules[0];
          
          // 全部加载完成
          setModuleDataLoaded(true);
          setIsLoading(false);
          setLoadingMessage('课程加载完成');
          
          // 加载完成后创建一个本地备份
          setTimeout(() => {
            if (typeof window.gc === 'function') {
              try {
                window.gc();
              } catch (e) {}
            }
            
            saveLocalBackup();
          }, 1000);
          
          // 调用回调函数
          if (onDataLoaded) {
            onDataLoaded(courseWithModules, courseWithModules.modules);
          }
          
          return; // 成功使用优化方法，直接返回
        }
      } catch (error) {
        console.warn('优化加载方法失败，回退到传统方法:', error);
        // 回退到传统方法，继续执行
      }
      
      // 如果优化方法失败，使用传统方法进行批量加载
      setLoadingMessage('正在使用传统方法加载课程...');
      setLoadingProgress(10);
      
      // 1. 获取课程基本信息
      const courseInfo = await courseService.getCourseBasicInfo(courseId);
      setCourse(courseInfo);
      setLoadingProgress(20);
      
      // 2. 获取课程模块结构 (不包含课时)
      const moduleStructures = await courseService.getCourseModules(courseId);
      setLoadingProgress(30);
      
      if (!moduleStructures || moduleStructures.length === 0) {
        // 没有模块，直接完成
        setModules([]);
        setModuleDataLoaded(true);
        setIsLoading(false);
        setLoadingProgress(100);
        setLoadingMessage('课程加载完成 (无模块)');
        
        if (onDataLoaded) {
          onDataLoaded(courseInfo, []);
        }
        return;
      }
      
      // 3. 分批加载模块数据
      setLoadingMessage('分批加载模块内容...');
      
      // 初始化带空课时列表的模块
      const allModules = moduleStructures.map(module => ({ ...module, lessons: [] }));
      setModules(allModules);
      
      // 分批次加载，每批次1个模块，并添加延迟
      // 修改为每批1个模块，让UI线程有机会执行，减轻内存压力
      const batchSize = 1;
      let loadedModulesCount = 0;
      
      for (let i = 0; i < moduleStructures.length; i += batchSize) {
        const batch = moduleStructures.slice(i, i + batchSize);
        const batchModuleIds = batch.map(m => m.id!).filter(Boolean);
        
        try {
          setLoadingMessage(`加载模块 ${i+1} - ${Math.min(i+batchSize, moduleStructures.length)} / ${moduleStructures.length}`);
          
          // 批量获取课时
          const lessonsByModuleId = await courseService.getModuleLessonsBatch(batchModuleIds);
          
          // 更新模块列表
          setModules(currentModules => {
            return currentModules.map(module => {
              if (module.id && batchModuleIds.includes(module.id)) {
                return {
                  ...module,
                  lessons: module.id ? (lessonsByModuleId[module.id] || []) : []
                };
              }
              return module;
            });
          });
          
          loadedModulesCount += batch.length;
          const progress = Math.min(30 + Math.floor((loadedModulesCount / moduleStructures.length) * 70), 100);
          setLoadingProgress(progress);
          
          // 添加150ms延迟，让UI线程有机会执行，减轻内存压力
          if (i + batchSize < moduleStructures.length) {
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        } catch (batchError) {
          console.error(`加载模块批次 ${i+1}-${Math.min(i+batchSize, moduleStructures.length)} 失败:`, batchError);
          // 继续加载其他批次，不中断整体流程
        }
      }
      
      // 4. 全部加载完成
      setModuleDataLoaded(true);
      setIsLoading(false);
      setLoadingProgress(100);
      setLoadingMessage('课程加载完成');
      
      // 尝试回收内存
      if (typeof window.gc === 'function') {
        try {
          window.gc();
        } catch (e) {}
      }
      
      // 保存本地备份
      setTimeout(() => saveLocalBackup(), 1000);
      
      // 调用回调函数
      if (onDataLoaded) {
        onDataLoaded(courseInfo, allModules);
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