import { create } from 'zustand';
import { Course, CourseModule, Lesson } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

// 定义课程创建器状态接口
interface CourseCreatorState {
  // 基本状态
  course: Course;
  modules: CourseModule[];
  currentLesson: Lesson | null;
  expandedModule: string | null;
  isUploading: boolean;
  coverImageURL: string | null;
  completionPercentage: number;
  isLoading: boolean;
  loadingDetails: boolean;
  moduleDataLoaded: boolean;
  isSaving: boolean;
  lastSavedTime: Date | null;
  
  // 历史记录状态
  canUndo: boolean;
  canRedo: boolean;
  
  // 本地备份状态
  hasBackup: boolean;
  backupTimestamp: number | null;
  
  // 操作方法
  setCourse: (course: Course | ((prev: Course) => Course)) => void;
  setModules: (modules: CourseModule[] | ((prev: CourseModule[]) => CourseModule[])) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  setExpandedModule: (moduleId: string | null) => void;
  setIsUploading: (isUploading: boolean) => void;
  setCoverImageURL: (url: string | null) => void;
  
  // 课程操作
  loadCourse: (courseId: string | null) => Promise<void>;
  saveCourse: () => Promise<void>;
  createModule: (title: string) => void;
  updateModule: (moduleId: string, updates: Partial<CourseModule>) => void;
  deleteModule: (moduleId: string) => void;
  
  // 历史记录操作
  undo: () => void;
  redo: () => void;
  
  // 备份操作
  saveLocalBackup: () => void;
  restoreFromBackup: () => { course: Course; modules: CourseModule[] } | null;
  clearBackup: () => void;
}

// 创建课程创建器存储
export const useCourseStore = create<CourseCreatorState>((set, get) => ({
  // 基本状态的初始值
  course: {
    title: '',
    description: '',
    short_description: '',
    author_id: '',
    status: 'draft',
    price: null,
    tags: [],
    category: null
  },
  modules: [],
  currentLesson: null,
  expandedModule: null,
  isUploading: false,
  coverImageURL: null,
  completionPercentage: 0,
  isLoading: false,
  loadingDetails: false,
  moduleDataLoaded: true,
  isSaving: false,
  lastSavedTime: null,
  
  // 历史记录状态
  canUndo: false,
  canRedo: false,
  
  // 本地备份状态
  hasBackup: false,
  backupTimestamp: null,
  
  // 状态更新方法
  setCourse: (courseUpdate) => set((state) => {
    const newCourse = typeof courseUpdate === 'function' 
      ? courseUpdate(state.course) 
      : courseUpdate;
    
    return { course: newCourse };
  }),
  
  setModules: (modulesUpdate) => set((state) => {
    const newModules = typeof modulesUpdate === 'function'
      ? modulesUpdate(state.modules)
      : modulesUpdate;
      
    return { modules: newModules };
  }),
  
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  setExpandedModule: (moduleId) => set({ expandedModule: moduleId }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setCoverImageURL: (url) => set({ coverImageURL: url }),
  
  // 课程操作方法
  loadCourse: async (courseId) => {
    if (!courseId) {
      set({ 
        loadingDetails: false, 
        isLoading: false, 
        moduleDataLoaded: true 
      });
      return;
    }
    
    try {
      set({ isLoading: true, loadingDetails: true, moduleDataLoaded: false });
      
      const courseDetails = await courseService.getCourseDetails(courseId);
      
      set({ 
        course: courseDetails,
        coverImageURL: courseDetails.cover_image || null,
        loadingDetails: false
      });
      
      // 短暂延迟后设置模块数据，模拟原有行为
      setTimeout(() => {
        if (courseDetails.modules) {
          set({ 
            modules: courseDetails.modules,
            expandedModule: courseDetails.modules.length > 0 ? courseDetails.modules[0].id : null,
            moduleDataLoaded: true,
            isLoading: false
          });
        } else {
          set({ moduleDataLoaded: true, isLoading: false });
        }
        
        // 这里应该添加备份检查逻辑，但先简化实现
      }, 100);
      
    } catch (error) {
      console.error('加载课程失败:', error);
      toast.error('加载课程失败，请重试');
      set({ loadingDetails: false, isLoading: false, moduleDataLoaded: true });
      
      // 这里应该添加从备份恢复的逻辑，但先简化实现
    }
  },
  
  saveCourse: async () => {
    const { course, modules } = get();
    
    if (!course.title.trim()) {
      toast.error('请先输入课程标题');
      return;
    }
    
    set({ isSaving: true });
    
    try {
      // 调用课程保存服务
      const savedCourse = await courseService.saveCourse(course, modules);
      
      if (!course.id && savedCourse.id) {
        set(state => ({ 
          course: { ...state.course, id: savedCourse.id },
          lastSavedTime: new Date()
        }));
      } else {
        set({ lastSavedTime: new Date() });
      }
      
      toast.success('课程保存成功');
    } catch (error) {
      console.error('保存课程失败:', error);
      toast.error('保存课程失败，请重试');
    } finally {
      set({ isSaving: false });
    }
  },
  
  createModule: (title) => {
    const newModule: CourseModule = {
      id: uuidv4(),
      title: title || '新模块',
      lessons: [],
      position: get().modules.length
    };
    
    set(state => ({
      modules: [...state.modules, newModule],
      expandedModule: newModule.id
    }));
  },
  
  updateModule: (moduleId, updates) => {
    set(state => ({
      modules: state.modules.map(module => 
        module.id === moduleId 
          ? { ...module, ...updates } 
          : module
      )
    }));
  },
  
  deleteModule: (moduleId) => {
    set(state => ({
      modules: state.modules.filter(module => module.id !== moduleId)
    }));
  },
  
  // 历史记录操作 - 简化实现，后续完善
  undo: () => {
    // 待实现
    console.log('Undo操作待实现');
  },
  
  redo: () => {
    // 待实现
    console.log('Redo操作待实现');
  },
  

  
  saveLocalBackup: () => {
    const { course, modules } = get();
    try {
      const backupData = { course, modules, timestamp: Date.now() };
      localStorage.setItem(`course-backup-${course.id}`, JSON.stringify(backupData));
      set({ hasBackup: true, backupTimestamp: backupData.timestamp });
    } catch (error) {
      console.error('保存本地备份失败:', error);
    }
  },
  
  restoreFromBackup: () => {
    const { course } = get();
    if (!course.id) return null;
    
    try {
      const backupJson = localStorage.getItem(`course-backup-${course.id}`);
      if (!backupJson) return null;
      
      const backup = JSON.parse(backupJson);
      return { course: backup.course, modules: backup.modules };
    } catch (error) {
      console.error('恢复备份失败:', error);
      return null;
    }
  },
  
  clearBackup: () => {
    const { course } = get();
    if (course.id) {
      localStorage.removeItem(`course-backup-${course.id}`);
    }
    set({ hasBackup: false, backupTimestamp: null });
  }
})); 