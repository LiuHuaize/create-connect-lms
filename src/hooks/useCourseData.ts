import { useQuery } from 'react-query';
import { supabase } from '../lib/supabase';
import { getFromLocalCache, saveToLocalCache } from '../lib/cache';

// 获取用户的课程注册信息
const {
  data: enrollmentData,
  isLoading: isLoadingEnrollment,
  refetch: refetchEnrollment
} = useQuery({
  queryKey: ['enrollment', courseId, user?.id],
  queryFn: () => fetchEnrollmentInfo(courseId || '', user?.id || '', true), // 添加强制刷新参数
  enabled: !!courseId && !!user?.id,
  staleTime: 60 * 1000, // 降低缓存时间到1分钟，确保进度更新更及时
});

// 修改fetchEnrollmentInfo函数，添加forceRefresh参数
const fetchEnrollmentInfo = async (courseId: string, userId: string, forceRefresh = false) => {
  if (!courseId || !userId) return null;
  
  // 强制刷新时跳过缓存
  if (!forceRefresh) {
    // 尝试从本地缓存获取
    const cacheKey = `enrollment-${courseId}-${userId}`;
    const cachedData = getFromLocalCache(cacheKey);
    if (cachedData) {
      console.log('从本地缓存返回课程注册信息');
      return cachedData;
    }
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
    const cacheKey = `enrollment-${courseId}-${userId}`;
    saveToLocalCache(cacheKey, enrollments);
  }
  
  return enrollments;
}; 