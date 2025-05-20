import { useState, useEffect, useRef, useCallback } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useNavigate, useLocation } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

// 最大历史记录数量
const MAX_HISTORY_LENGTH = 50;

// 定义历史状态类型
interface HistoryState {
  course: Course;
  modules: CourseModule[];
}

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
    category: null,
    grade_range_min: null,
    grade_range_max: null,
    primary_subject: null,
    secondary_subject: null
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
  // 默认禁用自动保存
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  // 保存课程的前一个状态，用于比较是否有变更
  const previousCourseRef = useRef<Course | null>(null);
  const previousModulesRef = useRef<CourseModule[] | null>(null);

  // 添加历史记录状态
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);

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

          // 初始化历史记录
          const initialState: HistoryState = {
            course: { ...courseDetails },
            modules: [...(courseDetails.modules || [])]
          };
          setHistory([initialState]);
          setHistoryIndex(0);
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

  // 添加课程变更的历史记录
  useEffect(() => {
    // 如果课程未加载完成或是撤销重做操作，不添加历史记录
    if (isLoading || !moduleDataLoaded || isUndoRedoOperation) return;

    // 当课程或模块变化时，添加新的历史记录
    const hasChanged = checkForChanges();

    if (hasChanged) {
      const newState: HistoryState = {
        course: JSON.parse(JSON.stringify(course)),
        modules: JSON.parse(JSON.stringify(modules))
      };

      // 如果处于历史记录中间位置进行了修改，需要删除该位置之后的记录
      if (historyIndex >= 0 && historyIndex < history.length - 1) {
        setHistory(prevHistory => {
          const newHistory = prevHistory.slice(0, historyIndex + 1);
          return [...newHistory, newState].slice(-MAX_HISTORY_LENGTH);
        });
      } else {
        // 正常添加历史记录
        setHistory(prevHistory => [...prevHistory, newState].slice(-MAX_HISTORY_LENGTH));
      }
      
      // 更新索引指向最新记录
      setHistoryIndex(prevIndex => Math.min(prevIndex + 1, MAX_HISTORY_LENGTH - 1));
    }
  }, [course, modules]);

  // 检测课程内容变更并触发自动保存
  useEffect(() => {
    // 如果自动保存被禁用，则不执行任何操作
    if (!autoSaveEnabled) return;
    
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

      // 延长自动保存时间到10秒，减少API调用频率
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave();
      }, 10000); // 从2000ms改为10000ms
    }

    // 组件卸载时清除定时器
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [course, modules, autoSaveEnabled]);

  // 检查课程和模块是否有变化
  const checkForChanges = () => {
    // 如果没有之前的状态参考，认为有变化
    if (!previousCourseRef.current || !previousModulesRef.current) {
      return true;
    }

    // 比较课程基本信息
    const prevCourse = previousCourseRef.current;
    const currentCourse = course;
    
    // 检查主要字段是否改变
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

    // 比较每个模块的内容
    for (let i = 0; i < modules.length; i++) {
      const currentModule = modules[i];
      const prevModule = prevModules[i];

      // 比较模块基本信息
      if (
        currentModule.title !== prevModule.title ||
        currentModule.order_index !== prevModule.order_index
      ) {
        return true;
      }

      // 获取当前模块和前一个状态的课时
      const currentLessons = currentModule.lessons || [];
      const prevLessons = prevModule.lessons || [];

      // 比较课时数量
      if (currentLessons.length !== prevLessons.length) {
        return true;
      }

      // 比较每个课时的内容
      for (let j = 0; j < currentLessons.length; j++) {
        const currentLesson = currentLessons[j];
        const prevLesson = prevLessons[j];

        // 比较课时基本信息
        if (
          currentLesson.title !== prevLesson.title ||
          currentLesson.type !== prevLesson.type ||
          currentLesson.order_index !== prevLesson.order_index ||
          JSON.stringify(currentLesson.content) !== JSON.stringify(prevLesson.content)
        ) {
          return true;
        }
      }
    }

    // 如果所有比较都通过，则没有变化
    return false;
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

      // 添加视觉反馈 - 开始保存
      const toastId = toast.loading('自动保存中...');
      
      await handleSaveCourse();
      
      // 更新最后保存时间
      setLastSaved(new Date());
      
      // 更新引用值，用于下次比较
      previousCourseRef.current = JSON.parse(JSON.stringify(course));
      previousModulesRef.current = JSON.parse(JSON.stringify(modules));
      
      // 更新视觉反馈 - 保存成功
      toast.success('自动保存成功', {
        id: toastId,
        duration: 1500,
      });
    } catch (error) {
      console.error('自动保存失败:', error);
      toast.error('自动保存失败，将稍后重试', {
        duration: 3000,
      });
      
      // 如果自动保存失败，2分钟后重试，增加延迟以减少API调用
      setTimeout(() => {
        if (checkForChanges()) {
          handleAutoSave();
        }
      }, 120000); // 从60000ms改为120000ms
    } finally {
      setIsAutoSaving(false);
    }
  };

  // 撤销操作
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoOperation(true);
      const prevState = history[historyIndex - 1];
      setCourse(JSON.parse(JSON.stringify(prevState.course)));
      setModules(JSON.parse(JSON.stringify(prevState.modules)));
      setHistoryIndex(historyIndex - 1);
      
      // 使用setTimeout确保状态更新后再重置isUndoRedoOperation
      setTimeout(() => {
        setIsUndoRedoOperation(false);
      }, 0);
      
      toast.info('已撤销上次操作', { duration: 1500 });
    } else {
      toast.info('没有可撤销的操作', { duration: 1500 });
    }
  };

  // 重做操作
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoOperation(true);
      const nextState = history[historyIndex + 1];
      setCourse(JSON.parse(JSON.stringify(nextState.course)));
      setModules(JSON.parse(JSON.stringify(nextState.modules)));
      setHistoryIndex(historyIndex + 1);
      
      // 使用setTimeout确保状态更新后再重置isUndoRedoOperation
      setTimeout(() => {
        setIsUndoRedoOperation(false);
      }, 0);
      
      toast.info('已重做操作', { duration: 1500 });
    } else {
      toast.info('没有可重做的操作', { duration: 1500 });
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

  const handleSaveCourse = async (updatedLesson?: Lesson) => {
    try {
      console.log('开始保存课程:', course);
      
      if (!user?.id) {
        throw new Error('用户未登录或无法获取用户ID，请重新登录后再试');
      }
      
      if (!course.title.trim()) {
        toast.error('请填写课程标题');
        return;
      }
      
      // 如果提供了更新后的课时，优先处理它
      if (updatedLesson) {
        console.log('检测到直接传入的更新课时，优先保存:', updatedLesson);
        console.log(`课时标题: "${updatedLesson.title}"，类型: ${updatedLesson.type}`);
        
        // 找到课时所属的模块
        const moduleWithLesson = modules.find(module => 
          module.lessons.some(lesson => lesson.id === updatedLesson.id)
        );
        
        if (moduleWithLesson) {
          try {
            // 创建一个变量来存储更新后的模块状态
            let updatedModulesState: CourseModule[] = [];
            
            // 在保存前先更新React状态，确保最新的数据被保存
            setModules(prevModules => {
              const newModules = prevModules.map(module => {
                if (module.id === moduleWithLesson.id) {
                  return {
                    ...module,
                    lessons: module.lessons.map(lesson => 
                      lesson.id === updatedLesson.id 
                        ? { 
                            ...updatedLesson,
                            // 确保content是对象而不是字符串
                            content: typeof updatedLesson.content === 'string' 
                              ? JSON.parse(updatedLesson.content) 
                              : updatedLesson.content
                          } 
                        : lesson
                    )
                  };
                }
                return module;
              });
              
              // 存储更新后的状态
              updatedModulesState = [...newModules];
              console.log('更新后的模块状态:', newModules);
              return newModules;
            });
            
            // 如果是当前编辑的课时，也更新currentLesson
            if (currentLesson?.id === updatedLesson.id) {
              setCurrentLesson({
                ...updatedLesson,
                // 确保content是对象而不是字符串
                content: typeof updatedLesson.content === 'string'
                  ? JSON.parse(updatedLesson.content)
                  : updatedLesson.content
              });
            }
            
            // 等待状态更新完成
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // 直接保存课时到数据库，使用传入的updatedLesson并确保内容正确
            const lessonToSave = {
              ...updatedLesson,
              module_id: moduleWithLesson.id,
              // 确保content是正确格式
              content: typeof updatedLesson.content === 'string'
                ? JSON.parse(updatedLesson.content)
                : updatedLesson.content
            };
            
            console.log('准备保存到数据库的课时对象:', lessonToSave);
            
            const savedLesson = await courseService.addLesson(lessonToSave);
            
            console.log('课时单独保存成功:', savedLesson);
            toast.success(`课时 "${savedLesson.title}" 已保存`);
            
            // 保存完成，更新引用，使用捕获的最新模块状态
            previousModulesRef.current = JSON.parse(JSON.stringify(updatedModulesState));
            setLastSaved(new Date());
            
            return savedLesson.id;
          } catch (error) {
            console.error('单独保存课时失败:', error);
            toast.error('保存课时失败，请稍后再试');
            throw error;
          }
        } else {
          console.error('找不到课时所属的模块:', updatedLesson.id);
        }
      }
      
      // 如果没有提供单独的课时，或者单独保存失败，继续正常的保存流程
      // 检查并确保所有模块都有标题
      const invalidModules = modules.filter(module => !module.title || module.title.trim() === '');
      if (invalidModules.length > 0) {
        toast.error(`有 ${invalidModules.length} 个模块缺少标题，请填写后再保存`);
        return;
      }
      
      // 检查并确保所有课时都有标题
      let invalidLessons = 0;
      modules.forEach(module => {
        if (module.lessons) {
          invalidLessons += module.lessons.filter(lesson => !lesson.title || lesson.title.trim() === '').length;
        }
      });
      
      if (invalidLessons > 0) {
        toast.error(`有 ${invalidLessons} 个课时缺少标题，请填写后再保存`);
        return;
      }
      
      // 记录当前最新的模块状态，确保保存的是最新编辑的数据
      console.log('当前要保存的模块状态:', JSON.stringify(modules));
      
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
      
      // 创建当前模块数据的深拷贝，确保没有引用问题
      const currentModules = JSON.parse(JSON.stringify(modules));
      
      // 准备模块数据 - 预处理模块以减少数据库请求
      const modulesToProcess = currentModules.map(module => {
        const moduleToSave = { ...module };
        
        // 确保使用保存后的课程ID
        if (savedCourse.id) {
          moduleToSave.course_id = savedCourse.id;
        }
        
        // 确保模块ID是有效的UUID
        if (!moduleToSave.id || moduleToSave.id.startsWith('m')) {
          moduleToSave.id = uuidv4();
        }
        
        // 打印每个模块的标题，用于调试
        console.log(`准备保存模块: ${moduleToSave.id}, 标题: ${moduleToSave.title}`);
        
        // 如果有课时，也打印每个课时的标题
        if (moduleToSave.lessons && moduleToSave.lessons.length > 0) {
          moduleToSave.lessons.forEach(lesson => {
            console.log(`  - 课时: ${lesson.id}, 标题: ${lesson.title}`);
          });
        }
        
        return moduleToSave;
      });
      
      // 收集需要删除的模块和课时ID
      let deletedModuleIds: string[] = [];
      let deletedLessonIdsMap: Record<string, string[]> = {};
      
      // 如果是之前加载的课程，跟踪已删除的模块
      if (courseId && previousModulesRef.current) {
        // 获取所有之前存在但现在已删除的模块ID
        const previousModuleIds = new Set(
          previousModulesRef.current
            .filter(m => m.id && typeof m.id === 'string' && !m.id.startsWith('m'))
            .map(m => m.id as string)
        );
        
        // 获取当前存在的模块ID
        const currentModuleIds = new Set(
          modulesToProcess
            .filter(m => m.id && typeof m.id === 'string')
            .map(m => m.id as string)
        );
        
        // 找出已删除的模块ID（之前有，现在没有）
        deletedModuleIds = Array.from(previousModuleIds)
          .filter(id => !currentModuleIds.has(id));
        
        if (deletedModuleIds.length > 0) {
          console.log(`检测到 ${deletedModuleIds.length} 个已删除的模块，待删除`);
        }
        
        // 预处理每个模块的已删除课时
        modulesToProcess.forEach(module => {
          if (module.id && previousModulesRef.current) {
            const previousModule = previousModulesRef.current.find(m => m.id === module.id);
            if (previousModule && previousModule.lessons) {
              // 获取所有之前存在但现在已删除的课时ID
              const previousLessonIds = new Set(
                previousModule.lessons
                  .filter(l => l.id && typeof l.id === 'string' && !l.id.startsWith('l'))
                  .map(l => l.id as string)
              );
              
              // 获取当前存在的课时ID
              const currentLessonIds = new Set(
                (module.lessons || [])
                  .filter(l => l.id && typeof l.id === 'string')
                  .map(l => l.id as string)
              );
              
              // 找出已删除的课时ID（之前有，现在没有）
              const deletedLessonIds = Array.from(previousLessonIds)
                .filter(id => !currentLessonIds.has(id));
              
              if (deletedLessonIds.length > 0) {
                console.log(`模块 ${module.id}: 检测到 ${deletedLessonIds.length} 个已删除的课时`);
                deletedLessonIdsMap[module.id] = deletedLessonIds;
              }
            }
          }
        });
      }
      
      // 2. 批量删除已移除的课时
      const allDeletedLessonIds = Object.values(deletedLessonIdsMap).flat();
      if (allDeletedLessonIds.length > 0) {
        console.log(`开始批量删除 ${allDeletedLessonIds.length} 个课时`);
        try {
          // 批量删除所有课时，而不是一个一个删除
          for (let i = 0; i < allDeletedLessonIds.length; i += 20) {
            const batch = allDeletedLessonIds.slice(i, i + 20);
            const { error } = await supabase
              .from("lessons")
              .delete()
              .in("id", batch);
              
            if (error) {
              console.error('批量删除课时失败:', error);
              // 继续执行不中断
            }
          }
          console.log('已删除课时批处理完成');
        } catch (error) {
          console.error('批量删除课时过程中出错:', error);
          // 继续执行不中断
        }
      }
      
      // 3. 批量删除已移除的模块
      if (deletedModuleIds.length > 0) {
        console.log(`开始批量删除 ${deletedModuleIds.length} 个模块`);
        try {
          // 批量删除所有模块，而不是一个一个删除
          for (let i = 0; i < deletedModuleIds.length; i += 20) {
            const batch = deletedModuleIds.slice(i, i + 20);
            const { error } = await supabase
              .from("course_modules")
              .delete()
              .in("id", batch);
              
            if (error) {
              console.error('批量删除模块失败:', error);
              // 继续执行不中断
            }
          }
          console.log('已删除模块批处理完成');
        } catch (error) {
          console.error('批量删除模块过程中出错:', error);
          // 继续执行不中断
        }
      }
      
      // 4. 保存所有模块 - 批量处理模块
      console.log('开始保存课程模块，数量:', modulesToProcess.length);
      const savedModulesMap: Record<string, CourseModule> = {};
      
      // 每次最多处理10个模块
      for (let i = 0; i < modulesToProcess.length; i += 10) {
        const moduleBatch = modulesToProcess.slice(i, i + 10);
        
        try {
          const modulePromises = moduleBatch.map(async moduleToSave => {
            try {
              // 再次确认模块标题不为空
              if (!moduleToSave.title || moduleToSave.title.trim() === '') {
                console.error(`模块 ${moduleToSave.id} 标题为空，设置默认标题`);
                moduleToSave.title = `未命名模块 ${Date.now()}`;
              }
              
              const savedModule = await courseService.addCourseModule(moduleToSave);
              console.log(`模块保存成功 - ID: ${savedModule.id}, 标题: ${savedModule.title}`);
              savedModulesMap[moduleToSave.id] = savedModule;
              return savedModule;
            } catch (error) {
              console.error(`保存模块 ${moduleToSave.title} 失败:`, error);
              throw error;
            }
          });
          
          await Promise.all(modulePromises);
        } catch (error) {
          console.error(`批量保存模块失败:`, error);
          // 继续处理其他批次
        }
      }
      
      // 5. 处理所有课时 - 按模块分批保存
      const savedModulesWithLessons: CourseModule[] = [];
      
      for (const module of modulesToProcess) {
        const savedModule = savedModulesMap[module.id];
        
        if (!savedModule) {
          console.error(`模块 ${module.id} 保存失败，跳过其课时保存`);
          continue;
        }
        
        const moduleWithLessons = { ...savedModule, lessons: [] };
        
        if (module.lessons && module.lessons.length > 0) {
          console.log(`开始保存模块 ${savedModule.id} (${savedModule.title}) 的 ${module.lessons.length} 个课时`);
          
          // 每次最多处理20个课时
          for (let i = 0; i < module.lessons.length; i += 20) {
            const lessonBatch = module.lessons.slice(i, i + 20);
            
            try {
              const lessonPromises = lessonBatch.map(async (lesson, lessonIndex) => {
                // 确保课时的ID是有效的UUID
                const lessonToSave = { ...lesson };
                if (!lessonToSave.id || lessonToSave.id.startsWith('l')) {
                  lessonToSave.id = uuidv4();
                }
                
                // 再次确认课时标题不为空
                if (!lessonToSave.title || lessonToSave.title.trim() === '') {
                  console.error(`课时 ${lessonToSave.id} 标题为空，设置默认标题`);
                  lessonToSave.title = `未命名课时 ${Date.now()}`;
                }
                
                try {
                  const savedLesson = await courseService.addLesson({
                    ...lessonToSave,
                    module_id: savedModule.id
                  });
                  console.log(`课时保存成功 - ID: ${savedLesson.id}, 标题: ${savedLesson.title}`);
                  return savedLesson;
                } catch (error) {
                  console.error(`保存课时 ${lessonToSave.title} 失败:`, error);
                  throw error;
                }
              });
              
              const savedLessonsBatch = await Promise.all(lessonPromises);
              moduleWithLessons.lessons = [...moduleWithLessons.lessons, ...savedLessonsBatch];
            } catch (error) {
              console.error(`批量保存课时失败:`, error);
              // 继续处理其他批次
            }
          }
        }
        
        savedModulesWithLessons.push(moduleWithLessons);
      }

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
      
      // 更新模块数据，确保所有模块和课时都有正确的ID，使用保存后的最新数据
      setModules(savedModulesWithLessons);
      
      // Update reference values after successful manual save
      previousCourseRef.current = JSON.parse(JSON.stringify(savedCourse)); 
      previousModulesRef.current = JSON.parse(JSON.stringify(savedModulesWithLessons));
      setLastSaved(new Date()); // Also update last saved time

      console.log('课程及其所有模块和课时已成功保存。最新模块数据:', savedModulesWithLessons);
      toast.success('课程已保存');
      
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
    lastSaved,
    // 导出自动保存开关控制
    autoSaveEnabled,
    setAutoSaveEnabled,
    // 导出撤销重做功能
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    handleUndo,
    handleRedo
  };
};
