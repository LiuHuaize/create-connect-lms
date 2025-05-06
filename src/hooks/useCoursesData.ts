import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Course } from '@/types/course';

// Define a type that extends Course with enrollment-related properties
export type EnrolledCourse = Course & {
  progress: number;
  enrollmentId: string;
  enrollmentStatus?: string;
  enrolledAt?: string;
  isAvailable: boolean;
};

// 缓存助手函数
const LOCAL_STORAGE_PREFIX = 'connect-lms-cache-';
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30分钟

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

// 清除所有课程相关缓存
export const clearAllCoursesCache = (queryClient?: any) => {
  try {
    // 清除所有课程列表缓存
    localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}all-courses`);
    
    // 清除其他可能与课程相关的缓存
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(LOCAL_STORAGE_PREFIX) && 
          (key.includes('course') || key.includes('enrolled'))) {
        localStorage.removeItem(key);
      }
    });
    
    // 清除React Query缓存
    if (queryClient) {
      // 使所有课程查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      // 使已加入的课程查询缓存失效
      queryClient.invalidateQueries({ queryKey: ['enrolledCourses'] });
    }
    
    console.log('已清除所有课程相关缓存');
  } catch (error) {
    console.error('清除课程缓存失败:', error);
  }
};

// API函数
export const fetchAllCourses = async (): Promise<Course[]> => {
  console.log('正在获取所有课程...');
  
  // 尝试从本地缓存获取
  const cachedCourses = getFromLocalCache('all-courses');
  if (cachedCourses) {
    console.log('从本地缓存返回课程数据');
    return cachedCourses;
  }
  
  // 从数据库获取
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published');
    
  if (error) {
    console.error('获取课程失败:', error);
    throw new Error('获取课程失败');
  }
  
  if (!data || data.length === 0) {
    console.log('没有找到课程');
    return [];
  }
  
  console.log(`从API获取到 ${data.length} 个课程`);
  
  // 保存到本地缓存
  saveToLocalCache('all-courses', data);
  
  return data as Course[];
};

// 获取用户已加入的课程
export const fetchEnrolledCourses = async (userId: string): Promise<EnrolledCourse[]> => {
  if (!userId) {
    return [];
  }
  
  console.log('正在获取用户已加入的课程...');
  
  // 尝试从本地缓存获取
  const cacheKey = `enrolled-courses-${userId}`;
  const cachedEnrolledCourses = getFromLocalCache(cacheKey);
  if (cachedEnrolledCourses) {
    console.log('从本地缓存返回已加入课程数据');
    return cachedEnrolledCourses;
  }
  
  // 联合查询课程和注册信息，添加对已发布课程的过滤
  const { data, error } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      status,
      progress,
      enrolled_at,
      courses:course_id(*)
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('获取已加入课程失败:', error);
    throw new Error('获取已加入课程失败');
  }
  
  if (!data || data.length === 0) {
    console.log('没有找到已加入课程');
    return [];
  }
  
  // 提取课程数据并转换为EnrolledCourse类型数组
  // 标记课程是否可用（已发布）
  const coursesWithProgress = data.map(enrollment => ({
    ...(enrollment.courses as Course),
    progress: enrollment.progress,
    enrollmentId: enrollment.id,
    enrollmentStatus: enrollment.status,
    enrolledAt: enrollment.enrolled_at,
    isAvailable: (enrollment.courses as Course).status === 'published'
  }));
  
  // 保存到本地缓存
  saveToLocalCache(cacheKey, coursesWithProgress);
  
  return coursesWithProgress;
};

// 课程注册操作
export const enrollCourse = async ({ userId, courseId }: { userId: string; courseId: string }) => {
  if (!userId || !courseId) {
    throw new Error('用户ID或课程ID无效');
  }
  
  console.log(`尝试加入课程: ${courseId}`);
  
  // 验证课程是否存在并且是已发布状态
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id, status')
    .eq('id', courseId)
    .eq('status', 'published')
    .single();
  
  if (courseError || !courseData) {
    throw new Error('课程不存在或未发布');
  }
  
  // 检查用户是否已经注册了这个课程
  const { data: enrollments, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId);
    
  if (enrollmentError) {
    throw new Error('检查课程注册状态失败');
  }
  
  // 如果用户已经注册，返回已存在的注册ID
  if (enrollments && enrollments.length > 0) {
    return { existingEnrollment: true, enrollmentId: enrollments[0].id };
  }
  
  // 用户未注册，插入新的注册记录
  const { data, error: insertError } = await supabase
    .from('course_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      status: 'active',
      progress: 0
    })
    .select('id')
    .single();
  
  if (insertError) {
    throw new Error('注册课程失败');
  }
  
  return { existingEnrollment: false, enrollmentId: data.id };
};

export const useCoursesData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // 获取所有课程
  const { 
    data: courses = [], 
    isLoading: loading,
    refetch: refetchCourses
  } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchAllCourses,
    enabled: true, // 总是启用这个查询
  });
  
  // 获取用户已加入的课程
  const { 
    data: enrolledCourses = [], 
    isLoading: loadingEnrolled,
    refetch: refetchEnrolledCourses 
  } = useQuery({
    queryKey: ['enrolledCourses', user?.id],
    queryFn: () => user?.id ? fetchEnrolledCourses(user.id) : Promise.resolve([]),
    enabled: !!user?.id, // 仅在用户已登录时启用
  });
  
  // 课程注册mutation
  const enrollMutation = useMutation({
    mutationFn: enrollCourse,
    onSuccess: (result, variables) => {
      if (result.existingEnrollment) {
        toast.success('您已注册过此课程，正在跳转...');
      } else {
        toast.success('成功加入课程！');
        // 使缓存的已加入课程查询无效，强制重新获取
        queryClient.invalidateQueries({ queryKey: ['enrolledCourses', user?.id] });
      }
      navigate(`/course/${variables.courseId}`);
    },
    onError: (error) => {
      console.error('加入课程失败:', error);
      toast.error(error instanceof Error ? error.message : '加入课程失败，请稍后重试');
    }
  });
  
  // 处理课程注册
  const handleEnrollCourse = async (courseId: string) => {
    if (!user) {
      toast.error('请先登录');
      navigate('/auth');
      return;
    }
    
    enrollMutation.mutate({ userId: user.id, courseId });
  };
  
  // 手动强制刷新所有数据的函数
  const refreshAll = () => {
    refetchCourses();
    if (user?.id) {
      refetchEnrolledCourses();
    }
  };
  
  return {
    courses,
    enrolledCourses,
    loading,
    loadingEnrolled,
    loadingEnrollment: enrollMutation.isPending,
    refreshAll,
    fetchCourses: refetchCourses,
    fetchEnrolledCourses: refetchEnrolledCourses,
    handleEnrollCourse
  };
};
