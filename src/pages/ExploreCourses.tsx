import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import ExploreTabsContent from '@/components/explore/TabsContent';
import { useCoursesData } from '@/hooks/useCoursesData';
import { filterCourses } from '@/utils/courseUtils';
import { COURSE_CATEGORIES, CourseCategory } from '@/types/course-enrollment';
import { useQueryClient } from '@tanstack/react-query';
import XiyoujiCourse from '@/components/xiyouji/XiyoujiCourse';

const ExploreCourses = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [activeTab, setActiveTab] = useState("recommended");
  const [showXiyoujiCourse, setShowXiyoujiCourse] = useState(false);
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

  // 西游记课程的处理
  const handleXiyoujiCourseEnroll = () => {
    setShowXiyoujiCourse(true);
  };

  // 如果显示西游记课程页面，直接返回该组件
  if (showXiyoujiCourse) {
    return <XiyoujiCourse onBack={() => setShowXiyoujiCourse(false)} />;
  }

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
      
      {/* 西游记PBL课程卡片(置顶展示) */}
      <div className="mb-12">
        <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
          <span>特色课程</span>
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-medium">新上线</span>
        </h2>
        
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 h-64 overflow-hidden relative">
              <img 
                src="https://source.unsplash.com/random/800x600/?journey,chinese,adventure,cartoon" 
                alt="西游记PBL课程" 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500"></div>
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/50">
                <span className="text-xs font-medium text-white">西游记创意编程课</span>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center mb-1">
                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-white bg-indigo-600 rounded-sm mr-2">PBL项目式学习</span>
                  <span className="text-xs text-gray-500">适合 10-12 岁</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">西游记PBL项目课程</h3>
                <p className="text-sm font-medium text-gray-600 mb-3">假如你穿越到古代，成为师徒四人的技术负责人</p>
                <p className="text-gray-600 text-sm mb-4">这门课程将引导10岁左右的孩子通过创意编程，解决西游记中师徒四人的旅程难题。课程融合了故事分析、产品设计和编程创作，让孩子在有趣的互动中学习问题解决和编程思维。</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">人物分析</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">产品设计</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">流程图绘制</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">网站制作</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm">创意思维</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-between items-center border-t border-gray-100 pt-4">
                <div className="flex items-center text-xs text-gray-500 gap-4 mb-4 md:mb-0">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>约8小时课程</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <span>已有 156 人加入</span>
                  </div>
                </div>
                
                <button 
                  onClick={handleXiyoujiCourseEnroll}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-sm transition-all duration-200"
                >
                  立即加入课程
                </button>
              </div>
            </div>
          </div>
        </div>
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
