
import React from 'react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';

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
    <div className="w-full h-full bg-white overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">课程进度</span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-4">
          {courseData?.modules && courseData.modules.map((module) => (
            <Card key={module.id} className="border border-gray-100 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
                <CardTitle className="text-base font-medium text-gray-800">{module.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${courseData.id}/lesson/${lesson.id}`}
                          className={`flex items-center px-4 py-3 hover:bg-blue-50 transition-colors ${
                            selectedLesson && selectedLesson.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                        >
                          <div className="flex-shrink-0 mr-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                              selectedLesson && selectedLesson.id === lesson.id ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-gray-200'
                            }`}>
                              {selectedLesson && selectedLesson.id === lesson.id && (
                                <span className="text-xs">•</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center text-sm">
                              <ContentTypeIcon type={lesson.type} />
                              <span className="truncate">{lesson.title}</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    此模块暂无课时内容
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {(!courseData?.modules || courseData.modules.length === 0) && (
            <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg text-sm">
              此课程暂无模块内容
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseSidebar;
