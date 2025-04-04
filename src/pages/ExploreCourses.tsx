
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Search, Clock, BookOpen, Tag } from 'lucide-react';
import CourseCard from '@/components/ui/CourseCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type CourseCategory = '全部' | '商业规划' | '游戏设计' | '产品开发' | '编程' | '创意写作';

const ExploreCourses = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory>('全部');
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 定义课程分类
  const categories: CourseCategory[] = ['全部', '商业规划', '游戏设计', '产品开发', '编程', '创意写作'];

  // 模拟推荐课程
  const featuredCourses = [
    {
      id: "business-101",
      type: "skill",
      title: "商业计划开发",
      description: "学习如何创建全面的商业计划。了解市场研究、财务预测和战略规划。",
      coursesCount: 7,
      certificate: true,
      level: "中级",
      hours: 22,
      category: '商业规划',
    },
    {
      id: "game-design-101",
      type: "free",
      title: "卡牌游戏设计基础",
      description: "探索卡牌游戏设计的基础知识。学习游戏机制、平衡策略和原型制作技术。",
      level: "初级",
      hours: 10,
      category: '游戏设计',
    },
    {
      id: "product-management",
      type: "career",
      title: "项目管理专业",
      description: "构建端到端项目管理技能。掌握规划、执行、监控和团队领导能力。",
      coursesCount: 7,
      certificate: true,
      level: "中级到高级",
      hours: 50,
      category: '产品开发',
    },
    {
      id: "creative-writing",
      type: "skill",
      title: "创意写作入门",
      description: "掌握创意写作的基本技巧，开发独特的写作风格和讲故事的能力。",
      coursesCount: 5,
      certificate: false,
      level: "初级",
      hours: 15,
      category: '创意写作',
    },
  ];

  useEffect(() => {
    // 真实应用中，这里应该从Supabase获取已发布的课程
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // 模拟从数据库获取数据的延迟
        setTimeout(() => {
          setCourses(featuredCourses);
          setLoading(false);
        }, 1000);
        
        // 实际的Supabase查询应该类似这样:
        // const { data, error } = await supabase
        //   .from('courses')
        //   .select('*')
        //   .eq('status', 'published');
        // 
        // if (error) throw error;
        // setCourses(data || []);
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
    // 在实际应用中，这里应该将课程添加到用户的已注册课程中
    toast.success('成功加入课程！');
    // 跳转到课程页面
    navigate(`/course/${courseId}`);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '全部' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">探索课程</h1>
      <p className="text-gray-600 mb-6">发现并加入符合您兴趣的课程</p>
      
      {/* 搜索和筛选 */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="搜索课程..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
      
      <Tabs defaultValue="recommended" className="mb-8">
        <TabsList>
          <TabsTrigger value="recommended">推荐</TabsTrigger>
          <TabsTrigger value="popular">热门</TabsTrigger>
          <TabsTrigger value="new">最新</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommended" className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <Card key={item} className="p-6 h-60 animate-pulse">
                  <div className="bg-gray-200 h-4 w-1/3 mb-4 rounded"></div>
                  <div className="bg-gray-200 h-6 w-3/4 mb-4 rounded"></div>
                  <div className="bg-gray-200 h-4 w-full mb-6 rounded"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="bg-gray-200 h-4 w-16 rounded"></div>
                    <div className="bg-gray-200 h-4 w-20 rounded"></div>
                  </div>
                  <div className="bg-gray-200 h-8 w-28 rounded mt-auto"></div>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">没有找到符合条件的课程</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <div key={course.id} className="relative">
                  <CourseCard
                    type={course.type}
                    title={course.title}
                    description={course.description}
                    coursesCount={course.coursesCount}
                    certificate={course.certificate}
                    level={course.level}
                    hours={course.hours}
                  />
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={() => handleEnrollCourse(course.id)}
                      variant="default"
                      size="sm"
                    >
                      加入课程
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
      <div className="bg-blue-50 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">想要获取更多学习资源？</h2>
        <p className="text-gray-600 mb-6">加入我们的学习社区，与其他学习者交流分享</p>
        <Button asChild size="lg" className="bg-connect-blue hover:bg-blue-600">
          <a href="/community">查看社区</a>
        </Button>
      </div>
    </div>
  );
};

export default ExploreCourses;
