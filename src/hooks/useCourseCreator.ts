import { useState, useEffect, useRef } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// 引入拆分后的钩子
import { useCourseHistory } from './useCourseHistory';
import { useCourseSave } from './useCourseSave';
import { useCourseAutoSave } from './useCourseAutoSave';
import { useLocalBackup } from './useLocalBackup';

export const useCourseCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  
  // 基本状态
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    short_description: '',
    author_id: user?.id || '',
    status: 'draft',
    price: null,
    tags: [],
    category: null
  });

  const [modules, setModules] = useState<CourseModule[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [moduleDataLoaded, setModuleDataLoaded] = useState(true);
  
  // 前一个状态的引用，用于状态比较
  const previousCourseRef = useRef<Course | null>(null);
  const previousModulesRef = useRef<CourseModule[] | null>(null);

  // 使用钩子管理不同功能
  const {
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    setCourse: historyCourse,
    setModules: historyModules,
    isUndoRedoOperation
  } = useCourseHistory({
    course,
    modules,
    isLoading,
    moduleDataLoaded
  });

  const {
    isSaving,
    handleSaveCourse: saveCourse,
    saveCourseStatus,
    lastSavedTime
  } = useCourseSave({
    course,
    modules,
    previousCourseRef,
    previousModulesRef,
    onCourseSaved: (savedCourse, savedModules) => {
      if (!course.id && savedCourse.id) {
        setCourse(prev => ({ ...prev, id: savedCourse.id }));
      }
    }
  });

  const {
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled
  } = useCourseAutoSave({
    courseId,
    course,
    modules,
    previousCourseRef,
    previousModulesRef,
    isLoading,
    moduleDataLoaded,
    saveCourse,
    enabled: false // 默认关闭自动保存
  });

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

  // 包装历史记录钩子的状态更新函数
  const updateCourse = (newCourse: Course | ((prev: Course) => Course)) => {
    if (typeof newCourse === 'function') {
      setCourse(prev => {
        const result = newCourse(prev);
        historyCourse(result);
        return result;
      });
    } else {
      setCourse(newCourse);
      historyCourse(newCourse);
    }
  };

  const updateModules = (newModules: CourseModule[] | ((prev: CourseModule[]) => CourseModule[])) => {
    if (typeof newModules === 'function') {
      setModules(prev => {
        const result = newModules(prev);
        historyModules(result);
        return result;
      });
    } else {
      setModules(newModules);
      historyModules(newModules);
    }
  };

  // 加载课程数据
  useEffect(() => {
    const loadCourseBasicInfo = async () => {
      if (!courseId) {
        setLoadingDetails(false);
        setIsLoading(false);
        setModuleDataLoaded(true);
        return;
      }
      
      try {
        setIsLoading(true);
        setLoadingDetails(true);
        setModuleDataLoaded(false);
        
        const courseDetails = await courseService.getCourseDetails(courseId);
        
        setCourse(courseDetails);
        historyCourse(courseDetails);
        setCoverImageURL(courseDetails.cover_image || null);
        setLoadingDetails(false);
        
        setTimeout(async () => {
          if (courseDetails.modules) {
            setModules(courseDetails.modules);
            historyModules(courseDetails.modules);
            // 如果有模块，将第一个模块设置为展开状态
            if (courseDetails.modules.length > 0) {
              setExpandedModule(courseDetails.modules[0].id);
            }
          }
          setModuleDataLoaded(true);
          setIsLoading(false);
          
          // 加载完成后，设置初始的引用状态
          previousCourseRef.current = { ...courseDetails };
          previousModulesRef.current = [...(courseDetails.modules || [])];
          
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
                  updateCourse(backupData.course);
                  updateModules(backupData.modules);
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
        }, 100);
      } catch (error) {
        console.error('加载课程失败:', error);
        toast.error('加载课程失败，请重试');
        setLoadingDetails(false);
        setIsLoading(false);
        setModuleDataLoaded(true);
        
        // 如果有本地备份，尝试从备份恢复
        if (hasBackup) {
          const shouldRestore = window.confirm('加载服务器数据失败，是否从本地备份恢复？');
          if (shouldRestore) {
            const backupData = restoreFromBackup();
            if (backupData) {
              updateCourse(backupData.course);
              updateModules(backupData.modules);
              toast.success('已从本地备份恢复数据');
              setLoadingDetails(false);
              setIsLoading(false);
              setModuleDataLoaded(true);
            }
          }
        }
      }
    };

    loadCourseBasicInfo();
  }, [courseId]);

  // 确保用户ID总是最新的
  useEffect(() => {
    if (user?.id) {
      updateCourse(prev => ({ ...prev, author_id: user.id }));
    }
  }, [user]);

  // 计算完成度百分比
  useEffect(() => {
    calculateCompletionPercentage();
  }, [course, modules]);

  // 计算课程完成度
  const calculateCompletionPercentage = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    totalPoints += 1;
    if (course.title?.trim()) earnedPoints += 1;
    
    totalPoints += 1;
    if (coverImageURL || course.cover_image) earnedPoints += 1;
    
    totalPoints += 1;
    if (modules.length > 0) earnedPoints += 1;
    
    totalPoints += 1;
    const hasLessons = modules.some(module => module.lessons && module.lessons.length > 0);
    if (hasLessons) earnedPoints += 0.5;
    
    if (course.description?.trim()) earnedPoints += 0.5;
    if (course.short_description?.trim()) earnedPoints += 0.5;
    
    const percentage = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
    setCompletionPercentage(percentage);
  };

  // 返回课程选择页面
  const handleBackToSelection = () => {
    navigate('/course-selection');
  };

  return {
    // 基本状态
    course,
    setCourse: updateCourse,
    modules,
    setModules: updateModules,
    currentLesson,
    setCurrentLesson,
    expandedModule,
    setExpandedModule,
    coverImageURL,
    setCoverImageURL,
    completionPercentage,
    isLoading,
    loadingDetails,
    moduleDataLoaded,
    
    // 保存相关
    isSaving,
    handleSaveCourse: saveCourse,
    saveCourseStatus,
    handleBackToSelection,
    
    // 自动保存相关
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    
    // 历史记录相关
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    
    // 本地备份相关
    hasBackup,
    saveLocalBackup,
    restoreFromBackup,
    clearBackup
  };
}; 