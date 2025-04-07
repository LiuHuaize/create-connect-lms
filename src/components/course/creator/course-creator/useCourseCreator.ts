import { useState, useEffect, useRef, useCallback } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

export const useCourseCreator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = new URLSearchParams(location.search).get('id');
  
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
  // 添加自动保存相关状态
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // 保存课程的前一个状态，用于比较是否有变更
  const previousCourseRef = useRef<Course | null>(null);
  const previousModulesRef = useRef<CourseModule[] | null>(null);

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
        setCoverImageURL(courseDetails.cover_image || null);
        setLoadingDetails(false);
        
        setTimeout(async () => {
          if (courseDetails.modules) {
            setModules(courseDetails.modules);
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
          setLastSaved(new Date());
        }, 100);
      } catch (error) {
        console.error('加载课程失败:', error);
        toast.error('加载课程失败，请重试');
        setLoadingDetails(false);
        setIsLoading(false);
        setModuleDataLoaded(true);
      }
    };

    loadCourseBasicInfo();
  }, [courseId]);

  useEffect(() => {
    if (user?.id) {
      setCourse(prev => ({ ...prev, author_id: user.id }));
    }
  }, [user]);

  useEffect(() => {
    calculateCompletionPercentage();
  }, [course, modules]);

  // 检测课程内容变更并触发自动保存
  useEffect(() => {
    // 如果课程未加载完成，不执行自动保存
    if (isLoading || !moduleDataLoaded) return;

    // 检查是否有courseId（新建课程未保存时没有id）
    if (!course.id && !courseId) return;

    // 只有当课程或模块发生变化时才触发自动保存
    const hasChanged = checkForChanges();

    if (hasChanged) {
      // 清除之前的定时器
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // 设置新的定时器，延迟3秒自动保存，避免频繁保存
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000);
    }

    // 组件卸载时清除定时器
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [course, modules]);

  // 检查课程内容是否有变更
  const checkForChanges = () => {
    if (!previousCourseRef.current || !previousModulesRef.current) return false;

    // 简单比较课程基本信息
    const courseChanged = 
      previousCourseRef.current.title !== course.title ||
      previousCourseRef.current.description !== course.description ||
      previousCourseRef.current.short_description !== course.short_description ||
      previousCourseRef.current.category !== course.category;

    // 模块数量变更
    if (previousModulesRef.current.length !== modules.length) return true;

    // 简单检测模块内容变更
    // 注意：这不是深度比较，仅作为触发自动保存的简单检查
    const modulesChanged = modules.some((module, index) => {
      const prevModule = previousModulesRef.current![index];
      if (!prevModule) return true;
      
      // 检查模块标题变更
      if (prevModule.title !== module.title) return true;
      
      // 检查课时数量变更
      if ((prevModule.lessons?.length || 0) !== (module.lessons?.length || 0)) return true;
      
      // 简单检查课时内容
      return module.lessons?.some((lesson, lessonIndex) => {
        const prevLesson = prevModule.lessons?.[lessonIndex];
        if (!prevLesson) return true;
        return prevLesson.title !== lesson.title || prevLesson.content !== lesson.content;
      });
    });

    return courseChanged || modulesChanged;
  };

  // 自动保存函数
  const handleAutoSave = async () => {
    // 如果已经在保存中，跳过
    if (isAutoSaving) return;

    try {
      setIsAutoSaving(true);
      
      // 如果没有标题，不进行自动保存
      if (!course.title.trim()) {
        setIsAutoSaving(false);
        return;
      }

      await handleSaveCourse();
      
      // 更新最后保存时间
      setLastSaved(new Date());
      
      // 更新引用值，用于下次比较
      previousCourseRef.current = { ...course };
      previousModulesRef.current = [...modules];
    } catch (error) {
      console.error('自动保存失败:', error);
      // 自动保存失败不显示错误提示，避免干扰用户
    } finally {
      setIsAutoSaving(false);
    }
  };

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

  const handleSaveCourse = async () => {
    try {
      console.log('开始保存课程:', course);
      
      if (!user?.id) {
        throw new Error('用户未登录或无法获取用户ID，请重新登录后再试');
      }
      
      if (!course.title.trim()) {
        toast.error('请填写课程标题');
        return;
      }
      
      // 1. 保存课程基本信息
      const courseToSave = {
        ...course,
        author_id: user.id
      };
      
      console.log('准备发送到后端的课程数据:', courseToSave);
      const savedCourse = await courseService.saveCourse(courseToSave);
      console.log('课程基本信息保存成功:', savedCourse);
      
      setCourse(prev => ({ 
        ...prev, 
        id: savedCourse.id 
      }));
      
      // 2. 保存所有模块和课时
      console.log('开始保存课程模块，数量:', modules.length);
      const savedModules = await Promise.all(
        modules.map(async (module, index) => {
          console.log(`开始保存模块 #${index + 1}:`, module.title);
          const moduleToSave = { ...module };
          
          // 确保使用保存后的课程ID
          if (savedCourse.id) {
            moduleToSave.course_id = savedCourse.id;
          }
          
          // 确保模块ID是有效的UUID
          if (!moduleToSave.id || moduleToSave.id.startsWith('m')) {
            moduleToSave.id = uuidv4();
          }
          
          try {
            const savedModule = await courseService.addCourseModule(moduleToSave);
            console.log(`模块 #${index + 1} 保存成功:`, savedModule.id);

            // 保存模块下的所有课时
            if (module.lessons && module.lessons.length > 0) {
              console.log(`开始保存模块 #${index + 1} 的 ${module.lessons.length} 个课时`);
              const savedLessons = await Promise.all(
                module.lessons.map(async (lesson, lessonIndex) => {
                  // 确保课时的ID是有效的UUID
                  const lessonToSave = { ...lesson };
                  if (!lessonToSave.id || lessonToSave.id.startsWith('l')) {
                    lessonToSave.id = uuidv4();
                  }
                  
                  try {
                    const savedLesson = await courseService.addLesson({
                      ...lessonToSave,
                      module_id: savedModule.id!
                    });
                    console.log(`课时 #${lessonIndex + 1} 保存成功:`, savedLesson.id);
                    return savedLesson;
                  } catch (error) {
                    console.error(`保存课时 #${lessonIndex + 1} 失败:`, error);
                    throw error;
                  }
                })
              );
              console.log(`模块 #${index + 1} 的所有课时保存完成`);
              // 返回模块和已保存的课时
              return {
                ...savedModule,
                lessons: savedLessons
              };
            }

            return savedModule;
          } catch (error) {
            console.error(`保存模块 #${index + 1} 失败:`, error);
            throw error;
          }
        })
      );

      // 如果是新课程，重定向到带有ID的课程编辑页面
      if (!courseId && savedCourse.id) {
        console.log('重定向到课程编辑页面:', savedCourse.id);
        navigate(`/course-creator?id=${savedCourse.id}`, { replace: true });
      }

      console.log('课程保存完成');
      
      // 非自动保存时才显示成功提示
      if (!isAutoSaving) {
        toast.success('课程保存成功');
      }
      
      // 更新模块数据，确保所有模块和课时都有正确的ID
      // 这里的关键是保留原有课时的内容，同时更新ID
      const updatedModules = savedModules.map((savedModule, index) => {
        const originalModule = modules[index];
        return {
          ...savedModule,
          // 如果savedModule已经包含正确的lessons，直接使用它
          // 否则使用原始模块的lessons
          lessons: savedModule.lessons || originalModule.lessons || []
        };
      });
      
      setModules(updatedModules);
      
      // 更新引用值，用于下次比较
      previousCourseRef.current = { ...course, id: savedCourse.id };
      previousModulesRef.current = [...updatedModules];
      
      return savedCourse.id;
    } catch (error) {
      console.error('保存课程失败:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误，请稍后重试或联系支持';
      
      // 非自动保存时才显示错误提示
      if (!isAutoSaving) {
        toast.error(`保存课程失败: ${errorMessage}`);
      }
      throw error;
    }
  };

  const handleBackToSelection = () => {
    navigate('/course-selection');
  };

  return {
    course,
    setCourse,
    modules,
    setModules,
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
    handleSaveCourse,
    handleBackToSelection,
    // 导出自动保存相关状态
    isAutoSaving,
    lastSaved
  };
};
