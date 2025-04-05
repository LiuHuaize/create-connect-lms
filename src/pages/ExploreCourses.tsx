import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import ExploreTabsContent from '@/components/explore/TabsContent';
import { useCoursesData } from '@/hooks/useCoursesData';
import { filterCourses } from '@/utils/courseUtils';
import { COURSE_CATEGORIES, CourseCategory } from '@/types/course-enrollment';
import { useQueryClient } from '@tanstack/react-query';

const ExploreCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [activeTab, setActiveTab] = useState("recommended");
  const queryClient = useQueryClient();
  
  const {
    courses,
    loading,
    loadingEnrollment,
    handleEnrollCourse
  } = useCoursesData();

  // 在组件加载时预取课程数据
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

  // 优化搜索和过滤逻辑，使用记忆化过滤结果
  const filteredCourses = React.useMemo(() => 
    filterCourses(courses, searchQuery, selectedCategory), 
    [courses, searchQuery, selectedCategory]
  );

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">探索课程</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">发现并加入符合您兴趣的课程，开始您的学习之旅</p>
      </div>
      
      {/* 搜索和筛选 */}
      <div className="mb-8">
        <SearchAndFilter 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={COURSE_CATEGORIES}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList className="mb-6">
          <TabsTrigger value="recommended">推荐</TabsTrigger>
          <TabsTrigger value="popular">热门</TabsTrigger>
          <TabsTrigger value="new">最新</TabsTrigger>
        </TabsList>
        
        <ExploreTabsContent
          activeTab={activeTab}
          loading={loading}
          filteredCourses={filteredCourses}
          onEnroll={handleEnrollCourse}
          loadingEnrollment={loadingEnrollment}
        />
      </Tabs>
    </div>
  );
};

export default ExploreCourses;
