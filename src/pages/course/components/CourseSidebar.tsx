import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle, Loader2, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { courseService, lessonCompletionCache } from '@/services/courseService';
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
  const [completionStatus, setCompletionStatus] = useState<Record<string, boolean>>({});
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  
  // 获取课时完成状态
  useEffect(() => {
    if (courseData?.id) {
      setIsLoadingStatus(true);
      
      // 强制从服务器刷新课程完成状态，不使用缓存
      courseService.getLessonCompletionStatus(courseData.id, true)
        .then(status => {
          console.log('获取到课时完成状态:', status);
          setCompletionStatus(status);
          setIsLoadingStatus(false);
        })
        .catch(error => {
          console.error('获取课时完成状态失败:', error);
          setIsLoadingStatus(false);
        });
    }
  }, [courseData?.id, progress]); // 添加progress作为依赖，当进度变化时重新获取完成状态
  
  // 折叠状态下的简化渲染
  if (collapsed) {
    return (
      <div className="py-2 h-full overflow-y-auto flex flex-col items-center">
        {/* 整体课程进度指示器 */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-ghibli-lightTeal/50 text-ghibli-deepTeal mb-2 relative">
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="40" 
                fill="none" 
                stroke="currentColor" 
                strokeOpacity="0.2"
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
          <span className="text-xs font-medium z-10">{progress}%</span>
        </div>
        
        {/* 模块指示点 */}
        {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
          const totalLessons = module.lessons?.length || 0;
          const completedLessons = module.lessons?.filter(lesson => completionStatus[lesson.id]).length || 0;
          const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          
          const currentModuleHasActiveLesson = module.lessons?.some(
            lesson => selectedLesson && selectedLesson.id === lesson.id
          );
          
          return (
            <div 
              key={module.id} 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center my-1 relative", 
                currentModuleHasActiveLesson 
                  ? "bg-ghibli-lightTeal/50 text-ghibli-deepTeal" 
                  : "bg-ghibli-cream text-ghibli-brown"
              )}
              title={`${module.title} - 完成度: ${moduleProgress}%`}
            >
              <div className="absolute inset-0 rounded-full">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={currentModuleHasActiveLesson ? "currentColor" : "#807668"}
                    strokeOpacity="0.2"
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={moduleProgress === 100 ? "#A0D995" : currentModuleHasActiveLesson ? "currentColor" : "#807668"}
                    strokeWidth="8" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * moduleProgress / 100)}
                    transform="rotate(-90 50 50)" 
                  />
                </svg>
              </div>
              <span className="text-xs font-medium z-10">{moduleIndex + 1}</span>
            </div>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="py-2 h-full overflow-y-auto bg-ghibli-parchment">
      {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
        // 计算模块完成进度
        const totalLessons = module.lessons?.length || 0;
        const completedLessons = module.lessons?.filter(lesson => completionStatus[lesson.id]).length || 0;
        const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        return (
          <div key={module.id} className="mb-5">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-ghibli-lightTeal w-8 h-8 rounded-lg flex items-center justify-center text-ghibli-deepTeal">
                  <GraduationCap size={16} />
                </div>
                <h3 className="text-sm font-semibold text-ghibli-deepTeal">
                  {moduleIndex + 1}. {module.title}
                </h3>
              </div>
              
              <Badge variant="outline" className="text-xs bg-ghibli-cream border-ghibli-teal/30 text-ghibli-deepTeal">
                {completedLessons}/{totalLessons}
              </Badge>
            </div>
            
            {/* 模块进度条 */}
            <div className="px-4 mb-2">
              <div className="h-1.5 w-full bg-ghibli-sand rounded-full overflow-hidden">
                <div 
                  className="h-full bg-ghibli-teal rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${moduleProgress}%` }}
                ></div>
              </div>
            </div>
            
            {module.lessons && module.lessons.length > 0 ? (
              <ul className="mt-1">
                {module.lessons
                  .slice() // 创建数组副本，避免修改原数组
                  .sort((a, b) => a.order_index - b.order_index) // 按照order_index排序
                  .map((lesson) => {
                  // 使用从服务器获取的完成状态
                  const isCompleted = completionStatus[lesson.id] || false;
                  const isActive = selectedLesson && selectedLesson.id === lesson.id;
                  
                  return (
                    <li key={lesson.id}>
                      <Link
                        to={`/course/${courseData.id}/lesson/${lesson.id}`}
                        className={`flex items-center px-4 py-3 hover:bg-ghibli-lightTeal/20 transition-all rounded-lg mx-2 ${
                          isActive ? 'bg-ghibli-lightTeal/30 text-ghibli-deepTeal' : 'text-ghibli-brown'
                        }`}
                        onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isLoadingStatus ? 'text-ghibli-teal/50' :
                            isCompleted ? 'text-ghibli-grassGreen bg-ghibli-lightTeal/30' : 
                            isActive ? 'text-ghibli-teal bg-ghibli-lightTeal/20 border-2 border-ghibli-teal' : 
                            'border-2 border-ghibli-sand'
                          }`}>
                            {isLoadingStatus ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : isCompleted ? (
                              <CheckCircle size={16} />
                            ) : isActive ? (
                              <span className="text-xs">•</span>
                            ) : null}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${
                            isActive ? 'font-medium' : ''
                          }`}>
                            {lesson.title}
                          </div>
                          <div className="text-xs text-ghibli-lightBrown mt-0.5 flex items-center">
                            <ContentTypeIcon type={lesson.type} size={12} />
                            <span className="ml-1">
                              {lesson.type === 'video' ? '视频' : 
                               lesson.type === 'quiz' ? '测验' : 
                               lesson.type === 'text' ? '阅读' : '内容'}
                            </span>
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <div className="flex-shrink-0 ml-2 text-ghibli-grassGreen">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-ghibli-lightBrown px-6 py-3 italic">此模块暂无课时内容</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
