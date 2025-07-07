import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle, Loader2, BookOpen, GraduationCap, ChevronRight, Star, Award, Medal } from 'lucide-react';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CourseSidebarProps {
  courseData: Course & { modules?: CourseModule[] };
  selectedLesson: any;
  progress: number;
  setSidebarOpen?: (open: boolean) => void;
  isMobile?: boolean;
  collapsed?: boolean;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({
  courseData,
  selectedLesson,
  progress,
  setSidebarOpen,
  isMobile,
  collapsed = false
}) => {
  // 使用新的课程完成状态Hook作为备份
  const { 
    completionStatus, 
    isLoading: isLoadingStatus 
  } = useCourseCompletion({
    courseId: courseData?.id,
    autoLoad: true,
    forceCleanup: false
  });
  
  // 折叠状态下的简化渲染
  if (collapsed) {
    return (
      <div className="py-2 h-full overflow-y-auto flex flex-col items-center bg-white rounded-r-xl">
        {/* 整体课程进度指示器 */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500 text-white mb-4 relative shadow-sm">
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="currentColor" 
                strokeOpacity="0.1"
                strokeWidth="8" 
              />
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="8" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * progress / 100)}
                transform="rotate(-90 50 50)" 
              />
            </svg>
          </div>
          <span className="text-sm font-bold z-10">{progress}%</span>
        </div>
        
        {/* 模块指示点 */}
        {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
          const totalLessons = module.lessons?.length || 0;
          const completedLessons = module.lessons?.filter(lesson => lesson.isCompleted || completionStatus[lesson.id]).length || 0;
          const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          const currentModuleHasActiveLesson = module.lessons?.some(
            lesson => selectedLesson && selectedLesson.id === lesson.id
          );
          
          // 为不同模块分配不同的颜色
          const moduleColors = [
            { bg: 'bg-primary/10', text: 'text-primary' },
            { bg: 'bg-secondary/10', text: 'text-secondary' },
            { bg: 'bg-accent/10', text: 'text-accent' },
            { bg: 'bg-secondary/20', text: 'text-secondary-foreground' },
            { bg: 'bg-primary/20', text: 'text-primary-foreground' },
          ];
          
          const colorIndex = moduleIndex % moduleColors.length;
          const { bg, text } = moduleColors[colorIndex];
          
          return (
            <div 
              key={module.id} 
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center my-2 relative shadow-md hover:scale-110 transition-transform duration-200", 
currentModuleHasActiveLesson 
                  ? 'bg-blue-50 text-blue-600' 
                  : "bg-gray-100 text-gray-500"
              )}
              title={`${module.title} - 完成度: ${moduleProgress}%`}
            >
              <div className="absolute inset-0 rounded-full">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={currentModuleHasActiveLesson ? "currentColor" : "#7C8495"}
                    strokeOpacity="0.1"
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={moduleProgress === 100 ? "#10b981" : currentModuleHasActiveLesson ? "#3b82f6" : "#9ca3af"}
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * moduleProgress / 100)}
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
              </div>
              <span className="text-sm font-bold z-10">{moduleIndex + 1}</span>
            </div>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="py-3 h-full overflow-y-auto bg-gray-50">
      {/* 课程总体进度 */}
      <div className="mx-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">学习进度</h3>
          <Badge className="bg-blue-500 text-white border-0">
            {progress}%
          </Badge>
        </div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ 
              width: `${progress}%`,
            }}
          ></div>
        </div>
      </div>
      
      {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
        // 计算模块完成进度
        const totalLessons = module.lessons?.length || 0;
        const completedLessons = module.lessons?.filter(lesson => lesson.isCompleted || completionStatus[lesson.id]).length || 0;
        const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // 统一的图标设计
        const moduleIcons = [
          <GraduationCap size={18} />,
          <BookOpen size={18} />,
          <Award size={18} />,
          <Medal size={18} />,
          <Star size={18} />,
        ];
        
        const icon = moduleIcons[moduleIndex % moduleIcons.length];
        
        return (
          <div key={module.id} className="mb-4 mx-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm bg-blue-500 text-white">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  {moduleIndex + 1}. {module.title}
                </h3>
              </div>
              
              <Badge variant="outline" className="text-xs bg-white text-gray-500 border-gray-200">
                {completedLessons}/{totalLessons}
              </Badge>
            </div>
            
            {/* 模块进度条 */}
            <div className="px-4 py-2 bg-white">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm`}
                  style={{ 
                    width: `${moduleProgress}%`,
                    backgroundColor: moduleProgress === 100 ? '#10b981' : '#3b82f6'
                  }}
                ></div>
              </div>
            </div>
            
            {module.lessons && module.lessons.length > 0 ? (
              <ul className="mt-1 pb-2 space-y-1">
                {module.lessons
                  .slice() // 创建数组副本，避免修改原数组
                  .sort((a, b) => a.order_index - b.order_index) // 按照order_index排序
                  .map((lesson) => {
                  // 使用从服务器获取的完成状态
                  const isCompleted = lesson.isCompleted || completionStatus[lesson.id] || false;
                  const isActive = selectedLesson && selectedLesson.id === lesson.id;
                  
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/course/${courseData.id}/lesson/${lesson.id}`}
                        className={`group flex items-center px-4 py-3 hover:bg-gray-100 transition-all rounded-lg mx-2 ${
                          isActive ? 'bg-blue-50 border-l-4 border-blue-500 -mx-0.5' : ''
                        }`}
                        onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isLoadingStatus ? 'bg-gray-200' :
                            isCompleted ? 'bg-green-500 text-white shadow-md' : 
                            isActive ? 'bg-blue-500 text-white shadow-md' : 
                            'border-2 border-gray-300 group-hover:border-gray-400'
                          }`}>
                            {isLoadingStatus ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle size={14} />
                            ) : isActive ? (
                              <span className="text-xs">•</span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium ${
                            isActive ? 'text-gray-900' : 
                            isCompleted ? 'text-gray-700' : 'text-gray-600'
                          } group-hover:text-gray-900`}>{lesson.title}</span>
                        </div>
                        
                        <div className="flex-shrink-0 ml-2">
                          {isCompleted ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">该模块暂无课时</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
