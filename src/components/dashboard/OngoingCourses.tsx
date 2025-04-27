import React from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">正在学习</h2>
        <Link to="/learning" className="text-connect-blue hover:underline text-sm flex items-center gap-1">
          查看全部 <ArrowRight size={16} />
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
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">{course.title}</CardTitle>
                  <BookOpen className="h-5 w-5 text-connect-blue" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">进度</span>
                    <span className="text-sm text-muted-foreground">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
                <Link to={`/course/${course.id}`}>
                  <Button className="w-full">继续学习</Button>
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 col-span-full">
            <p className="text-gray-500 mb-4">您还没有加入任何课程</p>
            <Link to="/explore-courses">
              <Button>浏览课程</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default OngoingCourses; 