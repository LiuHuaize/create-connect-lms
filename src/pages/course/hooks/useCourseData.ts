import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';

// 本地存储缓存辅助函数
const LOCAL_STORAGE_PREFIX = 'connect-lms-cache-';
const CACHE_EXPIRY_TIME = 10 * 60 * 1000; // 10分钟

// 从本地存储获取缓存数据
const getFromLocalCache = (key: string) => {
  try {
    const cachedItem = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`);
    if (!cachedItem) return null;
    
    const { data, timestamp } = JSON.parse(cachedItem);
    
    // 检查缓存是否过期
    if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('从本地缓存获取数据失败:', error);
    return null;
  }
};

// 保存数据到本地存储
const saveToLocalCache = (key: string, data: any) => {
  try {
    const cacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error('保存数据到本地缓存失败:', error);
  }
};

// 获取课程注册信息
const fetchEnrollmentInfo = async (courseId: string, userId: string) => {
  if (!courseId || !userId) return null;
  
  // 尝试从本地缓存获取
  const cacheKey = `enrollment-${courseId}-${userId}`;
  const cachedData = getFromLocalCache(cacheKey);
  if (cachedData) {
    console.log('从本地缓存返回课程注册信息');
    return cachedData;
  }
  
  const { data: enrollments, error } = await supabase
    .from('course_enrollments')
    .select('id, progress')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();
    
  if (error) {
    console.error('获取课程注册信息失败:', error);
    throw error;
  }
  
  // 保存到本地缓存
  if (enrollments) {
    saveToLocalCache(cacheKey, enrollments);
  }
  
  return enrollments;
};

// 获取课程详情，包括模块和课时
const fetchCourseDetails = async (courseId: string | undefined) => {
  if (!courseId) return null;
  
  console.log('正在获取课程详情:', courseId);
  
  // 尝试从本地缓存获取
  const cacheKey = `course-details-${courseId}`;
  const cachedData = getFromLocalCache(cacheKey);
  if (cachedData) {
    console.log('从本地缓存返回课程详情');
    return cachedData;
  }
  
  const courseDetails = await courseService.getCourseDetails(courseId);
  
  // 保存到本地缓存
  saveToLocalCache(cacheKey, courseDetails);
  
  return courseDetails;
};

export const useCourseData = (courseId: string | undefined) => {
  const { user } = useAuth();
  
  // 获取课程详情
  const { 
    data: courseData, 
    isLoading: isLoadingCourse,
  } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5分钟内保持数据新鲜
  });
  
  // 获取用户的课程注册信息
  const {
    data: enrollmentData,
    isLoading: isLoadingEnrollment,
  } = useQuery({
    queryKey: ['enrollment', courseId, user?.id],
    queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || ''),
    enabled: !!courseId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5分钟内保持数据新鲜
  });
  
  // 查找当前课时
  const findCurrentLesson = (lessonId: string | undefined): { 
    selectedLesson: Lesson | null; 
    selectedUnit: CourseModule | null 
  } => {
    let selectedLesson = null;
    let selectedUnit = null;
    
    if (courseData?.modules && courseData.modules.length > 0) {
      if (lessonId) {
        for (const module of courseData.modules) {
          if (!module.lessons) continue;
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            selectedLesson = lesson;
            selectedUnit = module;
            break;
          }
        }
      }
      
      if (!selectedLesson) {
        for (const module of courseData.modules) {
          if (module.lessons && module.lessons.length > 0) {
            selectedLesson = module.lessons[0];
            selectedUnit = module;
            break;
          }
        }
      }
    }
    
    return { selectedLesson, selectedUnit };
  };

  return {
    loading: isLoadingCourse || isLoadingEnrollment,
    courseData,
    progress: enrollmentData?.progress || 0,
    enrollmentId: enrollmentData?.id || null,
    findCurrentLesson
  };
};
