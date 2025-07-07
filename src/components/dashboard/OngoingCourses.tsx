import React from 'react';
import { BookOpen, ArrowRight, Eye, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Course {
  id: string;
  title: string;
  progress: number;
  category?: string;
  shortDescription?: string;
}

interface OngoingCoursesProps {
  ongoingCourses: Course[];
  loadingEnrolled: boolean;
}

const OngoingCourses: React.FC<OngoingCoursesProps> = ({ 
  ongoingCourses, 
  loadingEnrolled 
}) => {
  const navigate = useNavigate();
  
  const handleViewDetails = (courseId: string) => {
    navigate(`/course/${courseId}/details`);
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">正在学习</h2>
        <Link to="/learning" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
          查看全部 <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingEnrolled ? (
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500">正在加载课程...</p>
          </div>
        ) : ongoingCourses.length > 0 ? (
          // 显示用户正在学习的课程
          ongoingCourses.map((course) => (
            <Card 
              key={course.id} 
              className="group cursor-pointer"
              onClick={() => handleViewDetails(course.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold line-clamp-2 text-foreground">{course.title}</CardTitle>
                  <div className="p-2.5 bg-secondary rounded-xl">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">进度</span>
                    <span className="text-sm font-semibold text-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-3" />
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(course.id);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    详情
                  </Button>
                  <Link 
                    to={`/course/${course.id}`} 
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button size="sm" className="w-full">
                      <Play className="h-4 w-4 mr-1.5" />
                      继续学习
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 col-span-full bg-gray-50 rounded-xl">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">您还没有加入任何课程</p>
            <Link to="/explore-courses">
              <Button className="bg-primary hover:bg-primary/90">浏览课程</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingCourses; 