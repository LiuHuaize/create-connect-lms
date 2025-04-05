
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, ExternalLink, BookOpen, PenLine, ChevronRight } from 'lucide-react';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Course } from '@/types/course';
import { toast } from 'sonner';
import { useCoursesData } from '@/hooks/useCoursesData';

const CourseSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { fetchEnrolledCourses } = useCoursesData();

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const userCourses = await courseService.getUserCourses(user.id);
        setCourses(userCourses);
      } catch (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleCreateNewCourse = () => {
    navigate('/course-creator');
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/course-creator?id=${courseId}`);
  };

  const handleViewCourse = (courseId: string) => {
    // 刷新已加入课程列表，以防有新发布的课程
    fetchEnrolledCourses();
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="animate-fade-in p-4 sm:p-8 max-w-7xl mx-auto">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">我的课程</h1>
        <p className="text-sm sm:text-base text-gray-500">选择一个课程继续编辑或创建新课程</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 创建新课程卡片 */}
        <Card className="group border border-gray-200 hover:border-gray-300 bg-gradient-to-br from-white to-gray-50 hover:shadow-md transition-all duration-300 overflow-hidden">
          <CardContent className="pt-8 flex flex-col items-center justify-center h-60">
            <div className="rounded-full bg-blue-50 p-4 mb-5 group-hover:bg-blue-100 transition-colors">
              <PlusCircle className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">创建新课程</h3>
            <p className="text-sm text-gray-500 text-center">从零开始设计一个全新课程</p>
          </CardContent>
          <CardFooter className="justify-center pb-8">
            <Button 
              onClick={handleCreateNewCourse} 
              size={isMobile ? "sm" : "default"}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
            >
              开始创建
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>

        {/* 现有课程卡片列表 */}
        {isLoading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="border border-gray-200 bg-white overflow-hidden">
              <div className="h-32 bg-gray-100 animate-pulse" />
              <CardHeader className="pb-2">
                <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse mb-4" />
                <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-9 w-20 bg-gray-100 rounded animate-pulse" />
              </CardFooter>
            </Card>
          ))
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all duration-300 overflow-hidden">
              <div 
                className="h-32 sm:h-40 bg-gradient-to-r from-gray-50 to-gray-100 bg-cover bg-center relative" 
                style={{ 
                  backgroundImage: course.cover_image 
                    ? `url(${course.cover_image})` 
                    : 'none'
                }}
              >
                {!course.cover_image && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen size={40} className="text-gray-300" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              </div>
              <CardHeader className="pb-2 relative">
                <CardTitle className="text-lg sm:text-xl line-clamp-1 font-semibold">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {course.short_description || '暂无描述'}
                </p>
                <div className="flex items-center mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    course.status === 'published' 
                      ? 'bg-green-50 text-green-600 border border-green-100' 
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {course.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => handleEditCourse(course.id!)}
                >
                  <PenLine className="h-4 w-4 mr-1.5" /> 编辑
                </Button>
                {course.status === 'published' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-full border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                    onClick={() => handleViewCourse(course.id!)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1.5" /> 查看
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {!isLoading && courses.length === 0 && (
        <div className="text-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-4">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">暂无课程</h3>
          <p className="text-gray-500 mb-4">您还没有创建任何课程，点击"创建新课程"开始吧</p>
          <Button onClick={handleCreateNewCourse} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 mr-2" /> 
            创建新课程
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseSelection;
