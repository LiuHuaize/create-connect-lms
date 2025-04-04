
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Course } from '@/types/course';
import SearchAndFilter from '@/components/explore/SearchAndFilter';
import CourseList from '@/components/explore/CourseList';
import CommunityCard from '@/components/explore/CommunityCard';
import LoadingCourses from '@/components/explore/LoadingCourses';
import EmptyState from '@/components/explore/EmptyState';

// 简化后的分类类型，不再需要强制与课程的category匹配
export type CourseCategory = '全部' | '商业规划' | '游戏设计' | '产品开发' | '编程' | '创意写作';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);

  // 定义课程分类
  const categories: CourseCategory[] = ['全部', '商业规划', '游戏设计', '产品开发', '编程', '创意写作'];

  useEffect(() => {
    fetchCourses();
  }, []);

  // 提取获取课程的逻辑到单独的函数中
  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('正在获取课程...');
      
      // 获取已发布的课程
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published');
      
      if (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程失败');
        setLoading(false);
        return;
      }
      
      console.log('从数据库获取的课程:', data);
      
      if (!data || data.length === 0) {
        console.log('没有找到课程');
        setCourses([]);
        setLoading(false);
        return;
      }
      
      // 直接将数据转换为Course类型，不需要额外处理difficulty和category
      setCourses(data as Course[]);
    } catch (error) {
      console.error('获取课程失败:', error);
      toast.error('获取课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      if (!courseId) {
        toast.error('课程ID无效');
        return;
      }
      
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }
      
      setLoadingEnrollment(true);
      console.log(`尝试加入课程: ${courseId}`);
      
      // 验证课程是否存在
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (courseError) {
        console.error('获取课程详情失败:', courseError);
        toast.error('课程不存在或已被移除');
        return;
      }
      
      // 课程存在，直接导航到课程详情页
      toast.success('成功加入课程！');
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('加入课程失败:', error);
      toast.error('加入课程失败，请稍后再试');
    } finally {
      setLoadingEnrollment(false);
    }
  };

  // 过滤课程的逻辑
  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // 由于我们已经去除了category字段，我们在此处简化过滤逻辑
    // 如果选择了"全部"分类，则显示所有课程
    return selectedCategory === '全部' || matchesSearch;
  });

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
          categories={categories}
        />
      </div>
      
      <Tabs defaultValue="recommended" className="mb-12">
        <TabsList className="mb-6">
          <TabsTrigger value="recommended">推荐</TabsTrigger>
          <TabsTrigger value="popular">热门</TabsTrigger>
          <TabsTrigger value="new">最新</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommended" className="mt-6">
          {loading ? (
            <LoadingCourses />
          ) : filteredCourses.length === 0 ? (
            <EmptyState />
          ) : (
            <CourseList 
              courses={filteredCourses} 
              onEnroll={handleEnrollCourse}
              loadingEnrollment={loadingEnrollment}
            />
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="mt-6">
          {loading ? (
            <LoadingCourses />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">即将推出热门课程...</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          {loading ? (
            <LoadingCourses />
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">即将推出最新课程...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* 加入社区 */}
      <CommunityCard />
    </div>
  );
};

export default ExploreCourses;
