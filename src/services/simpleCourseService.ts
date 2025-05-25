import { Course, CourseModule, Lesson } from '@/types/course';
import { courseService } from './courseService';
import { v4 as uuidv4 } from 'uuid';

// 保存课程请求接口
export interface SaveCourseRequest {
  course: Course;
  modules: CourseModule[];
}

// 保存课程响应接口
export interface SaveCourseResponse {
  course: Course;
  modules: CourseModule[];
}

/**
 * 简化的课程保存Service
 * 移除复杂的批量处理、内存优化、变更检测等逻辑
 * 只保留简单直接的保存功能
 */
class SimpleCourseService {
  /**
   * 保存完整的课程数据
   * 包括课程基本信息、模块和课时
   */
  async saveCourse(request: SaveCourseRequest): Promise<SaveCourseResponse> {
    const { course, modules } = request;
    
    // 1. 准备课程数据，如果是新课程则生成ID
    const courseToSave = {
      ...course,
      id: course.id || uuidv4()
    };
    
    // 2. 保存课程基本信息
    const savedCourse = await courseService.saveCourse(courseToSave);
    
    if (!savedCourse?.id) {
      throw new Error('保存课程失败');
    }
    
    // 3. 保存模块和课时
    const savedModules: CourseModule[] = [];
    
    for (const module of modules) {
      // 准备模块数据
      const moduleToSave = {
        ...module,
        id: module.id || uuidv4(),
        course_id: savedCourse.id
      };
      
      // 保存模块
      const savedModule = await courseService.addCourseModule(moduleToSave);
      
      // 保存该模块的课时
      const savedLessons: Lesson[] = [];
      if (module.lessons && module.lessons.length > 0) {
        for (const lesson of module.lessons) {
          const lessonToSave = {
            ...lesson,
            module_id: savedModule.id || ''
          };
          
          const savedLesson = await courseService.addLesson(lessonToSave);
          savedLessons.push(savedLesson);
        }
      }
      
      // 将课时添加到保存的模块中
      savedModules.push({
        ...savedModule,
        lessons: savedLessons
      });
    }
    
    return {
      course: savedCourse,
      modules: savedModules
    };
  }
}

// 导出单例实例
export const simpleCourseService = new SimpleCourseService(); 