import React from 'react';
import { Award, GraduationCap, Book } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCategoryDisplayName } from '@/types/course-enrollment';

interface Course {
  id: string;
  title: string;
  progress: number;
  category?: string;
  short_description?: string;
  isAvailable?: boolean;
  grade_range_min?: number | null;
  grade_range_max?: number | null;
  primary_subject?: string | null;
  secondary_subject?: string | null;
}

interface CompletedCoursesProps {
  courses: Course[];
  loading: boolean;
}

const CompletedCourses: React.FC<CompletedCoursesProps> = ({ courses, loading }) => {
  // 仅显示可用课程
  const availableCourses = courses.filter(course => course.isAvailable !== false);
  
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">正在加载课程...</p>
        </div>
      ) : availableCourses.length > 0 ? (
        // 显示已完成的课程
        availableCourses.map((course) => (
          <div key={course.id} className="course-card p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:justify-between">
              <div>
                <div className="flex items-center mb-3">
                  <div className="bg-ghibli-lightTeal text-ghibli-deepTeal inline-block px-3 py-1 rounded-full text-xs font-medium mr-3">
                    {getCategoryDisplayName(course.category)}
                  </div>
                  <div className="flex items-center text-amber-500">
                    <Award size={16} className="mr-1" />
                    <span className="text-xs font-medium">已完成</span>
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-3">{course.short_description || '暂无描述'}</p>
                
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center text-gray-500">
                    <GraduationCap size={16} className="mr-1" />
                    <span className="text-sm">
                      {course.grade_range_min && course.grade_range_max 
                        ? `适用${course.grade_range_min}-${course.grade_range_max}年级` 
                        : course.grade_range_min 
                        ? `适用${course.grade_range_min}年级及以上` 
                        : course.grade_range_max 
                        ? `适用${course.grade_range_max}年级及以下` 
                        : '适用所有年级'}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Book size={16} className="mr-1" />
                    <span className="text-sm">
                      {course.primary_subject || '未指定学科'}
                      {course.secondary_subject ? ` + ${course.secondary_subject}` : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                <Link to={`/course/${course.id}`}>
                  <button className="py-2 px-4 border border-ghibli-teal/50 text-ghibli-deepTeal rounded-lg hover:bg-ghibli-lightTeal/30 transition-colors text-sm">
                    回顾
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 mb-4">您还没有完成任何课程</p>
          <Button asChild>
            <Link to="/explore-courses">浏览课程</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompletedCourses; 