import { useState } from 'react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';

export type IncrementalSaveStatus = 'idle' | 'saving' | 'success' | 'error';

interface UseIncrementalSaveProps {
  courseId?: string;
}

export const useIncrementalSave = ({ courseId }: UseIncrementalSaveProps) => {
  const [saveStatus, setSaveStatus] = useState<IncrementalSaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // 保存课程基础信息
  const saveCourseInfo = async (course: Course): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      await courseService.saveCourse(course);
      setLastSavedTime(new Date());
      setSaveStatus('success');
      toast.success('课程基础信息已保存');
      return true;
    } catch (error) {
      setSaveStatus('error');
      toast.error('保存课程信息失败');
      console.error('保存课程信息失败:', error);
      return false;
    }
  };

  // 保存单个课时
  const saveLesson = async (lesson: Lesson): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      await courseService.addLesson(lesson);
      setLastSavedTime(new Date());
      setSaveStatus('success');
      toast.success(`课时"${lesson.title}"已保存`);
      return true;
    } catch (error) {
      setSaveStatus('error');
      toast.error('保存课时失败');
      console.error('保存课时失败:', error);
      return false;
    }
  };

  // 保存课程框架结构（模块和课时结构，不包含课时内容）
  const saveCourseStructure = async (modules: CourseModule[]): Promise<boolean> => {
    setSaveStatus('saving');
    try {
      // 1. 保存模块结构
      for (const module of modules) {
        const moduleData = {
          id: module.id,
          title: module.title,
          order_index: module.order_index,
          course_id: module.course_id
        };
        await courseService.addCourseModule(moduleData);
      }

      // 2. 保存课时结构（不包含content）
      for (const module of modules) {
        if (module.lessons && module.lessons.length > 0) {
          for (const lesson of module.lessons) {
            const lessonStructure = {
              id: lesson.id,
              title: lesson.title,
              type: lesson.type,
              module_id: lesson.module_id,
              order_index: lesson.order_index,
              // 不保存content，保持原有内容
            };
            await courseService.addLesson(lessonStructure);
          }
        }
      }

      setLastSavedTime(new Date());
      setSaveStatus('success');
      toast.success('课程框架已保存');
      return true;
    } catch (error) {
      setSaveStatus('error');
      toast.error('保存课程框架失败');
      console.error('保存课程框架失败:', error);
      return false;
    }
  };

  return {
    saveStatus,
    lastSavedTime,
    isSaving: saveStatus === 'saving',
    saveCourseInfo,
    saveLesson,
    saveCourseStructure
  };
}; 