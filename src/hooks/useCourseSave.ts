import { useState } from 'react';
import { Course, CourseModule, Lesson, LessonContent } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { clearObject, scheduleGarbageCollection, shallowCopy, estimateObjectSize } from '@/utils/memoryUtils';

// 定义保存状态类型
export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

// 定义钩子接口
interface UseCourseSaveProps {
  course: Course;
  modules: CourseModule[];
  onCourseSaved?: (savedCourse: Course, savedModules: CourseModule[]) => void;
}

// 定义钩子返回值接口
interface UseCourseSaveResult {
  isSaving: boolean;
  saveCourseStatus: SaveStatus;
  lastSavedTime: Date | null;
  handleSaveCourse: () => Promise<string | undefined>;
}

/**
 * 课程保存钩子
 * 处理课程和模块的保存逻辑
 */
export const useCourseSave = ({
  course,
  modules,
  onCourseSaved
}: UseCourseSaveProps): UseCourseSaveResult => {
  // 保存状态
  const [saveCourseStatus, setSaveCourseStatus] = useState<SaveStatus>('idle');
  // 最后保存时间
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  // 导航钩子
  const navigate = useNavigate();

  /**
   * 检测大型内容并输出警告
   * @param modules 课程模块
   */
  const detectLargeContent = (modules: CourseModule[]) => {
    try {
      // 遍历所有模块和课时，检查内容大小
      modules.forEach(module => {
        module.lessons?.forEach(lesson => {
          if (lesson.content) {
            // 特别关注TextLessonContent类型
            if (lesson.type === 'text') {
              const textContent = lesson.content as any;
              if (textContent.text) {
                const size = estimateObjectSize(textContent.text);
                if (size > 1000000) { // 超过1MB
                  console.warn(`发现大型文本内容 (约${(size/1048576).toFixed(2)}MB) - 模块ID: ${module.id}, 课时ID: ${lesson.id}`);
                }
              }
            }
          }
        });
      });
    } catch (error) {
      console.error('检测大型内容时出错:', error);
    }
  };

  /**
   * 批量处理数组元素
   * @param array 要处理的数组
   * @param batchSize 批处理大小
   * @param processFn 处理函数
   */
  const processBatchItems = async <T, R>(
    array: T[],
    batchSize: number,
    processFn: (items: T[]) => Promise<R[]>
  ): Promise<R[]> => {
    if (!array || array.length === 0) return [];
    
    const results: R[] = [];
    const totalItems = array.length;
    const totalBatches = Math.ceil(totalItems / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, totalItems);
      const batch = array.slice(start, end);
      
      // 处理当前批次
      const batchResults = await processFn(batch);
      results.push(...batchResults);
      
      // 在批次之间添加短暂延迟，允许GC工作
      if (i < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 5));
        scheduleGarbageCollection();
      }
    }
    
    return results;
  };

  /**
   * 处理课程保存
   * 优化内存使用和处理流程
   * @returns 保存后的课程ID
   */
  const handleSaveCourse = async (): Promise<string | undefined> => {
    // 如果当前正在保存，则不再触发新的保存操作
    if (saveCourseStatus === 'saving') {
      console.log('正在保存课程，请稍候...');
      return;
    }

    // 更新保存状态
    setSaveCourseStatus('saving');
    console.log('开始保存课程...');

    try {
      // 检测大型内容
      detectLargeContent(modules);

      // 准备课程数据 - 使用浅拷贝而非深拷贝
      const courseToSave = shallowCopy(course);
      
      // 如果是新课程，生成ID
      if (!courseToSave.id) {
        courseToSave.id = uuidv4();
      }

      // 处理模块数据 - 只捕获需要的字段
      const modulesToProcess = modules.map(module => ({
        id: module.id || uuidv4(),
        title: module.title,
        // 使用正确的字段名 order_index 而不是 order
        order_index: module.order_index || 0,
        course_id: courseToSave.id,
        // CourseModule 类型中没有 description 和 settings 字段，删除它们
      }));

      // 处理模块
      const processedModules = await processBatchItems(
        modulesToProcess,
        5, // 每批处理5个模块
        async (batch) => {
          return batch.map(module => ({...module}));
        }
      );
      
      // 保存课程
      console.log('保存课程信息...');
      const savedCourse = await courseService.saveCourse(courseToSave);
      
      if (!savedCourse || !savedCourse.id) {
        throw new Error('保存课程失败：服务器响应为空');
      }

      console.log('保存成功，课程ID:', savedCourse.id);
      
      // 处理课时数据 - 分批处理以减少内存压力
      if (savedCourse.id) {
        console.log('开始处理课时数据...');
        
        // 收集所有课时
        const allLessons: Lesson[] = [];
        modules.forEach(module => {
          if (module.lessons && module.lessons.length > 0) {
            module.lessons.forEach(lesson => {
              // 创建课时的副本并添加必要字段
              allLessons.push({
                ...lesson,
                module_id: module.id || '',
                // course_id字段可能存在也可能不存在，视实际情况使用
                // 如果课时类型包含course_id字段则保留
              });
            });
          }
        });
        
        // 批量保存课时
        if (allLessons.length > 0) {
          console.log(`共${allLessons.length}个课时需要保存，开始分批处理...`);
          
          try {
            // 将课时分批处理，每批最多处理10个课时
            await processBatchItems(
              allLessons,
              10,
              async (batch) => {
                // 为每个批次的课时调用适当的保存方法
                const savedLessons: Lesson[] = [];
                for (const lesson of batch) {
                  const savedLesson = await courseService.addLesson({
                    ...lesson,
                    module_id: lesson.module_id || ''
                  });
                  savedLessons.push(savedLesson);
                }
                return savedLessons;
              }
            );
            
            console.log('所有课时保存完成');
          } catch (error) {
            console.error('保存课时过程中出错:', error);
            throw new Error(`保存课时失败: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // 保存成功后更新状态
      setLastSavedTime(new Date());
      setSaveCourseStatus('success');
      
      // 成功提示
      toast.success('课程已保存', {
        position: 'top-center',
        duration: 2000
      });
      
      // 清理保存过程中的临时数据
      setTimeout(() => {
        // 清理不再需要的临时对象
        const tempObjects = [modulesToProcess, processedModules];
        tempObjects.forEach(obj => clearObject(obj));
        
        // 调度垃圾回收
        scheduleGarbageCollection();
      }, 1000);
      
      // 如果有回调函数，调用它
      if (onCourseSaved) {
        onCourseSaved(savedCourse, modules);
      }
      

      
      return savedCourse.id;
    } catch (error) {
      console.error('保存课程失败:', error);
      
      // 更新保存状态
      setSaveCourseStatus('error');
      
      // 错误提示
      toast.error(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`, {
        position: 'top-center',
        duration: 3000
      });
      
      // 尝试释放内存
      scheduleGarbageCollection();
      
      return undefined;
    }
  };

  return {
    isSaving: saveCourseStatus === 'saving',
    saveCourseStatus,
    lastSavedTime,
    handleSaveCourse
  };
}; 