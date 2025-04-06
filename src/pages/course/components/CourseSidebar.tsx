import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle } from 'lucide-react';
import { courseService } from '@/services/courseService';

interface CourseSidebarProps {
  courseData: Course & { modules?: CourseModule[] };
  selectedLesson: any;
  progress: number;
  setSidebarOpen?: (open: boolean) => void;
  isMobile?: boolean;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courseData,
  selectedLesson,
  progress,
  setSidebarOpen,
  isMobile
}) => {
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  
  // 获取课时完成状态
  useEffect(() => {
    if (courseData?.id) {
      courseService.getLessonCompletionStatus(courseData.id)
        .then(status => {
          setCompletionStatus(status);
        })
        .catch(error => {
          console.error('获取课时完成状态失败:', error);
        });
    }
  }, [courseData?.id, selectedLesson?.id]);
  
  return (
    <div className="py-2 h-full overflow-y-auto">
      {courseData?.modules && courseData.modules.map((module, moduleIndex) => (
        <div key={module.id} className="mb-5">
          <div className="px-4 py-2 text-sm font-semibold text-gray-700">
            {moduleIndex + 1}. {module.title}
          </div>
          
          {module.lessons && module.lessons.length > 0 ? (
            <ul className="mt-1">
              {module.lessons.map((lesson) => {
                // 使用从服务器获取的完成状态
                const isCompleted = completionStatus[lesson.id] || false;
                const isActive = selectedLesson && selectedLesson.id === lesson.id;
                
                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/course/${courseData.id}/lesson/${lesson.id}`}
                      className={`flex items-center px-4 py-3 hover:bg-gray-50 transition-colors ${
                        isActive ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted ? 'text-green-500' : 
                          isActive ? 'text-blue-500 bg-blue-50 border-2 border-blue-500' : 
                          'border-2 border-gray-200'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={16} />
                          ) : isActive ? (
                            <span className="text-xs">•</span>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-800 truncate">
                          {lesson.title}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-2 text-gray-500">
                        <ContentTypeIcon type={lesson.type} size={14} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 px-4 py-2">此模块暂无课时内容</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default CourseSidebar;
