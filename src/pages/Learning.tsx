import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// 导入拆分的组件
import InProgressCourses from '@/components/learning/InProgressCourses';
import CompletedCourses from '@/components/learning/CompletedCourses';
import SavedCourses from '@/components/learning/SavedCourses';

const Learning = () => {
  const { user } = useAuth();
  const { enrolledCourses, loadingEnrolled } = useCoursesData();
  const queryClient = useQueryClient();

  // 在组件挂载时预获取常用数据
  useEffect(() => {
    if (user) {
      // 确保数据已加载到缓存，使页面切换回来时不会重新请求
      queryClient.prefetchQuery({
        queryKey: ['enrolledCourses', user.id],
        staleTime: 5 * 60 * 1000 // 5分钟内保持数据新鲜
      });
      
      // 优化性能 - 预获取探索课程页面的数据
      queryClient.prefetchQuery({
        queryKey: ['courses'],
        staleTime: 5 * 60 * 1000
      });
    }
    
    // 监听页面可见性变化，在用户返回页面时检查数据是否需要刷新
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const cachedData = queryClient.getQueryData(['enrolledCourses', user.id]);
        if (!cachedData) {
          queryClient.invalidateQueries({ queryKey: ['enrolledCourses', user.id] });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, queryClient]);

  // 使用useMemo优化过滤操作
  const inProgressCourses = React.useMemo(() => 
    enrolledCourses.filter(course => course.progress < 100), 
    [enrolledCourses]
  );
  
  const completedCourses = React.useMemo(() => 
    enrolledCourses.filter(course => course.progress >= 100), 
    [enrolledCourses]
  );

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">我的学习</h1>
        <Button asChild>
          <Link to="/explore-courses">
            <Search className="mr-2 h-4 w-4" /> 探索更多课程
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="inProgress" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="inProgress">进行中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="saved">已保存</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inProgress">
          <InProgressCourses 
            courses={inProgressCourses} 
            loading={loadingEnrolled} 
          />
        </TabsContent>
        
        <TabsContent value="completed">
          <CompletedCourses 
            courses={completedCourses} 
            loading={loadingEnrolled} 
          />
        </TabsContent>
        
        <TabsContent value="saved">
          <SavedCourses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
