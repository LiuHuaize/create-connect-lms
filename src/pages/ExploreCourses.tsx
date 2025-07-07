import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import ExploreTabsContent from '@/components/explore/TabsContent';
import useExploreCoursesData from '@/hooks/useExploreCoursesData';
import PageContainer from '@/components/layout/PageContainer';

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
    handleViewCourseDetails,
  } = useExploreCoursesData();

  return (
    <PageContainer 
      title="探索课程" 
      subtitle="发现并了解符合您兴趣的课程，开始您的学习之旅"
    >
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
        <TabsList className="bg-blue-50/80 p-1 border border-blue-100">
          <TabsTrigger 
            value="recommended" 
            className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-blue-700 hover:bg-blue-100"
          >
            推荐
          </TabsTrigger>
          <TabsTrigger 
            value="popular" 
            className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-blue-700 hover:bg-blue-100"
          >
            热门
          </TabsTrigger>
          <TabsTrigger 
            value="latest" 
            className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm text-blue-700 hover:bg-blue-100"
          >
            最新
          </TabsTrigger>
        </TabsList>
        
        <ExploreTabsContent 
          activeTab={activeTab}
          filteredCourses={filteredCourses}
          loading={loading} 
          loadingEnrollment={loadingEnrollment}
          handleViewCourseDetails={handleViewCourseDetails}
        />
      </Tabs>
    </PageContainer>
  );
};

export default ExploreCourses;
