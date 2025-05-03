import { useMemo, useEffect } from 'react';
import { useCoursesData } from './useCoursesData';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

export const useLearningData = () => {
  const { user } = useAuth();
  const { enrolledCourses, loadingEnrolled } = useCoursesData();
  const queryClient = useQueryClient();

  // 在组件挂载时预获取常用数据
  useEffect(() => {
    if (user) {
      // 确保数据已加载到缓存，使页面切换回来时不会重新请求
      queryClient.prefetchQuery({
        queryKey: ['enrolledCourses', user.id],
        staleTime: 5 * 60 * 1000 // 5分钟内保持数据新鲜
      });
      
      // 优化性能 - 预获取探索课程页面的数据
      queryClient.prefetchQuery({
        queryKey: ['courses'],
        staleTime: 5 * 60 * 1000
      });
    }
    
    // 监听页面可见性变化，在用户返回页面时检查数据是否需要刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const cachedData = queryClient.getQueryData(['enrolledCourses', user.id]);
        if (!cachedData) {
          queryClient.invalidateQueries({ queryKey: ['enrolledCourses', user.id] });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, queryClient]);

  // 先过滤出所有已发布的课程
  const availableCourses = useMemo(() => 
    enrolledCourses.filter(course => course.isAvailable !== false),
    [enrolledCourses]
  );

  // 使用已过滤的可用课程来生成进行中和已完成的课程列表
  const inProgressCourses = useMemo(() => 
    availableCourses.filter(course => course.progress < 100), 
    [availableCourses]
  );
  
  const completedCourses = useMemo(() => 
    availableCourses.filter(course => course.progress >= 100), 
    [availableCourses]
  );

  return {
    // 数据
    enrolledCourses: availableCourses, // 只返回已发布的课程
    inProgressCourses,
    completedCourses,
    loadingEnrolled,
    
    // 用户信息
    user
  };
};

export default useLearningData; 