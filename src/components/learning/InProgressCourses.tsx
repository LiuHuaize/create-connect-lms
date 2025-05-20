import React from 'react';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, GraduationCap, Book, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getCategoryDisplayName } from '@/types/course-enrollment';

interface Course {
  id: string;
  title: string;
  progress: number;
  category?: string;
  short_description?: string;
  enrolledAt?: string;
  isAvailable?: boolean;
  grade_range_min?: number | null;
  grade_range_max?: number | null;
  primary_subject?: string | null;
  secondary_subject?: string | null;
}

interface InProgressCoursesProps {
  courses: Course[];
  loading: boolean;
}

const InProgressCourses: React.FC<InProgressCoursesProps> = ({ courses, loading }) => {
  // 仅显示可用课程
  const availableCourses = courses.filter(course => course.isAvailable !== false);
  const navigate = useNavigate();
  
  // 跳转到课程详情页
  const handleViewCourse = (courseId: string) => {
    navigate(`/course/${courseId}/details`);
  };
  
  // 继续学习
  const handleContinueLearning = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    navigate(`/course/${courseId}`);
  };
  
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">正在加载课程...</p>
        </div>
      ) : availableCourses.length > 0 ? (
        // 显示用户已加入的课程
        availableCourses.map((course) => (
          <div 
            key={course.id} 
            className="course-card bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => handleViewCourse(course.id)}
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-ghibli-lightTeal text-ghibli-deepTeal inline-block px-3 py-1 rounded-full text-xs font-medium">
                      {getCategoryDisplayName(course.category)}
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.short_description || '暂无描述'}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-4">
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
              </div>
              
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">进度</span>
                  <span className="text-sm text-gray-500">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2 progress-kids" />
              </div>
            </div>
            
            <div className="border-t border-ghibli-sand bg-ghibli-parchment p-4 rounded-b-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">查看课程</h4>
                  <p className="text-sm text-gray-500">{course.title}</p>
                </div>
                
                <Button 
                  className="event-view-details-btn"
                  onClick={(e) => handleContinueLearning(e, course.id)}
                  variant="default"
                >
                  <Play size={16} className="mr-2" />
                  继续学习
                </Button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-500 mb-4">您还没有加入任何课程</p>
          <Button asChild>
            <Link to="/explore-courses">浏览课程</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default InProgressCourses; 