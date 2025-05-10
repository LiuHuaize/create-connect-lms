import { useState } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

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
    
    // 清理保存前不必要的内存占用
    setTimeout(() => { 
      try {
        console.log('正在清理保存前的内存...');
        // 尝试强制进行垃圾回收
        if (window.gc) window.gc();
      } catch (e) {}
    }, 0);
    
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
      
      // 1. 保存课程基本信息
      const courseToSave = { ...course };
      
      console.log('准备发送到后端的课程数据:', courseToSave);
      const savedCourse = await courseService.saveCourse(courseToSave);
      console.log('课程基本信息保存成功:', savedCourse);
      
      // 准备模块数据 - 预处理模块以减少数据库请求
      const modulesToProcess = modules.map(module => {
        const moduleToSave = { ...module };
        
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
      
      // 2. 处理删除的模块和课时
      await handleDeletedItems(savedCourse.id, modulesToProcess);
      
      // 3. 保存所有模块 - 批量处理模块
      console.log('开始保存课程模块，数量:', modulesToProcess.length);
      const savedModulesMap: Record<string, CourseModule> = {};
      
      // 每次最多处理10个模块
      for (let i = 0; i < modulesToProcess.length; i += 10) {
        const moduleBatch = modulesToProcess.slice(i, i + 10);
        
        try {
          const modulePromises = moduleBatch.map(async moduleToSave => {
            try {
              const savedModule = await courseService.addCourseModule(moduleToSave);
              console.log(`模块 ${moduleToSave.title} 保存成功:`, savedModule.id);
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
          // 继续处理其他批次，但记录错误
          if (!isAutoSaving) {
            toast.error(`部分模块保存失败，请重试`);
          }
        }
      }
      
      // 4. 处理所有课时 - 按模块分批保存
      const savedModulesWithLessons: CourseModule[] = [];
      
      for (const module of modulesToProcess) {
        const savedModule = savedModulesMap[module.id];
        
        if (!savedModule) {
          console.error(`模块 ${module.id} 保存失败，跳过其课时保存`);
          continue;
        }
        
        const moduleWithLessons = { ...savedModule, lessons: [] };
        
        if (module.lessons && module.lessons.length > 0) {
          console.log(`开始保存模块 ${savedModule.id} 的 ${module.lessons.length} 个课时`);
          
          // 每次最多处理20个课时
          for (let i = 0; i < module.lessons.length; i += 20) {
            const lessonBatch = module.lessons.slice(i, i + 20);
            
            try {
              const lessonPromises = lessonBatch.map(async (lesson) => {
                // 确保课时的ID是有效的UUID
                const lessonToSave = { ...lesson };
                if (!lessonToSave.id || lessonToSave.id.startsWith('l')) {
                  lessonToSave.id = uuidv4();
                }
                
                try {
                  const savedLesson = await courseService.addLesson({
                    ...lessonToSave,
                    module_id: savedModule.id
                  });
                  console.log(`课时 ${lessonToSave.title} 保存成功:`, savedLesson.id);
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
              if (!isAutoSaving) {
                toast.error(`部分课时保存失败，请重试`);
              }
            }
          }
        }
        
        savedModulesWithLessons.push(moduleWithLessons);
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
      
      // 更新引用变量
      if (previousCourseRef) {
        previousCourseRef.current = JSON.parse(JSON.stringify(savedCourse));
      }
      
      if (previousModulesRef) {
        previousModulesRef.current = JSON.parse(JSON.stringify(savedModulesWithLessons));
      }
      
      // 记录最后保存时间
      const now = new Date();
      setLastSavedTime(now);
      
      // 调用保存完成回调
      if (onCourseSaved) {
        onCourseSaved(savedCourse, savedModulesWithLessons);
      }
      
      setSaveCourseStatus('success');
      console.log('课程及其所有模块和课时已成功保存。');
      
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
          }
          console.log('已删除课时批处理完成');
        } catch (error) {
          console.error('批量删除课时过程中出错:', error);
        }
      }
      
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
          }
          console.log('已删除模块批处理完成');
        } catch (error) {
          console.error('批量删除模块过程中出错:', error);
        }
      }
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