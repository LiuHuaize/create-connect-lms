import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import ExploreTabsContent from '@/components/explore/TabsContent';
import useExploreCoursesData from '@/hooks/useExploreCoursesData';

const ExploreCourses = () => {
  const {
    // 状态
    searchQuery,
    setSearchQuery,
    selectedCategory,
    activeTab,
    setActiveTab,
    categories,
    
    // 数据
    filteredCourses,
    loading,
    loadingEnrollment,
    
    // 方法
    handleCategoryChange,
    handleEnrollCourse
  } = useExploreCoursesData();

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
