import { useState, useEffect, useRef } from 'react';
import { Course, CourseModule } from '@/types/course';

// 最大历史记录数量
const MAX_HISTORY_LENGTH = 50;

// 定义历史状态类型
export interface HistoryState {
  course: Course;
  modules: CourseModule[];
}

interface UseCourseHistoryProps {
  course: Course;
  modules: CourseModule[];
  isLoading: boolean;
  moduleDataLoaded: boolean;
}

interface UseCourseHistoryResult {
  canUndo: boolean;
  canRedo: boolean;
  handleUndo: () => void;
  handleRedo: () => void;
  setCourse: (course: Course) => void;
  setModules: (modules: CourseModule[]) => void;
  isUndoRedoOperation: boolean;
}

export const useCourseHistory = ({
  course,
  modules,
  isLoading,
  moduleDataLoaded
}: UseCourseHistoryProps): UseCourseHistoryResult => {
  // 添加历史记录状态
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);
  
  // 本地状态副本，避免直接修改外部状态
  const [internalCourse, setInternalCourse] = useState<Course>(course);
  const [internalModules, setInternalModules] = useState<CourseModule[]>(modules);

  // 用于初始化历史记录
  useEffect(() => {
    if (!isLoading && moduleDataLoaded && historyIndex === -1) {
      const initialState: HistoryState = {
        course: JSON.parse(JSON.stringify(course)),
        modules: JSON.parse(JSON.stringify(modules))
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [course, modules, isLoading, moduleDataLoaded, historyIndex]);

  // 添加课程变更的历史记录
  useEffect(() => {
    // 如果课程未加载完成或是撤销重做操作，不添加历史记录
    if (isLoading || !moduleDataLoaded || isUndoRedoOperation) return;
    
    // 当课程或模块变化时，添加新的历史记录
    if (hasStateChanged()) {
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
      
      // 更新内部状态
      setInternalCourse(JSON.parse(JSON.stringify(course)));
      setInternalModules(JSON.parse(JSON.stringify(modules)));
    }
  }, [course, modules, isLoading, moduleDataLoaded, isUndoRedoOperation, history, historyIndex]);

  // 检查状态是否发生变化
  const hasStateChanged = () => {
    if (historyIndex < 0 || history.length === 0) return true;
    
    const currentState = history[historyIndex];
    
    // 简单比较主要字段
    const courseChanged = 
      currentState.course.title !== course.title ||
      currentState.course.description !== course.description ||
      currentState.course.short_description !== course.short_description ||
      currentState.course.cover_image !== course.cover_image ||
      JSON.stringify(currentState.course.tags) !== JSON.stringify(course.tags) ||
      currentState.course.category !== course.category ||
      currentState.course.price !== course.price;
    
    if (courseChanged) return true;
    
    // 比较模块数量
    if (currentState.modules.length !== modules.length) return true;
    
    // 比较模块内容 (简化版)
    for (let i = 0; i < modules.length; i++) {
      if (i >= currentState.modules.length) return true;
      
      if (
        currentState.modules[i].title !== modules[i].title ||
        currentState.modules[i].order_index !== modules[i].order_index ||
        (currentState.modules[i].lessons?.length || 0) !== (modules[i].lessons?.length || 0)
      ) {
        return true;
      }
      
      // 检查课时标题和顺序
      const currentLessons = currentState.modules[i].lessons || [];
      const newLessons = modules[i].lessons || [];
      
      for (let j = 0; j < newLessons.length; j++) {
        if (j >= currentLessons.length) return true;
        
        if (
          currentLessons[j].title !== newLessons[j].title ||
          currentLessons[j].type !== newLessons[j].type ||
          currentLessons[j].order_index !== newLessons[j].order_index
        ) {
          return true;
        }
      }
    }
    
    return false;
  };

  // 撤销操作
  const handleUndo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoOperation(true);
      const prevState = history[historyIndex - 1];
      
      // 使用外部传入的更新函数更新状态
      setCourse(JSON.parse(JSON.stringify(prevState.course)));
      setModules(JSON.parse(JSON.stringify(prevState.modules)));
      
      setHistoryIndex(historyIndex - 1);
      
      // 使用setTimeout确保状态更新后再重置isUndoRedoOperation
      setTimeout(() => {
        setIsUndoRedoOperation(false);
      }, 0);
    }
  };

  // 重做操作
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoOperation(true);
      const nextState = history[historyIndex + 1];
      
      // 使用外部传入的更新函数更新状态
      setCourse(JSON.parse(JSON.stringify(nextState.course)));
      setModules(JSON.parse(JSON.stringify(nextState.modules)));
      
      setHistoryIndex(historyIndex + 1);
      
      // 使用setTimeout确保状态更新后再重置isUndoRedoOperation
      setTimeout(() => {
        setIsUndoRedoOperation(false);
      }, 0);
    }
  };

  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    handleUndo,
    handleRedo,
    setCourse,
    setModules,
    isUndoRedoOperation
  };
}; 