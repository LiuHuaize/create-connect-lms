
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, ExternalLink } from 'lucide-react';
import { courseService } from '@/services/courseService';
import { useAuth } from '@/contexts/AuthContext';
import { Course } from '@/types/course';
import { toast } from 'sonner';

const CourseSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">我的课程</h1>
        <p className="text-gray-500">选择一个课程继续编辑或创建新课程</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 创建新课程卡片 */}
        <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 bg-white/50 hover:bg-white transition-all">
          <CardContent className="pt-6 flex flex-col items-center justify-center h-64">
            <PlusCircle className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">创建新课程</h3>
            <p className="text-gray-500 text-center mt-2">从零开始设计一个全新课程</p>
          </CardContent>
          <CardFooter className="justify-center pb-6">
            <Button onClick={handleCreateNewCourse}>开始创建</Button>
          </CardFooter>
        </Card>

        {/* 现有课程卡片列表 */}
        {isLoading ? (
          <Card className="border border-gray-200 bg-white/50">
            <CardContent className="pt-6 flex items-center justify-center h-64">
              <p className="text-gray-500">加载中...</p>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="border border-gray-200 bg-white overflow-hidden">
              <div 
                className="h-32 bg-gray-100 bg-cover bg-center" 
                style={{ 
                  backgroundImage: course.cover_image 
                    ? `url(${course.cover_image})` 
                    : 'url(/placeholder.svg)' 
                }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-gray-500 line-clamp-2">
                  {course.short_description || '暂无描述'}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    course.status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {course.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditCourse(course.id!)}
                >
                  <Edit className="h-4 w-4 mr-1" /> 编辑
                </Button>
                {course.status === 'published' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleViewCourse(course.id!)}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" /> 查看
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseSelection;
