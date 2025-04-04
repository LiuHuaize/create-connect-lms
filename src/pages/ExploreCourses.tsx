
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
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);

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
        
        if (!data || data.length === 0) {
          setCourses([]);
          setLoading(false);
          return;
        }
        
        // 处理从数据库中获取的课程数据
        // 注意：我们不使用课程对象的difficulty和category属性，因为数据库schema中可能没有这些字段
        // 在处理之前，添加了适当的默认值来防止TypeScript错误
        const typedCourses: Course[] = data.map(course => {
          // 首先创建一个基本课程对象，包含数据库中存在的所有属性
          const baseCourse = {
            id: course.id || '',
            title: course.title,
            description: course.description || null,
            short_description: course.short_description || null,
            author_id: course.author_id,
            cover_image: course.cover_image || null,
            status: course.status as Course['status'],
            price: course.price || null,
            tags: course.tags || [],
            created_at: course.created_at,
            updated_at: course.updated_at,
          };
          
          // 然后，添加TypeScript模型中需要但数据库可能没有的属性
          // 明确转换为Course类型以确保类型安全
          return {
            ...baseCourse,
            // 使用类型断言，如果不存在，则提供默认值
            difficulty: (course as any).difficulty as Course['difficulty'] || 'initial',
            category: (course as any).category as string || null
          } as Course;
        });
        
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

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setLoadingEnrollment(true);
      
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }
      
      // 检查课程ID是否存在
      if (!courseId) {
        toast.error('课程ID无效');
        return;
      }
      
      // 确认课程在数据库中存在
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
      
      if (!courseData) {
        toast.error('课程不存在或已被移除');
        return;
      }
      
      // 成功后导航到课程页面
      toast.success('成功加入课程！');
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('加入课程失败:', error);
      toast.error('加入课程失败，请稍后再试');
    } finally {
      setLoadingEnrollment(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === '全部' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
