import React from 'react';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { getCategoryDisplayName } from '@/utils/courseUtils';

interface Course {
  id: string;
  title: string;
  progress: number;
  category?: string;
  short_description?: string;
  enrolledAt?: string;
  isAvailable?: boolean;
}

interface InProgressCoursesProps {
  courses: Course[];
  loading: boolean;
}

const InProgressCourses: React.FC<InProgressCoursesProps> = ({ courses, loading }) => {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">正在加载课程...</p>
        </div>
      ) : courses.length > 0 ? (
        // 显示用户已加入的课程
        courses.map((course) => (
          <div key={course.id} className="course-card">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-ghibli-lightTeal text-ghibli-deepTeal inline-block px-3 py-1 rounded-full text-xs font-medium">
                      {getCategoryDisplayName(course.category)}
                    </div>
                    
                    {course.isAvailable === false && (
                      <div className="bg-amber-100 text-amber-700 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium">
                        <AlertCircle size={12} className="mr-1" /> 课程暂不可用
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.short_description || '暂无描述'}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
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
                  </div>
                </div>
                
                {course.isAvailable !== false ? (
                  <Link to={`/course/${course.id}`}>
                    <button className="bg-ghibli-teal text-white p-3 rounded-full hover:bg-ghibli-deepTeal transition-colors">
                      <Play size={20} fill="white" />
                    </button>
                  </Link>
                ) : (
                  <button disabled className="bg-gray-300 text-white p-3 rounded-full cursor-not-allowed opacity-50">
                    <Play size={20} fill="white" />
                  </button>
                )}
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
                  <h4 className="font-medium">继续学习</h4>
                  <p className="text-sm text-gray-500">{course.title}</p>
                </div>
                
                {course.isAvailable !== false ? (
                  <Link to={`/course/${course.id}`}>
                    <button className="event-register-btn">
                      继续
                    </button>
                  </Link>
                ) : (
                  <div className="py-2 px-4 text-gray-500 text-sm">
                    教师已暂时取消此课程的发布
                  </div>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
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