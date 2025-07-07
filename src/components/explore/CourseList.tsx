import React from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Book, Award, Info } from 'lucide-react';
import { Course } from '@/types/course';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface CourseListProps {
  courses: Course[];
  onEnroll: (courseId: string) => void;
  loadingEnrollment?: boolean;
}


const CourseList: React.FC<CourseListProps> = ({ courses, onEnroll, loadingEnrollment = false }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = (courseId: string) => {
    navigate(`/course/${courseId}/details`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {courses.map((course, index) => {
        return (
          <Card 
            key={course.id} 
            className="overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group relative cursor-pointer bg-white"
            onClick={() => handleViewDetails(course.id!)}
          >
            {/* 顶部蓝色边框 */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            
            <div 
              className="h-32 bg-gradient-to-r from-blue-50 to-blue-100 bg-cover bg-center relative" 
              style={{ 
                backgroundImage: course.cover_image 
                  ? `url(${course.cover_image})` 
                  : 'none'
              }}
            >
              {!course.cover_image && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Book size={32} className="text-blue-300" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent"></div>
              
              {course.category && (
                <div className="absolute top-3 left-3">
                  <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                    {course.category}
                  </span>
                </div>
              )}
              
              <div className="absolute top-3 right-3">
                <div className="flex items-center bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full border border-blue-100 shadow-sm">
                  <Award size={12} className="text-amber-500 mr-1" />
                  <span className="text-xs font-medium text-gray-700">4.8</span>
                </div>
              </div>
              
              {/* 查看详情按钮 - 悬浮在图片上 */}
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(course.id!);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-7 shadow-md"
                >
                  <Info size={12} className="mr-1" />
                  查看详情
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">{course.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                {course.short_description || course.description || '暂无课程描述'}
              </p>
              
              <div className="flex flex-col gap-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <GraduationCap size={12} className="mr-1.5 text-blue-500" />
                  <span className="truncate">
                    {course.grade_range_min && course.grade_range_max 
                      ? `适用${course.grade_range_min}-${course.grade_range_max}年级` 
                      : course.grade_range_min 
                      ? `适用${course.grade_range_min}年级及以上` 
                      : course.grade_range_max 
                      ? `适用${course.grade_range_max}年级及以下` 
                      : '适用所有年级'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Book size={12} className="mr-1.5 text-blue-500" />
                  <span className="truncate">
                    {course.primary_subject || '未指定学科'}
                    {course.secondary_subject ? ` + ${course.secondary_subject}` : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseList;
