import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import ExploreTabsContent from '@/components/explore/TabsContent';
import { useCoursesData } from '@/hooks/useCoursesData';
import { filterCourses } from '@/utils/courseUtils';
import { BASE_CATEGORIES, CourseCategory, COURSE_CATEGORIES, updateCourseCategories } from '@/types/course-enrollment';
import { useQueryClient } from '@tanstack/react-query';

const ExploreCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [activeTab, setActiveTab] = useState("recommended");
  const [categories, setCategories] = useState<CourseCategory[]>(COURSE_CATEGORIES);
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
        console.log('课程数据已加载，更新分类列表...');
        console.log('当前课程数量:', courses.length);
        
        const updatedCategories = updateCourseCategories(courses);
        console.log('已更新分类列表:', updatedCategories);
        
        setCategories(updatedCategories);
      } catch (error) {
        console.error('更新分类列表时出错:', error);
      }
    }
  }, [courses]);

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

  // 当用户选择一个分类时记录它，以便于调试
  const handleCategoryChange = (category: CourseCategory) => {
    console.log('用户选择了分类:', category);
    setSelectedCategory(category);
  };

  // 优化搜索和过滤逻辑，使用记忆化过滤结果
  const filteredCourses = React.useMemo(() => { 
    console.log('过滤课程，使用分类:', selectedCategory);
    return filterCourses(courses, searchQuery, selectedCategory);
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">探索课程</h1>
      <p className="text-lg text-gray-600 mb-8">
        发现并加入符合您兴趣的课程，开始您的学习之旅
      </p>
      
      <SearchAndFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        categories={categories}
      />
      
      <Tabs 
        defaultValue="recommended" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="bg-gray-100/80 p-1">
          <TabsTrigger value="recommended" className="rounded-md data-[state=active]:bg-white">
            推荐
          </TabsTrigger>
          <TabsTrigger value="popular" className="rounded-md data-[state=active]:bg-white">
            热门
          </TabsTrigger>
          <TabsTrigger value="latest" className="rounded-md data-[state=active]:bg-white">
            最新
          </TabsTrigger>
        </TabsList>
        
        <ExploreTabsContent 
          activeTab={activeTab}
          filteredCourses={filteredCourses}
          loading={loading} 
          loadingEnrollment={loadingEnrollment}
          handleEnrollCourse={handleEnrollCourse}
        />
      </Tabs>
    </div>
  );
};

export default ExploreCourses;
