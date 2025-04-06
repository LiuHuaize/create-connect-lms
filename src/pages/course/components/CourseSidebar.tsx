import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle } from 'lucide-react';

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
  isMobile = false
}) => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="p-4">
        <div className="space-y-4">
          {courseData?.modules && courseData.modules.map((module, moduleIndex) => (
            <div key={module.id} className="mb-5">
              <div className="text-sm font-medium text-gray-500 mb-2 px-2">
                模块 {moduleIndex + 1}: {module.title}
              </div>
              
              {module.lessons && module.lessons.length > 0 ? (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <ul className="divide-y divide-gray-100">
                    {module.lessons.map((lesson) => {
                      // 判断课程是否已完成（这里是一个占位逻辑，实际应该根据你的后端数据判断）
                      const isCompleted = false; // 替换为实际的完成状态逻辑
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
                              <div className="flex items-center gap-1.5">
                                <ContentTypeIcon type={lesson.type} />
                                <span className={`text-sm truncate ${isActive ? 'font-medium' : ''}`}>
                                  {lesson.title}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <Card className="bg-gray-50 border-dashed">
                  <CardContent className="p-4 text-center text-gray-500 text-sm">
                    此模块暂无课时内容
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
          
          {(!courseData?.modules || courseData.modules.length === 0) && (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="p-6 text-center text-gray-500 text-sm">
                此课程暂无模块内容
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSidebar;
