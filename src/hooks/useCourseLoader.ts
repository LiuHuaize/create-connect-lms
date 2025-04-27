import { useState, useEffect, useCallback } from 'react';
import { Course, CourseModule } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useLocalBackup } from './useLocalBackup';

interface UseCourseLoaderProps {
  courseId: string | null;
  onDataLoaded?: (course: Course, modules: CourseModule[]) => void;
  initialLoadingState?: boolean;
}

/**
 * 处理课程数据加载的Hook
 * 
 * 负责异步加载课程数据、跟踪加载状态和处理错误，以及本地备份恢复功能
 */
export const useCourseLoader = ({
  courseId,
  onDataLoaded,
  initialLoadingState = false
}: UseCourseLoaderProps) => {
  // 课程和模块状态
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    short_description: '',
    author_id: '',
    status: 'draft',
    price: null,
    tags: [],
    category: null
  });
  const [modules, setModules] = useState<CourseModule[]>([]);
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(initialLoadingState);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('准备加载课程...');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [moduleDataLoaded, setModuleDataLoaded] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 使用本地备份钩子
  const {
    hasBackup,
    saveLocalBackup,
    restoreFromBackup,
    clearBackup,
    backupTimestamp
  } = useLocalBackup({
    courseId,
    course,
    modules,
    isLoading,
    moduleDataLoaded
  });
  
  // 加载课程数据
  const loadCourseData = useCallback(async () => {
    if (!courseId) {
      setLoadingDetails(false);
      setIsLoading(false);
      setModuleDataLoaded(true);
      setError(null);
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      setLoadingDetails(true);
      setModuleDataLoaded(false);
      setLoadingProgress(10);
      setLoadingMessage('加载课程基本信息...');
      
      // 加载课程基本信息
      const courseDetails = await courseService.getCourseDetails(courseId);
      
      setCourse(courseDetails);
      setLoadingProgress(50);
      setLoadingMessage('加载课程模块和课时...');
      setLoadingDetails(false);
      
      // 短暂延迟后设置模块数据，提供更好的加载体验
      setTimeout(() => {
        if (courseDetails.modules) {
          setModules(courseDetails.modules);
          
          // 通知外部组件数据已加载
          if (onDataLoaded) {
            onDataLoaded(courseDetails, courseDetails.modules);
          }
        }
        
        setLoadingProgress(100);
        setLoadingMessage('加载完成');
        setModuleDataLoaded(true);
        setIsLoading(false);
        
        // 检查是否有本地备份，如果有且比服务器数据新，提示恢复
        if (hasBackup && backupTimestamp) {
          const serverUpdateTime = new Date(courseDetails.updated_at || 0).getTime();
          if (backupTimestamp > serverUpdateTime) {
            const shouldRestore = window.confirm(
              `发现比服务器更新的本地备份 (${new Date(backupTimestamp).toLocaleString()})，是否恢复？`
            );
            
            if (shouldRestore) {
              const backupData = restoreFromBackup();
              if (backupData) {
                setCourse(backupData.course);
                setModules(backupData.modules);
                
                // 通知外部组件数据已从备份恢复
                if (onDataLoaded) {
                  onDataLoaded(backupData.course, backupData.modules);
                }
                
                toast.success('已从本地备份恢复数据');
              }
            } else {
              // 用户选择不恢复，清除旧备份
              clearBackup();
            }
          } else {
            // 备份较旧，清除它
            clearBackup();
          }
        }
      }, 300);
    } catch (err) {
      console.error('加载课程失败:', err);
      setError(err instanceof Error ? err : new Error('加载课程失败'));
      setLoadingDetails(false);
      setIsLoading(false);
      setModuleDataLoaded(true);
      setLoadingProgress(0);
      
      // 如果有本地备份，引导用户使用restoreFromBackup函数恢复数据
      // (实际恢复将在调用组件中进行)
    }
  }, [courseId, onDataLoaded, hasBackup, backupTimestamp, restoreFromBackup, clearBackup]);
  
  // 当courseId改变时，重新加载课程数据
  useEffect(() => {
    loadCourseData();
  }, [courseId, loadCourseData]);
  
  // 手动重新加载课程函数
  const reloadCourse = () => {
    loadCourseData();
  };
  
  // 从备份恢复课程数据
  const restoreFromBackupAndUpdate = () => {
    const backupData = restoreFromBackup();
    if (backupData) {
      setCourse(backupData.course);
      setModules(backupData.modules);
      
      // 通知外部组件数据已从备份恢复
      if (onDataLoaded) {
        onDataLoaded(backupData.course, backupData.modules);
      }
      
      toast.success('已从本地备份恢复数据');
      return true;
    }
    return false;
  };
  
  return {
    // 状态
    course,
    modules,
    isLoading,
    loadingProgress,
    loadingMessage,
    loadingDetails,
    moduleDataLoaded,
    error,
    
    // 备份相关
    hasBackup,
    backupTimestamp,
    saveLocalBackup,
    
    // 方法
    reloadCourse,
    restoreFromBackup: restoreFromBackupAndUpdate,
    clearBackup
  };
}; 