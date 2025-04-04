
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

export type CourseCategory = '全部' | '商业规划' | '游戏设计' | '产品开发' | '编程' | '创意写作';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // 定义课程分类
  const categories: CourseCategory[] = ['全部', '商业规划', '游戏设计', '产品开发', '编程', '创意写作'];

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // 获取已发布的课程
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('status', 'published');
        
        if (error) throw error;
        console.log('从数据库获取的课程:', data);
        
        // Ensure the data conforms to the Course type
        const typedCourses: Course[] = data?.map(course => ({
          ...course,
          status: course.status as Course['status'],
          tags: course.tags || [],
          price: course.price || null,
          description: course.description || null,
          short_description: course.short_description || null,
          cover_image: course.cover_image || null,
        })) || [];
        
        setCourses(typedCourses);
      } catch (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnrollCourse = (courseId: string) => {
    toast.success('成功加入课程！');
    navigate(`/course/${courseId}`);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '全部' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">探索课程</h1>
      <p className="text-gray-600 mb-6">发现并加入符合您兴趣的课程</p>
      
      {/* 搜索和筛选 */}
      <SearchAndFilter 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
      />
      
      <Tabs defaultValue="recommended" className="mb-8">
        <TabsList>
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
            />
          )}
        </TabsContent>
        
        <TabsContent value="popular" className="mt-6">
          <div className="text-center py-12">
            <p className="text-gray-500">即将推出热门课程...</p>
          </div>
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <div className="text-center py-12">
            <p className="text-gray-500">即将推出最新课程...</p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 加入社区 */}
      <CommunityCard />
    </div>
  );
};

export default ExploreCourses;
