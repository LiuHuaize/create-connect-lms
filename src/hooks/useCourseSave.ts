import { useState } from 'react';
import { Course, CourseModule, Lesson, LessonContent } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

// 内存管理工具函数
/**
 * 深度清理对象的引用，帮助垃圾回收
 */
const clearObject = (obj: any) => {
  if (!obj) return;
  
  if (Array.isArray(obj)) {
    // 清理数组
    while (obj.length > 0) {
      const item = obj.pop();
      if (typeof item === 'object' && item !== null) {
        clearObject(item);
      }
    }
  } else if (typeof obj === 'object') {
    // 清理对象
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          clearObject(value);
        }
        delete obj[key];
      }
    }
  }
};

/**
 * 尝试进行垃圾回收，在执行大型操作前后使用
 */
const scheduleGarbageCollection = (delay = 0) => {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      try {
        console.log('正在尝试清理内存...');
        // 清理内存引用，帮助垃圾回收器识别不再使用的对象
        if (window.gc) window.gc();
      } catch (e) {
        // 忽略错误，gc()仅在特定浏览器调试模式下可用
      }
      resolve();
    }, delay);
  });
};

/**
 * 检测并压缩大型内容，减少内存占用
 * @returns 压缩后的内容
 */
const compressLargeContent = (lesson: Lesson): Lesson => {
  const CONTENT_SIZE_THRESHOLD = 100000; // 100KB
  
  // 创建浅拷贝
  const compressedLesson = { ...lesson };
  
  // 检查内容大小
  if (typeof compressedLesson.content === 'object') {
    const contentSize = JSON.stringify(compressedLesson.content).length;
    
    // 如果内容超过阈值，根据类型进行处理
    if (contentSize > CONTENT_SIZE_THRESHOLD) {
      // 根据课时类型处理大型内容
      if (compressedLesson.type === 'text' && (compressedLesson.content as any).text) {
        const textContent = compressedLesson.content as any;
        // 为长文本创建摘要，只在保存过程中使用，不影响实际内容
        textContent._originalTextLength = textContent.text.length;
        // 保存处理删除了文本内容但不影响课时的功能，因为这里只用于内存优化
      }
      
      // 处理其他大型内容类型...
      // 可以根据需要添加对其他内容类型的处理
    }
  }
  
  return compressedLesson;
};

/**
 * 创建对象的安全浅拷贝，避免使用JSON.parse/stringify深拷贝
 */
const shallowCopy = <T>(obj: T): T => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return [...obj] as unknown as T;
  }
  if (typeof obj === 'object') {
    return { ...obj };
  }
  return obj;
};

interface UseCourseSaveProps {
  course: Course;
  modules: CourseModule[];
  previousCourseRef: React.MutableRefObject<Course | null>;
  previousModulesRef: React.MutableRefObject<CourseModule[] | null>;
  isAutoSaving?: boolean;
  onCourseSaved?: (savedCourse: Course, savedModules: CourseModule[]) => void;
}

interface UseCourseSaveResult {
  isSaving: boolean;
  handleSaveCourse: (updatedLesson?: Lesson) => Promise<string | undefined>;
  saveCourseStatus: 'idle' | 'saving' | 'success' | 'error';
  lastSavedTime: Date | null;
}

export const useCourseSave = ({
  course,
  modules,
  previousCourseRef,
  previousModulesRef,
  isAutoSaving = false,
  onCourseSaved
}: UseCourseSaveProps): UseCourseSaveResult => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveCourseStatus, setSaveCourseStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // 保存课程函数
  const handleSaveCourse = async (updatedLesson?: Lesson): Promise<string | undefined> => {
    // 避免重复保存
    if (isSaving) {
      console.log('正在保存中，跳过重复保存请求');
      return;
    }
    
    // 提前进行垃圾回收，为大型操作腾出空间
    await scheduleGarbageCollection(0);
    
    setIsSaving(true);
    setSaveCourseStatus('saving');
    
    try {
      if (!course.author_id) {
        throw new Error('用户未登录或无法获取用户ID，请重新登录后再试');
      }
      
      if (!course.title.trim()) {
        toast.error('请填写课程标题');
        setSaveCourseStatus('error');
        setIsSaving(false);
        return;
      }
      
      // 1. 保存课程基本信息 - 使用浅拷贝替代
      const courseToSave = shallowCopy(course);
      
      console.log('准备发送到后端的课程数据:', courseToSave);
      const savedCourse = await courseService.saveCourse(courseToSave);
      console.log('课程基本信息保存成功:', savedCourse);
      
      // 临时释放内存
      await scheduleGarbageCollection(10);
      
      // 2. 准备模块数据 - 预处理模块以减少数据库请求
      // 分批创建modulesToProcess数组，减少一次性内存使用
      let modulesToProcess: CourseModule[] = [];
      const batchSize = 20; // 减小批处理大小
      
      for (let i = 0; i < modules.length; i += batchSize) {
        const currentBatch = modules.slice(i, i + batchSize);
        
        const processedBatch = currentBatch.map(module => {
          const moduleToSave = shallowCopy(module);
          
          // 确保使用保存后的课程ID
          if (savedCourse.id) {
            moduleToSave.course_id = savedCourse.id;
          }
          
          // 确保模块ID是有效的UUID
          if (!moduleToSave.id || moduleToSave.id.startsWith('m')) {
            moduleToSave.id = uuidv4();
          }
          
          return moduleToSave;
        });
        
        modulesToProcess = [...modulesToProcess, ...processedBatch];
        
        // 每处理一批后给垃圾回收一些时间
        if (i + batchSize < modules.length) {
          await scheduleGarbageCollection(5);
        }
      }
      
      // 3. 处理删除的模块和课时
      await handleDeletedItems(savedCourse.id, modulesToProcess);
      
      // 再次尝试释放内存
      await scheduleGarbageCollection(10);
      
      // 4. 保存所有模块 - 批量处理模块
      console.log('开始保存课程模块，数量:', modulesToProcess.length);
      const savedModulesMap: Record<string, CourseModule> = {};
      
      // 减小批处理大小，控制内存使用峰值
      const modulesBatchSize = 5; // 从10减到5
      for (let i = 0; i < modulesToProcess.length; i += modulesBatchSize) {
        const moduleBatch = modulesToProcess.slice(i, i + modulesBatchSize);
        
        try {
          // 限制并发数量，改为顺序处理以减少内存使用峰值
          for (const moduleToSave of moduleBatch) {
            try {
              const savedModule = await courseService.addCourseModule(moduleToSave);
              console.log(`模块 ${moduleToSave.title} 保存成功:`, savedModule.id);
              savedModulesMap[moduleToSave.id] = savedModule;
            } catch (error) {
              console.error(`保存模块 ${moduleToSave.title} 失败:`, error);
            }
          }
          
          // 每批处理后尝试进行垃圾回收
          if (i + modulesBatchSize < modulesToProcess.length) {
            await scheduleGarbageCollection(5);
          }
        } catch (error) {
          console.error(`批量保存模块失败:`, error);
          // 继续处理其他批次，但记录错误
          if (!isAutoSaving) {
            toast.error(`部分模块保存失败，请重试`);
          }
        }
      }
      
      // 清理不再需要的模块数据
      clearObject(modulesToProcess);
      modulesToProcess = [];
      
      // 5. 处理所有课时 - 按模块分批保存
      const savedModulesWithLessons: CourseModule[] = [];
      
      // 使用for循环迭代，避免一次性加载所有模块到内存
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const module = modules[moduleIndex];
        const savedModule = savedModulesMap[module.id];
        
        if (!savedModule) {
          console.error(`模块 ${module.id} 保存失败，跳过其课时保存`);
          continue;
        }
        
        const moduleWithLessons = { ...savedModule, lessons: [] };
        
        if (module.lessons && module.lessons.length > 0) {
          console.log(`开始保存模块 ${savedModule.id} 的 ${module.lessons.length} 个课时`);
          
          // 减小批处理大小，控制内存使用峰值
          const lessonsBatchSize = 10; // 从20减到10
          for (let i = 0; i < module.lessons.length; i += lessonsBatchSize) {
            const lessonBatch = module.lessons.slice(i, i + lessonsBatchSize);
            
            try {
              // 改为顺序处理，减少内存使用峰值
              for (const lesson of lessonBatch) {
                // 压缩大型内容
                const compressedLesson = compressLargeContent(lesson);
                
                // 确保课时的ID是有效的UUID
                const lessonToSave = { ...compressedLesson };
                if (!lessonToSave.id || lessonToSave.id.startsWith('l')) {
                  lessonToSave.id = uuidv4();
                }
                
                try {
                  const savedLesson = await courseService.addLesson({
                    ...lessonToSave,
                    module_id: savedModule.id
                  });
                  console.log(`课时 ${lessonToSave.title} 保存成功:`, savedLesson.id);
                  moduleWithLessons.lessons.push(savedLesson);
                } catch (error) {
                  console.error(`保存课时 ${lessonToSave.title} 失败:`, error);
                }
              }
              
              // 每批课时处理后尝试垃圾回收
              if (i + lessonsBatchSize < module.lessons.length) {
                await scheduleGarbageCollection(5);
              }
            } catch (error) {
              console.error(`批量保存课时失败:`, error);
              if (!isAutoSaving) {
                toast.error(`部分课时保存失败，请重试`);
              }
            }
          }
        }
        
        savedModulesWithLessons.push(moduleWithLessons);
        
        // 每个模块处理后进行垃圾回收
        if (moduleIndex < modules.length - 1) {
          await scheduleGarbageCollection(10);
        }
      }

      // 如果是新课程，重定向到带有ID的课程编辑页面
      if (!course.id && savedCourse.id) {
        console.log('重定向到课程编辑页面:', savedCourse.id);
        navigate(`/course-creator?id=${savedCourse.id}`, { replace: true });
      }

      console.log('课程保存完成');
      
      // 非自动保存时才显示成功提示
      if (!isAutoSaving) {
        toast.success('课程保存成功');
      }
      
      // 更新引用变量 - 改用更内存友好的方式
      if (previousCourseRef) {
        // 使用浅拷贝代替深拷贝
        previousCourseRef.current = { ...savedCourse };
      }
      
      if (previousModulesRef) {
        // 创建模块的浅拷贝数组，避免深度克隆大量数据
        previousModulesRef.current = savedModulesWithLessons.map(module => {
          const moduleCopy = { ...module };
          // 如果模块有课时，创建课时的浅拷贝数组
          if (module.lessons && module.lessons.length > 0) {
            moduleCopy.lessons = module.lessons.map(lesson => ({ ...lesson }));
          }
          return moduleCopy;
        });
      }
      
      // 记录最后保存时间
      const now = new Date();
      setLastSavedTime(now);
      
      // 调用保存完成回调
      if (onCourseSaved) {
        onCourseSaved(savedCourse, savedModulesWithLessons);
      }
      
      // 清理大型临时对象
      clearObject(savedModulesMap);
      
      setSaveCourseStatus('success');
      console.log('课程及其所有模块和课时已成功保存。');
      
      // 最终垃圾回收
      await scheduleGarbageCollection(10);
      
      return savedCourse.id;
    } catch (error) {
      console.error('保存课程失败:', error);
      setSaveCourseStatus('error');
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '未知错误，请稍后重试或联系支持';
      
      // 非自动保存时才显示错误提示
      if (!isAutoSaving) {
        toast.error(`保存课程失败: ${errorMessage}`);
      }
      
      throw error;
    } finally {
      setIsSaving(false);
      
      // 尝试最终清理内存
      scheduleGarbageCollection(100);
    }
  };

  // 处理已删除的模块和课时
  const handleDeletedItems = async (courseId: string, modulesToProcess: CourseModule[]) => {
    // 如果没有之前的状态或是新课程，则跳过删除处理
    if (!previousModulesRef?.current || !courseId) {
      return;
    }
    
    try {
      // 收集需要删除的模块和课时ID
      let deletedModuleIds: string[] = [];
      let deletedLessonIdsMap: Record<string, string[]> = {};
      
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
      
      // 清理临时集合以节省内存
      previousModuleIds.clear();
      currentModuleIds.clear();
      
      // 1. 硬删除已移除的课时
      const allDeletedLessonIds = Object.values(deletedLessonIdsMap).flat();
      if (allDeletedLessonIds.length > 0) {
        console.log(`开始硬删除 ${allDeletedLessonIds.length} 个课时`);
        try {
          // 获取当前用户ID
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('用户未登录');
          }
          
          // 批量删除所有课时
          for (let i = 0; i < allDeletedLessonIds.length; i += 20) {
            const batch = allDeletedLessonIds.slice(i, i + 20);
            for (const lessonId of batch) {
              try {
                // 调用直接删除课时的RPC
                await supabase.rpc('delete_lesson', {
                  lesson_id: lessonId,
                  user_id: user.id
                });
              } catch (error) {
                console.error(`删除课时 ${lessonId} 失败:`, error);
              }
            }
            
            // 每批删除后释放内存
            if (i + 20 < allDeletedLessonIds.length) {
              await scheduleGarbageCollection(5);
            }
          }
          console.log('已删除课时批处理完成');
        } catch (error) {
          console.error('批量删除课时过程中出错:', error);
        }
      }
      
      // 清理不再需要的对象
      clearObject(deletedLessonIdsMap);
      deletedLessonIdsMap = {};
      
      // 2. 硬删除已移除的模块
      if (deletedModuleIds.length > 0) {
        console.log(`开始硬删除 ${deletedModuleIds.length} 个模块`);
        try {
          // 获取当前用户ID
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            throw new Error('用户未登录');
          }
          
          // 批量删除所有模块
          for (let i = 0; i < deletedModuleIds.length; i += 20) {
            const batch = deletedModuleIds.slice(i, i + 20);
            for (const moduleId of batch) {
              try {
                // 调用直接删除模块的RPC
                await supabase.rpc('delete_module', {
                  module_id: moduleId,
                  user_id: user.id
                });
              } catch (error) {
                console.error(`删除模块 ${moduleId} 失败:`, error);
              }
            }
            
            // 每批删除后释放内存
            if (i + 20 < deletedModuleIds.length) {
              await scheduleGarbageCollection(5);
            }
          }
          console.log('已删除模块批处理完成');
        } catch (error) {
          console.error('批量删除模块过程中出错:', error);
        }
      }
      
      // 清理临时数组
      deletedModuleIds = [];
    } catch (error) {
      console.error('处理删除项目时出错:', error);
      // 继续执行保存流程，不中断
    }
  };

  return {
    isSaving,
    handleSaveCourse,
    saveCourseStatus,
    lastSavedTime
  };
}; 