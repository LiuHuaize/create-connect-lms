import { useState, useCallback, useEffect } from 'react';
import { CourseModule, Lesson } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface ExpandedModulesState {
  [moduleId: string]: boolean;
}

interface UseModuleManagementProps {
  initialModules?: CourseModule[];
  onModulesChange?: (modules: CourseModule[]) => void;
}

const useModuleManagement = ({ 
  initialModules = [], 
  onModulesChange 
}: UseModuleManagementProps = {}) => {
  const [modules, setModules] = useState<CourseModule[]>(initialModules);
  const [expandedModules, setExpandedModules] = useState<ExpandedModulesState>({});
  const [updatingTitle, setUpdatingTitle] = useState<boolean>(false);
  const [lastTitleUpdate, setLastTitleUpdate] = useState<Date | null>(null);

  // 当初始模块变化时，更新状态
  useEffect(() => {
    setModules(initialModules);
    
    // 默认展开所有模块
    const initialExpandedState: ExpandedModulesState = {};
    initialModules.forEach(module => {
      initialExpandedState[module.id] = true;
    });
    setExpandedModules(initialExpandedState);
  }, [initialModules]);

  // 当模块变化时，通知父组件
  useEffect(() => {
    if (onModulesChange) {
      onModulesChange(modules);
    }
  }, [modules, onModulesChange]);

  // 添加新模块
  const addModule = useCallback(() => {
    const newModuleId = `m_${uuidv4()}`;
    const newModule: CourseModule = {
      id: newModuleId,
      title: '新模块',
      order_index: modules.length,
      lessons: []
    };

    setModules(prevModules => [...prevModules, newModule]);
    setExpandedModules(prevExpanded => ({
      ...prevExpanded,
      [newModuleId]: true  // 添加后自动展开
    }));

    // 提供反馈
    toast.success('已添加新模块');
    
    return newModuleId;
  }, [modules]);

  // 更新模块标题
  const updateModuleTitle = useCallback((moduleId: string, title: string) => {
    console.log(`正在更新模块 ${moduleId} 的标题为: "${title}"`);
    setUpdatingTitle(true);
    
    setModules(prevModules => {
      const updatedModules = prevModules.map(module => {
        if (module.id === moduleId) {
          console.log(`找到模块 ${moduleId}，原标题: "${module.title}"，新标题: "${title}"`);
          return { ...module, title };
        }
        return module;
      });
      
      return updatedModules;
    });
    
    setLastTitleUpdate(new Date());
    setUpdatingTitle(false);
    
    // 提供反馈
    console.log(`模块 ${moduleId} 标题已更新为 "${title}"`);
  }, []);

  // 删除模块
  const deleteModule = useCallback((moduleId: string) => {
    // 找到当前模块
    const moduleToDelete = modules.find(m => m.id === moduleId);
    if (!moduleToDelete) {
      toast.error('找不到要删除的模块');
      return;
    }

    // 询问确认
    if (window.confirm(`确定要删除模块 "${moduleToDelete.title}" 吗？此操作将删除该模块下的所有课时。`)) {
      setModules(prevModules => 
        prevModules
          .filter(module => module.id !== moduleId)
          .map((module, index) => ({ ...module, order_index: index }))
      );
      
      // 从展开状态中移除
      setExpandedModules(prevExpanded => {
        const newExpanded = { ...prevExpanded };
        delete newExpanded[moduleId];
        return newExpanded;
      });
      
      toast.success(`已删除模块 "${moduleToDelete.title}"`);
    }
  }, [modules]);

  // 切换模块展开/折叠状态
  const toggleModuleExpand = useCallback((moduleId: string) => {
    setExpandedModules(prevExpanded => ({
      ...prevExpanded,
      [moduleId]: !prevExpanded[moduleId]
    }));
  }, []);

  // 添加课时到指定模块
  const addLesson = useCallback((moduleId: string, lessonType: string = 'text') => {
    const newLessonId = `l_${uuidv4()}`;
    const newLesson: Lesson = {
      id: newLessonId,
      title: '新课时',
      type: lessonType as any,
      content: {},
      order_index: 0, // 将在下面更新
      module_id: moduleId
    };

    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === moduleId) {
          const lessons = module.lessons || [];
          const newLessonWithOrder = {
            ...newLesson,
            order_index: lessons.length
          };
          return {
            ...module,
            lessons: [...lessons, newLessonWithOrder]
          };
        }
        return module;
      });
    });

    // 确保模块已展开
    setExpandedModules(prevExpanded => ({
      ...prevExpanded,
      [moduleId]: true
    }));

    toast.success('已添加新课时');
    
    return newLessonId;
  }, []);

  // 更新课时
  const updateLesson = useCallback((updatedLesson: Lesson) => {
    console.log(`正在更新课时 ${updatedLesson.id}:`, updatedLesson);
    
    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === updatedLesson.module_id && module.lessons) {
          return {
            ...module,
            lessons: module.lessons.map(lesson => 
              lesson.id === updatedLesson.id ? updatedLesson : lesson
            )
          };
        }
        return module;
      });
    });
    
    console.log(`课时 ${updatedLesson.id} 已更新`);
  }, []);

  // 删除课时
  const deleteLesson = useCallback((moduleId: string, lessonId: string) => {
    // 找到当前课时
    let lessonTitle = '';
    modules.forEach(module => {
      if (module.id === moduleId && module.lessons) {
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) lessonTitle = lesson.title;
      }
    });

    if (!lessonTitle) {
      toast.error('找不到要删除的课时');
      return;
    }

    // 询问确认
    if (window.confirm(`确定要删除课时 "${lessonTitle}" 吗？`)) {
      setModules(prevModules => {
        return prevModules.map(module => {
          if (module.id === moduleId && module.lessons) {
            return {
              ...module,
              lessons: module.lessons
                .filter(lesson => lesson.id !== lessonId)
                .map((lesson, index) => ({ ...lesson, order_index: index }))
            };
          }
          return module;
        });
      });
      
      toast.success(`已删除课时 "${lessonTitle}"`);
    }
  }, [modules]);

  // 获取模块的课时列表
  const getLessons = useCallback((moduleId: string): Lesson[] => {
    const module = modules.find(m => m.id === moduleId);
    return module?.lessons || [];
  }, [modules]);

  // 重新排序模块
  const reorderModules = useCallback((newOrder: CourseModule[]) => {
    // 更新排序索引
    const updatedModules = newOrder.map((module, index) => ({
      ...module,
      order_index: index
    }));
    
    setModules(updatedModules);
  }, []);

  // 重新排序课时
  const reorderLessons = useCallback((moduleId: string, newOrder: Lesson[]) => {
    setModules(prevModules => {
      return prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            lessons: newOrder.map((lesson, index) => ({
              ...lesson,
              order_index: index
            }))
          };
        }
        return module;
      });
    });
  }, []);

  return {
    modules,
    expandedModules,
    addModule,
    updateModuleTitle,
    deleteModule,
    toggleModuleExpand,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessons,
    reorderModules,
    reorderLessons,
    updatingTitle,
    lastTitleUpdate
  };
};

export default useModuleManagement; 