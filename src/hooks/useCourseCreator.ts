import { useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

// 导入拆分后的钩子
import { useCourseHistory } from './useCourseHistory';
import { useCourseSave } from './useCourseSave';
import { useCourseAutoSave } from './useCourseAutoSave';
import { useLocalBackup } from './useLocalBackup';
import { useCourseBasics } from './useCourseBasics';
import { useCourseModules } from './useCourseModules';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 课程创建器主Hook - 组合多个专门Hook提供完整的课程创建功能
 * 
 * 这是一个高级Hook，负责协调多个专门Hook的交互，提供统一的API
 */
export const useCourseCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  
  // 前一个状态的引用，用于状态比较
  const previousCourseRef = useRef(null);
  const previousModulesRef = useRef(null);
  
  // 使用课程基本信息Hook
  const {
    course,
    setCourse,
    coverImageURL,
    setCoverImageURL,
    completionPercentage,
    // 其他方法...
  } = useCourseBasics({
    onCourseChange: (updatedCourse) => {
      // 更新到历史记录钩子
      historyCourse(updatedCourse);
    }
  });
  
  // 使用课程模块Hook
  const {
    modules,
    setModules,
    currentLesson,
    setCurrentLesson,
    expandedModule,
    setExpandedModule,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
    // 其他方法...
  } = useCourseModules({
    onModulesChange: (updatedModules) => {
      // 更新到历史记录钩子
      historyModules(updatedModules);
    }
  });
  
  // 使用历史记录Hook
  const {
    canUndo,
    canRedo,
    handleUndo: undo,
    handleRedo: redo,
    setCourse: historyCourse,
    setModules: historyModules,
    isUndoRedoOperation
  } = useCourseHistory({
    course,
    modules,
    isLoading: false,
    moduleDataLoaded: true
  });
  
  // 使用课程保存Hook
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
        setCourse({ ...course, id: savedCourse.id });
      }
    }
  });
  
  // 使用自动保存Hook
  const {
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    retryCount,
    timeUntilNextSave
  } = useCourseAutoSave({
    courseId,
    course,
    modules,
    previousCourseRef,
    previousModulesRef,
    isLoading: false,
    moduleDataLoaded: true,
    saveCourse,
    enabled: false // 默认关闭自动保存
  });
  
  // 使用本地备份Hook (只提供API，不使用其内部状态，因为我们已在其他Hook中使用)
  const {
    hasBackup,
    saveLocalBackup,
    clearBackup,
    backupTimestamp
  } = useLocalBackup({
    courseId,
    course,
    modules,
    isLoading: false, 
    moduleDataLoaded: true
  });
  
  // 清除之前的备份
  useEffect(() => {
    // 清理所有备份
    clearBackup();
    console.log('已禁用自动备份功能并清除现有备份');
  }, [clearBackup]);
  
  // 删除自动保存逻辑，改为在离开时提示用户保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        const message = "您有未保存的更改，如果离开页面将丢失这些更改。";
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [course, modules]);
  
  // 导航到创建新课程页面
  const handleCreateNewCourse = () => {
    navigate('/course-creator');
  };
  
  // 导航到课程选择页面
  const handleBackToSelection = () => {
    navigate('/course-selection');
  };
  
  // 发布课程
  const handlePublishCourse = async () => {
    if (!course.title.trim()) {
      toast.error('发布前请输入课程标题');
      return;
    }
    
    if (!course.id) {
      // 先保存课程，获取ID
      await saveCourse();
      if (!course.id) {
        toast.error('发布失败，请先保存课程');
        return;
      }
    }
    
    // 更新课程状态
    setCourse({ ...course, status: 'published' });
    await saveCourse();
    toast.success('课程已发布');
  };
  
  // 预览课程
  const handlePreviewCourse = () => {
    if (!course.id) {
      toast.error('预览前请先保存课程');
      return;
    }
    
    // 打开预览窗口
    window.open(`/course/${course.id}?preview=true`, '_blank');
  };
  
  // 检查是否有未保存的更改
  const hasUnsavedChanges = () => {
    if (!previousCourseRef.current || !previousModulesRef.current) return false;
    
    // 这里简化了比较逻辑
    return JSON.stringify(course) !== JSON.stringify(previousCourseRef.current) ||
           JSON.stringify(modules) !== JSON.stringify(previousModulesRef.current);
  };
  
  // 更新引用，用于比较是否有更改
  if (course && modules) {
    previousCourseRef.current = { ...course };
    previousModulesRef.current = [...modules];
  }
  
  return {
    // 基本状态
    user,
    courseId,
    course,
    modules,
    currentLesson,
    expandedModule,
    coverImageURL,
    completionPercentage,
    
    // 加载和保存状态
    isSaving,
    saveCourseStatus,
    lastSavedTime,
    
    // 历史记录状态和方法
    canUndo,
    canRedo,
    undo,
    redo,
    
    // 自动保存状态和方法
    isAutoSaving,
    lastSaved,
    autoSaveEnabled,
    setAutoSaveEnabled,
    autoSaveStatus,
    retryCount,
    timeUntilNextSave,
    
    // 本地备份状态和方法
    hasBackup,
    saveLocalBackup,
    clearBackup,
    backupTimestamp,
    
    // 设置方法
    setCourse,
    setModules,
    setCurrentLesson,
    setExpandedModule,
    setCoverImageURL,
    
    // 课程模块操作方法
    createModule,
    updateModule,
    deleteModule,
    
    // 课时操作方法
    createLesson,
    updateLesson,
    deleteLesson,
    
    // 高级操作方法
    handleCreateNewCourse,
    handleBackToSelection,
    handlePublishCourse,
    handlePreviewCourse,
    saveCourse,
    hasUnsavedChanges
  };
}; 