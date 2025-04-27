import { useState, useEffect } from 'react';
import { useCoursesData } from './useCoursesData';
import { filterCourses } from '@/utils/courseUtils';
import { CourseCategory, COURSE_CATEGORIES, updateCourseCategories } from '@/types/course-enrollment';
import { useQueryClient } from '@tanstack/react-query';

export const useExploreCoursesData = () => {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [activeTab, setActiveTab] = useState("recommended");
  const [categories, setCategories] = useState<CourseCategory[]>(COURSE_CATEGORIES);
  
  // 获取课程数据
  const queryClient = useQueryClient();
  const {
    courses,
    loading,
    loadingEnrollment,
    handleEnrollCourse
  } = useCoursesData();

  // 更新可用的分类列表
  useEffect(() => {
    if (courses && courses.length > 0) {
      try {
        const updatedCategories = updateCourseCategories(courses);
        setCategories(updatedCategories);
      } catch (error) {
        console.error('更新分类列表时出错:', error);
      }
    }
  }, [courses]);

  // 预取数据逻辑
  useEffect(() => {
    // 确保数据已加载到缓存，这样页面切换回来时不会重新请求
    queryClient.prefetchQuery({
      queryKey: ['courses'],
      staleTime: 5 * 60 * 1000 // 5分钟内保持数据新鲜
    });
    
    // 监听页面可见性变化，当用户从其他标签页返回时刷新数据
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变得可见时，如果数据已过期则刷新
        const cachedData = queryClient.getQueryData(['courses']);
        if (!cachedData) {
          queryClient.invalidateQueries({ queryKey: ['courses'] });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);

  // 分类变更处理
  const handleCategoryChange = (category: CourseCategory) => {
    setSelectedCategory(category);
  };

  // 使用记忆化过滤结果
  const filteredCourses = filterCourses(courses, searchQuery, selectedCategory);

  return {
    // 状态
    searchQuery,
    setSearchQuery,
    selectedCategory,
    activeTab,
    setActiveTab,
    categories,
    
    // 数据
    courses,
    filteredCourses,
    loading,
    loadingEnrollment,
    
    // 方法
    handleCategoryChange,
    handleEnrollCourse
  };
};

export default useExploreCoursesData; 