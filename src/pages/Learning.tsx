import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, Award, Search, Bookmark, CheckCircle2, Book, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCoursesData } from '@/hooks/useCoursesData';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

// 生成随机课程封面背景颜色
const generateCoverBg = (index: number) => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-400 to-pink-600',
    'from-indigo-500 to-blue-600',
    'from-violet-500 to-indigo-600',
  ];
  return gradients[index % gradients.length];
};

const Learning = () => {
  const { user } = useAuth();
  const { enrolledCourses, loadingEnrolled, fetchEnrolledCourses } = useCoursesData();

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="mb-10 bg-gradient-to-r from-connect-blue to-connect-purple p-8 rounded-2xl text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]"></div>
        <div className="absolute right-0 bottom-0 opacity-10">
          <GraduationCap size={280} />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-3">我的学习</h1>
          <p className="text-white/80 mb-6 max-w-2xl">继续您的学习之旅，探索新课程并跟踪您的学习进度。</p>
          <Button asChild className="bg-white text-connect-blue hover:bg-white/90 px-5 py-2 shadow-md">
            <Link to="/explore-courses">
              <Search className="mr-2 h-4 w-4" /> 探索更多课程
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="inProgress" className="w-full">
        <TabsList className="mb-6 bg-white border border-gray-200 p-1 shadow-sm">
          <TabsTrigger value="inProgress" className="data-[state=active]:bg-blue-50 data-[state=active]:text-connect-blue">
            <Book className="mr-2 h-4 w-4" />
            进行中
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-blue-50 data-[state=active]:text-connect-blue">
            <CheckCircle2 className="mr-2 h-4 w-4" /> 
            已完成
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:bg-blue-50 data-[state=active]:text-connect-blue">
            <Bookmark className="mr-2 h-4 w-4" />
            已保存
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inProgress" className="space-y-6">
          {loadingEnrolled ? (
            <div className="text-center py-12">
              <div className="animate-pulse-slow mx-auto h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <Book size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500">正在加载课程...</p>
            </div>
          ) : enrolledCourses.length > 0 ? (
            // 显示用户已加入的课程
            enrolledCourses.filter(course => course.progress < 100).map((course, index) => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="sm:flex">
                  {/* 课程封面 */}
                  <div className="sm:w-64 h-48 sm:h-auto">
                    {course.cover_image ? (
                      <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${generateCoverBg(index)} flex items-center justify-center`}>
                        <BookOpen size={48} className="text-white/70" />
                      </div>
                    )}
                  </div>
                  
                  {/* 课程信息 */}
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="bg-blue-50 text-connect-blue inline-block px-3 py-1 rounded-full text-xs font-medium mb-3">
                          {course.category || '未分类'}
                        </div>
                        <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{course.short_description || '暂无描述'}</p>
                        
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
                      
                      <Link to={`/course/${course.id}`}>
                        <button className="bg-gradient-to-r from-connect-blue to-blue-500 text-white p-3 rounded-full hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all">
                          <Play size={20} fill="white" />
                        </button>
                      </Link>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">进度</span>
                        <span className="text-sm text-gray-500">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2 bg-gray-100" indicatorClassName="bg-gradient-to-r from-connect-blue to-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">继续学习</h4>
                      <p className="text-sm text-gray-500 line-clamp-1">{course.title}</p>
                    </div>
                    <Link to={`/course/${course.id}`}>
                      <button className="py-2 px-5 bg-connect-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm shadow-sm hover:shadow">
                        继续
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <BookOpen size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">您还没有加入任何课程</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">开始您的学习之旅，探索我们丰富的课程内容</p>
              <Button asChild className="bg-connect-blue hover:bg-blue-600 shadow">
                <Link to="/explore-courses">浏览课程</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {loadingEnrolled ? (
            <div className="text-center py-12">
              <div className="animate-pulse-slow mx-auto h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <CheckCircle2 size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-500">正在加载课程...</p>
            </div>
          ) : enrolledCourses.filter(course => course.progress >= 100).length > 0 ? (
            // 显示已完成的课程
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.filter(course => course.progress >= 100).map((course, index) => (
                <div key={course.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex">
                    {/* 课程封面 */}
                    <div className="w-24 h-24 sm:w-32 sm:h-full">
                      {course.cover_image ? (
                        <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${generateCoverBg(index)} flex items-center justify-center`}>
                          <Award size={24} className="text-white/70" />
                        </div>
                      )}
                    </div>
                    
                    {/* 课程信息 */}
                    <div className="p-5 flex-1">
                      <div className="flex items-center mb-3">
                        <div className="bg-green-50 text-green-600 inline-block px-3 py-1 rounded-full text-xs font-medium mr-3">
                          {course.category || '未分类'}
                        </div>
                        <div className="flex items-center text-amber-500">
                          <Award size={16} className="mr-1" />
                          <span className="text-xs font-medium">已完成</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{course.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.short_description || '暂无描述'}</p>
                      
                      <Link to={`/course/${course.id}`}>
                        <button className="py-1.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs">
                          回顾
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <CheckCircle2 size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">您还没有完成任何课程</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">继续努力学习，完成您的课程</p>
              <Button asChild className="bg-connect-blue hover:bg-blue-600 shadow">
                <Link to="/explore-courses">浏览课程</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="saved">
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
            <Bookmark size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-2">您尚未保存任何课程</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">收藏感兴趣的课程，方便以后查看</p>
            <Button asChild className="bg-connect-blue hover:bg-blue-600 shadow">
              <Link to="/explore-courses">浏览课程</Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Learning;
