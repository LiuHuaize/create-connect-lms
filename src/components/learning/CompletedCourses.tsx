import React from 'react';
import { Award, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { getCategoryDisplayName } from '@/utils/courseUtils';

interface Course {
  id: string;
  title: string;
  progress: number;
  category?: string;
  short_description?: string;
  isAvailable?: boolean;
}

interface CompletedCoursesProps {
  courses: Course[];
  loading: boolean;
}

const CompletedCourses: React.FC<CompletedCoursesProps> = ({ courses, loading }) => {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">正在加载课程...</p>
        </div>
      ) : courses.length > 0 ? (
        // 显示已完成的课程
        courses.map((course) => (
          <div key={course.id} className="course-card p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-3">
                  <div className="bg-ghibli-lightTeal text-ghibli-deepTeal inline-block px-3 py-1 rounded-full text-xs font-medium mr-3">
                    {getCategoryDisplayName(course.category)}
                  </div>
                  <div className="flex items-center text-amber-500">
                    <Award size={16} className="mr-1" />
                    <span className="text-xs font-medium">已完成</span>
                  </div>
                  
                  {course.isAvailable === false && (
                    <div className="ml-3 bg-amber-100 text-amber-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                      <AlertCircle size={12} className="mr-1" /> 课程暂不可用
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                <p className="text-gray-600">{course.short_description || '暂无描述'}</p>
              </div>
              
              <div className="flex items-center gap-3">
                {course.isAvailable !== false ? (
                  <Link to={`/course/${course.id}`}>
                    <button className="py-2 px-4 border border-ghibli-teal/50 text-ghibli-deepTeal rounded-lg hover:bg-ghibli-lightTeal/30 transition-colors text-sm">
                      回顾
                    </button>
                  </Link>
                ) : (
                  <button disabled className="py-2 px-4 border border-gray-300 text-gray-400 rounded-lg cursor-not-allowed opacity-50 text-sm">
                    暂不可用
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
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