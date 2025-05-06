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

// 定义一组渐变颜色用于课程卡片
const CARD_COLORS = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-400',
  'from-teal-500 to-green-400',
  'from-orange-500 to-amber-400',
  'from-red-500 to-rose-400',
  'from-indigo-500 to-violet-400',
  'from-fuchsia-500 to-pink-400',
  'from-emerald-500 to-lime-400',
];

const CourseList: React.FC<CourseListProps> = ({ courses, onEnroll, loadingEnrollment = false }) => {
  const navigate = useNavigate();
  
  const handleViewDetails = (courseId: string) => {
    navigate(`/course/${courseId}/details`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {courses.map((course, index) => {
        // 根据课程索引或ID选择颜色
        const colorIndex = course.id ? (parseInt(course.id.substring(0, 8), 16) % CARD_COLORS.length) : (index % CARD_COLORS.length);
        const colorClass = CARD_COLORS[colorIndex];
        
        return (
          <Card 
            key={course.id} 
            className="overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 group relative cursor-pointer"
            onClick={() => handleViewDetails(course.id!)}
          >
            {/* 顶部彩色边框 */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colorClass}`}></div>
            
            <div 
              className="h-48 bg-gradient-to-r from-gray-100 to-gray-200 bg-cover bg-center relative" 
              style={{ 
                backgroundImage: course.cover_image 
                  ? `url(${course.cover_image})` 
                  : 'none'
              }}
            >
              {!course.cover_image && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Book size={40} className="text-gray-300" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent"></div>
              
              {course.category && (
                <div className="absolute top-4 left-4">
                  <span className={`bg-white/90 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full font-medium border border-gray-100 shadow-sm`}>
                    {course.category}
                  </span>
                </div>
              )}
              
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
                  <GraduationCap size={14} className="mr-1.5 text-gray-500" />
                  <span>
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
                  <Book size={14} className="mr-1.5 text-gray-500" />
                  <span>
                    {course.primary_subject || '未指定学科'}
                    {course.secondary_subject ? ` + ${course.secondary_subject}` : ''}
                  </span>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-5 pt-0 flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails(course.id!);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Info size={16} className="mr-1.5" />
                查看详情
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseList;
