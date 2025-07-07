import { create } from 'zustand';
import { courseService, lessonCompletionCache } from '@/services/courseService';

interface CourseCompletionState {
  // 完成状态数据：courseId -> lessonId -> boolean
  completionStatus: Record<string, Record<string, boolean>>;
  
  // 加载状态管理
  loadingCourses: Set<string>;
  
  // 上次清理时间记录
  lastCleanupTime: Record<string, number>;
  
  // 标记课程完成状态是否已从getCourseDetails获取
  courseCompletionFromDetails: Set<string>;
  
  // 获取单个课程的完成状态
  getCompletionStatus: (courseId: string) => Record<string, boolean>;
  
  // 获取单个课时的完成状态
  isLessonCompleted: (courseId: string, lessonId: string) => boolean;
  
  // 加载课程完成状态（带去重和缓存）
  loadCompletionStatus: (courseId: string, forceCleanup?: boolean) => Promise<void>;
  
  // 从课程详情中设置完成状态
  setCompletionStatusFromCourseDetails: (courseId: string) => void;
  
  // 更新单个课时的完成状态
  updateLessonCompletion: (courseId: string, lessonId: string, completed: boolean) => void;
  
  // 清除特定课程的缓存
  clearCourseCache: (courseId: string) => void;
  
  // 清除所有缓存
  clearAllCache: () => void;
}

// 用于防止并发请求的Promise缓存
const loadingPromises: Record<string, Promise<void>> = {};

// 清理间隔时间（毫秒）- 1小时
const CLEANUP_INTERVAL = 60 * 60 * 1000;

export const useCourseCompletionStore = create<CourseCompletionState>((set, get) => ({
  completionStatus: {},
  loadingCourses: new Set(),
  lastCleanupTime: {},
  courseCompletionFromDetails: new Set(),
  
  getCompletionStatus: (courseId: string) => {
    return get().completionStatus[courseId] || {};
  },
  
  isLessonCompleted: (courseId: string, lessonId: string) => {
    const courseStatus = get().completionStatus[courseId];
    return courseStatus?.[lessonId] || false;
  },
  
  setCompletionStatusFromCourseDetails: (courseId: string) => {
    // 标记这个课程的完成状态已从getCourseDetails获取
    set(state => ({
      courseCompletionFromDetails: new Set([...state.courseCompletionFromDetails, courseId])
    }));
    
    // 从lessonCompletionCache获取状态
    const cachedStatus = lessonCompletionCache[courseId];
    if (cachedStatus) {
      set(state => ({
        completionStatus: {
          ...state.completionStatus,
          [courseId]: cachedStatus
        }
      }));
      console.log(`从课程详情缓存设置完成状态，课程 ${courseId}`);
    }
  },
  
  loadCompletionStatus: async (courseId: string, forceCleanup = false) => {
    // 如果完成状态已从getCourseDetails获取，跳过加载
    if (get().courseCompletionFromDetails.has(courseId)) {
      console.log(`课程 ${courseId} 的完成状态已从getCourseDetails获取，跳过重复加载`);
      return;
    }
    // 如果已经有该课程的加载进程，直接返回现有的Promise
    if (loadingPromises[courseId]) {
      console.log(`复用现有的完成状态加载进程: ${courseId}`);
      return loadingPromises[courseId];
    }
    
    // 创建新的加载Promise
    loadingPromises[courseId] = (async () => {
      try {
        // 标记正在加载
        set(state => ({
          loadingCourses: new Set([...state.loadingCourses, courseId])
        }));
        
        const now = Date.now();
        const lastCleanup = get().lastCleanupTime[courseId] || 0;
        const shouldCleanup = forceCleanup || (now - lastCleanup > CLEANUP_INTERVAL);
        
        // 只在必要时执行清理
        if (shouldCleanup) {
          console.log(`执行课程 ${courseId} 的无效记录清理`);
          await courseService.cleanInvalidLessonCompletions(courseId);
          
          // 更新清理时间
          set(state => ({
            lastCleanupTime: {
              ...state.lastCleanupTime,
              [courseId]: now
            }
          }));
        } else {
          console.log(`跳过清理，距离上次清理时间: ${Math.floor((now - lastCleanup) / 1000)}秒`);
        }
        
        // 获取完成状态（forceRefresh=true 以确保数据最新）
        const status = await courseService.getLessonCompletionStatus(courseId, true);
        
        // 更新状态
        set(state => ({
          completionStatus: {
            ...state.completionStatus,
            [courseId]: status
          }
        }));
        
        console.log(`课程 ${courseId} 完成状态加载成功，共 ${Object.keys(status).length} 个已完成课时`);
        
      } catch (error) {
        console.error(`加载课程 ${courseId} 完成状态失败:`, error);
        throw error;
      } finally {
        // 移除加载状态
        set(state => {
          const newLoadingCourses = new Set(state.loadingCourses);
          newLoadingCourses.delete(courseId);
          return { loadingCourses: newLoadingCourses };
        });
        
        // 清理Promise缓存
        delete loadingPromises[courseId];
      }
    })();
    
    return loadingPromises[courseId];
  },
  
  updateLessonCompletion: (courseId: string, lessonId: string, completed: boolean) => {
    set(state => ({
      completionStatus: {
        ...state.completionStatus,
        [courseId]: {
          ...(state.completionStatus[courseId] || {}),
          [lessonId]: completed
        }
      }
    }));
  },
  
  clearCourseCache: (courseId: string) => {
    set(state => {
      const newCompletionStatus = { ...state.completionStatus };
      delete newCompletionStatus[courseId];
      
      const newLastCleanupTime = { ...state.lastCleanupTime };
      delete newLastCleanupTime[courseId];
      
      const newCourseCompletionFromDetails = new Set(state.courseCompletionFromDetails);
      newCourseCompletionFromDetails.delete(courseId);
      
      return { 
        completionStatus: newCompletionStatus,
        lastCleanupTime: newLastCleanupTime,
        courseCompletionFromDetails: newCourseCompletionFromDetails
      };
    });
    
    // 同时清理Promise缓存
    delete loadingPromises[courseId];
  },
  
  clearAllCache: () => {
    set({ 
      completionStatus: {},
      lastCleanupTime: {},
      loadingCourses: new Set(),
      courseCompletionFromDetails: new Set()
    });
    
    // 清理所有Promise缓存
    for (const key in loadingPromises) {
      delete loadingPromises[key];
    }
  }
}));