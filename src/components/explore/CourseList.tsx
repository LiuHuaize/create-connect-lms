
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Users, Award, BookOpen } from 'lucide-react';
import { Course } from '@/types/course';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CourseListProps {
  courses: Course[];
  onEnroll: (courseId: string) => void;
  loadingEnrollment?: boolean;
}

const CourseList: React.FC<CourseListProps> = ({ courses, onEnroll, loadingEnrollment = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 group">
          <div className="h-48 overflow-hidden bg-gradient-to-r from-gray-100 to-gray-200 relative">
            {course.cover_image ? (
              <img 
                src={course.cover_image} 
                alt={course.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen size={40} className="text-gray-300" />
              </div>
            )}
            
            {/* 免费标签 */}
            <div className="absolute top-4 left-4">
              <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                {course.price && course.price > 0 ? `¥${course.price}` : '免费课程'}
              </span>
            </div>
            
            {/* 评分 */}
            <div className="absolute top-4 right-4">
              <div className="flex items-center bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full border border-gray-100">
                <Award size={14} className="text-yellow-500 mr-1.5" />
                <span className="text-xs font-medium text-gray-700">4.8</span>
              </div>
            </div>
          </div>
          
          <CardContent className="p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{course.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {course.short_description || course.description || '暂无课程描述'}
            </p>
            
            <div className="flex flex-wrap items-center text-xs text-gray-600 gap-4">
              <div className="flex items-center">
                <Clock size={14} className="mr-1.5 text-gray-500" />
                <span>10 小时</span>
              </div>
              
              <div className="flex items-center">
                <Users size={14} className="mr-1.5 text-gray-500" />
                <span>已有 {Math.floor(Math.random() * 100) + 73} 人加入</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-5 py-4 pt-2 border-t border-gray-100">
            <Button 
              onClick={() => onEnroll(course.id)}
              variant="default"
              disabled={loadingEnrollment}
              className={cn(
                "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 h-11 rounded-full",
                "transition-all duration-200 font-medium tracking-wide"
              )}
            >
              {loadingEnrollment ? '加入中...' : '加入课程'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CourseList;
