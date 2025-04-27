import { useState, useEffect } from 'react';
import { CourseModule, Lesson } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';

interface UseCourseModulesProps {
  initialModules?: CourseModule[];
  onModulesChange?: (modules: CourseModule[]) => void;
}

/**
 * 管理课程模块和课时的状态Hook
 * 
 * 负责处理模块的添加、删除、更新等操作，以及课时的管理
 */
export const useCourseModules = ({
  initialModules = [],
  onModulesChange
}: UseCourseModulesProps = {}) => {
  // 课程模块状态
  const [modules, setModules] = useState<CourseModule[]>(initialModules);
  
  // 当前选中的课时
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  
  // 当前展开的模块ID
  const [expandedModule, setExpandedModule] = useState<string | null>(
    initialModules.length > 0 ? initialModules[0].id : null
  );
  
  // 监听模块变化，调用外部onChange回调
  useEffect(() => {
    if (onModulesChange) {
      onModulesChange(modules);
    }
  }, [modules, onModulesChange]);
  
  // 更新模块列表
  const updateModules = (newModules: CourseModule[]) => {
    setModules(newModules);
  };
  
  // 创建新模块
  const createModule = (title?: string, position?: number) => {
    const newModule: CourseModule = {
      id: uuidv4(),
      title: title || '新模块',
      lessons: [],
      position: position !== undefined ? position : modules.length
    };
    
    const updatedModules = [...modules, newModule];
    setModules(updatedModules);
    setExpandedModule(newModule.id);
    
    return newModule;
  };
  
  // 更新模块
  const updateModule = (moduleId: string, updates: Partial<CourseModule>) => {
    const updatedModules = modules.map(module => 
      module.id === moduleId
        ? { ...module, ...updates }
        : module
    );
    
    setModules(updatedModules);
  };
  
  // 删除模块
  const deleteModule = (moduleId: string) => {
    const updatedModules = modules.filter(module => module.id !== moduleId);
    
    // 如果删除的是当前展开的模块，则展开第一个模块
    if (expandedModule === moduleId && updatedModules.length > 0) {
      setExpandedModule(updatedModules[0].id);
    } else if (updatedModules.length === 0) {
      setExpandedModule(null);
    }
    
    setModules(updatedModules);
  };
  
  // 重新排序模块
  const reorderModules = (moduleList: CourseModule[]) => {
    // 更新每个模块的位置索引
    const updatedModules = moduleList.map((module, index) => ({
      ...module,
      position: index
    }));
    
    setModules(updatedModules);
  };
  
  // 创建新课时
  const createLesson = (moduleId: string, title?: string, type: string = 'text', position?: number) => {
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule) return null;
    
    const newLesson: Lesson = {
      id: uuidv4(),
      title: title || '新课时',
      type,
      content: {},
      module_id: moduleId,
      order_index: position !== undefined ? position : (targetModule.lessons?.length || 0)
    };
    
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [...(module.lessons || []), newLesson]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    setCurrentLesson(newLesson);
    
    return newLesson;
  };
  
  // 更新课时
  const updateLesson = (lessonId: string, updates: Partial<Lesson>) => {
    let updatedLesson: Lesson | null = null;
    
    const updatedModules = modules.map(module => {
      if (!module.lessons) return module;
      
      const updatedLessons = module.lessons.map(lesson => {
        if (lesson.id === lessonId) {
          updatedLesson = { ...lesson, ...updates };
          return updatedLesson;
        }
        return lesson;
      });
      
      return {
        ...module,
        lessons: updatedLessons
      };
    });
    
    setModules(updatedModules);
    
    // 如果更新的是当前课时，更新当前课时状态
    if (currentLesson && currentLesson.id === lessonId && updatedLesson) {
      setCurrentLesson(updatedLesson);
    }
    
    return updatedLesson;
  };
  
  // 删除课时
  const deleteLesson = (lessonId: string) => {
    const updatedModules = modules.map(module => {
      if (!module.lessons) return module;
      
      return {
        ...module,
        lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
      };
    });
    
    // 如果删除的是当前课时，清除当前课时状态
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson(null);
    }
    
    setModules(updatedModules);
  };
  
  // 重新排序课时
  const reorderLessons = (moduleId: string, lessonList: Lesson[]) => {
    // 更新每个课时的位置索引
    const updatedLessons = lessonList.map((lesson, index) => ({
      ...lesson,
      order_index: index
    }));
    
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: updatedLessons
        };
      }
      return module;
    });
    
    setModules(updatedModules);
  };
  
  // 移动课时到另一个模块
  const moveLessonToModule = (lessonId: string, targetModuleId: string) => {
    // 找到要移动的课时及其所在的模块
    let lessonToMove: Lesson | null = null;
    let sourceModuleId: string | null = null;
    
    modules.forEach(module => {
      if (!module.lessons) return;
      
      const foundLesson = module.lessons.find(lesson => lesson.id === lessonId);
      if (foundLesson) {
        lessonToMove = foundLesson;
        sourceModuleId = module.id;
      }
    });
    
    if (!lessonToMove || !sourceModuleId || sourceModuleId === targetModuleId) return;
    
    // 创建更新后的课时对象，更新module_id
    const updatedLesson: Lesson = {
      ...lessonToMove,
      module_id: targetModuleId
    };
    
    // 从源模块中移除课时，并添加到目标模块
    const updatedModules = modules.map(module => {
      if (module.id === sourceModuleId) {
        return {
          ...module,
          lessons: module.lessons ? module.lessons.filter(l => l.id !== lessonId) : []
        };
      } else if (module.id === targetModuleId) {
        const targetModuleLessons = module.lessons || [];
        updatedLesson.order_index = targetModuleLessons.length; // 放在目标模块最后
        
        return {
          ...module,
          lessons: [...targetModuleLessons, updatedLesson]
        };
      }
      return module;
    });
    
    setModules(updatedModules);
    
    // 如果移动的是当前选中的课时，更新当前课时引用
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson(updatedLesson);
      setExpandedModule(targetModuleId);
    }
  };
  
  // 查找课时
  const findLesson = (lessonId: string): { lesson: Lesson | null, module: CourseModule | null } => {
    for (const module of modules) {
      if (!module.lessons) continue;
      
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        return { lesson, module };
      }
    }
    
    return { lesson: null, module: null };
  };
  
  return {
    // 状态
    modules,
    currentLesson,
    expandedModule,
    
    // 设置方法
    setModules: updateModules,
    setCurrentLesson,
    setExpandedModule,
    
    // 模块操作
    createModule,
    updateModule,
    deleteModule,
    reorderModules,
    
    // 课时操作
    createLesson,
    updateLesson,
    deleteLesson,
    reorderLessons,
    moveLessonToModule,
    findLesson
  };
}; 