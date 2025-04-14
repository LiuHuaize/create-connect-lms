import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, Award, Search, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCoursesData, EnrolledCourse } from '@/hooks/useCoursesData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

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
        <Button asChild className="bg-connect-blue hover:bg-blue-600">
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
        
        <TabsContent value="inProgress" className="space-y-6">
          {loadingEnrolled ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">正在加载课程...</p>
            </div>
          ) : inProgressCourses.length > 0 ? (
            // 显示用户已加入的课程
            inProgressCourses.map((course) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-connect-lightBlue text-connect-blue inline-block px-3 py-1 rounded-full text-xs font-medium">
                          {course.category || '未分类'}
                        </div>
                        
                        {course.isAvailable === false && (
                          <div className="bg-amber-100 text-amber-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                            <AlertCircle size={12} className="mr-1" /> 课程暂不可用
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                      <p className="text-gray-600 mb-4">{course.short_description || '暂无描述'}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center text-gray-500">
                          <BookOpen size={16} className="mr-1" />
                          <span className="text-sm">进行中</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock size={16} className="mr-1" />
                          <span className="text-sm">
                            加入于 {course.enrolledAt ? format(new Date(course.enrolledAt), 'yyyy-MM-dd') : '未知'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {course.isAvailable !== false ? (
                      <Link to={`/course/${course.id}`}>
                        <button className="bg-connect-blue text-white p-3 rounded-full hover:bg-blue-600 transition-colors">
                          <Play size={20} fill="white" />
                        </button>
                      </Link>
                    ) : (
                      <button disabled className="bg-gray-300 text-white p-3 rounded-full cursor-not-allowed opacity-50">
                        <Play size={20} fill="white" />
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">进度</span>
                      <span className="text-sm text-gray-500">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">继续学习</h4>
                      <p className="text-sm text-gray-500">{course.title}</p>
                    </div>
                    
                    {course.isAvailable !== false ? (
                      <Link to={`/course/${course.id}`}>
                        <button className="py-2 px-4 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                          继续
                        </button>
                      </Link>
                    ) : (
                      <div className="py-2 px-4 text-gray-500 text-sm">
                        教师已暂时取消此课程的发布
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">您还没有加入任何课程</p>
              <Button asChild className="bg-connect-blue hover:bg-blue-600">
                <Link to="/explore-courses">浏览课程</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          {loadingEnrolled ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">正在加载课程...</p>
            </div>
          ) : completedCourses.length > 0 ? (
            // 显示已完成的课程
            completedCourses.map((course) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center mb-3">
                      <div className="bg-green-100 text-green-700 inline-block px-3 py-1 rounded-full text-xs font-medium mr-3">
                        {course.category || '未分类'}
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Award size={16} className="mr-1" />
                        <span className="text-xs font-medium">已完成</span>
                      </div>
                      
                      {course.isAvailable === false && (
                        <div className="ml-3 bg-amber-100 text-amber-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                          <AlertCircle size={12} className="mr-1" /> 课程暂不可用
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                    <p className="text-gray-600">{course.short_description || '暂无描述'}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {course.isAvailable !== false ? (
                      <Link to={`/course/${course.id}`}>
                        <button className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          回顾
                        </button>
                      </Link>
                    ) : (
                      <button disabled className="py-2 px-4 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed opacity-50 text-sm">
                        暂不可用
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">您还没有完成任何课程</p>
              <Button asChild className="bg-connect-blue hover:bg-blue-600">
                <Link to="/explore-courses">浏览课程</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">您尚未保存任何课程</p>
            <Button asChild className="bg-connect-blue hover:bg-blue-600">
              <Link to="/explore-courses">浏览课程</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
