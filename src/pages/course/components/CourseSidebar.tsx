
import React from 'react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { Check, Circle } from 'lucide-react';

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
    <div className="w-full h-full bg-white overflow-y-auto pb-10">
      <div className="p-4">
        <div className="mb-6 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700">课程进度</span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="space-y-3">
          {courseData?.modules && courseData.modules.map((module) => (
            <Card key={module.id} className="border border-gray-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-2.5 px-3">
                <CardTitle className="text-sm font-medium text-gray-800">{module.title}</CardTitle>
              </CardHeader>
              
              <CardContent className="p-0">
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {module.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${courseData.id}/lesson/${lesson.id}`}
                          className={`flex items-center px-3 py-2.5 hover:bg-blue-50 transition-colors ${
                            selectedLesson && selectedLesson.id === lesson.id ? 'bg-blue-50 border-l-3 border-blue-500' : ''
                          }`}
                          onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                        >
                          <div className="flex-shrink-0 mr-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              lesson.completed ? 'bg-green-100 text-green-600' : 
                              selectedLesson && selectedLesson.id === lesson.id ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200'
                            }`}>
                              {lesson.completed ? (
                                <Check className="h-3 w-3" />
                              ) : selectedLesson && selectedLesson.id === lesson.id ? (
                                <Circle className="h-1.5 w-1.5 fill-blue-500" />
                              ) : null}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center text-sm">
                              <ContentTypeIcon type={lesson.type} />
                              <span className="truncate text-sm">{lesson.title}</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-center text-gray-500 text-xs">
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
