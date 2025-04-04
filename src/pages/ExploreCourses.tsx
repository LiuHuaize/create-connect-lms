
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import CommunityCard from '@/components/explore/CommunityCard';
import ExploreTabsContent from '@/components/explore/TabsContent';
import { useCoursesData } from '@/hooks/useCoursesData';
import { filterCourses } from '@/utils/courseUtils';
import { COURSE_CATEGORIES, CourseCategory } from '@/types/course-enrollment';

const ExploreCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [activeTab, setActiveTab] = useState("recommended");
  
  const {
    courses,
    loading,
    loadingEnrollment,
    handleEnrollCourse
  } = useCoursesData();

  // 过滤课程
  const filteredCourses = filterCourses(courses, searchQuery, selectedCategory);

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
      
      {/* 加入社区 */}
      <CommunityCard />
    </div>
  );
};

export default ExploreCourses;
