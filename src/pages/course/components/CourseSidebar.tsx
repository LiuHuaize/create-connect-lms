import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle, Loader2, BookOpen, GraduationCap, ChevronRight, Star, Award, Medal } from 'lucide-react';
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
      <div className="py-2 h-full overflow-y-auto flex flex-col items-center bg-muted rounded-r-xl">
        {/* 整体课程进度指示器 */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/10 text-primary mb-4 relative shadow-md animate-pulse-slow">
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
          <span className="text-sm font-bold z-10">{progress}%</span>
        </div>
        
        {/* 模块指示点 */}
        {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
          const totalLessons = module.lessons?.length || 0;
          const completedLessons = module.lessons?.filter(lesson => completionStatus[lesson.id]).length || 0;
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
                  ? `${bg} ${text}` 
                  : "bg-muted text-muted-foreground"
              )}
              title={`${module.title} - 完成度: ${moduleProgress}%`}
            >
              <div className="absolute inset-0 rounded-full">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={currentModuleHasActiveLesson ? "currentColor" : "#7C8495"}
                    strokeOpacity="0.2"
                    strokeWidth="8" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" 
                    stroke={moduleProgress === 100 ? "var(--primary)" : currentModuleHasActiveLesson ? "currentColor" : "var(--muted-foreground)"}
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
    <div className="py-3 h-full overflow-y-auto bg-background rounded-r-xl custom-scrollbar">
      {/* 课程总体进度 */}
      <div className="mx-4 mb-6 p-4 bg-card rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-foreground">学习进度</h3>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {progress}%
          </Badge>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full progress-bar transition-all duration-500 ease-out"
            style={{ 
              width: `${progress}%`,
            }}
          ></div>
        </div>
      </div>
      
      {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
        // 计算模块完成进度
        const totalLessons = module.lessons?.length || 0;
        const completedLessons = module.lessons?.filter(lesson => completionStatus[lesson.id]).length || 0;
        const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // 为不同模块分配不同的颜色
        const moduleColors = [
          { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30', icon: <GraduationCap size={18} /> },
          { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/30', icon: <BookOpen size={18} /> },
          { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/30', icon: <Award size={18} /> },
          { bg: 'bg-secondary/20', text: 'text-secondary-foreground', border: 'border-secondary/30', icon: <Medal size={18} /> },
          { bg: 'bg-primary/20', text: 'text-primary-foreground', border: 'border-primary/30', icon: <Star size={18} /> },
        ];
        
        const colorIndex = moduleIndex % moduleColors.length;
        const { bg, text, border, icon } = moduleColors[colorIndex];
        
        return (
          <div key={module.id} className="mb-5 hover-card mx-2 bg-card rounded-xl shadow-sm overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${bg} border-b ${border}`}>
              <div className="flex items-center space-x-2">
                <div className={`${text} ${bg} w-8 h-8 rounded-lg flex items-center justify-center shadow-sm`}>
                  {icon}
                </div>
                <h3 className={`text-sm font-semibold ${text}`}>
                  {moduleIndex + 1}. {module.title}
                </h3>
              </div>
              
              <Badge variant="outline" className={`text-xs ${bg} ${text} ${border}`}>
                {completedLessons}/{totalLessons}
              </Badge>
            </div>
            
            {/* 模块进度条 */}
            <div className="px-4 py-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out`}
                  style={{ 
                    width: `${moduleProgress}%`,
                    backgroundColor: moduleProgress === 100 ? 'var(--primary)' : 
                                    colorIndex === 0 ? 'var(--primary)' : 
                                    colorIndex === 1 ? 'var(--secondary)' : 
                                    colorIndex === 2 ? 'var(--accent)' : 
                                    colorIndex === 3 ? 'var(--secondary)' : 'var(--primary)'
                  }}
                ></div>
              </div>
            </div>
            
            {module.lessons && module.lessons.length > 0 ? (
              <ul className="mt-1 pb-2">
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
                        className={`flex items-center px-4 py-3 hover:bg-muted/30 transition-all rounded-lg mx-2 ${
                          isActive ? `${bg} ${text}` : 'text-foreground'
                        }`}
                        onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isLoadingStatus ? 'text-muted-foreground bg-muted' :
                            isCompleted ? 'text-white bg-accent shadow-sm' : 
                            isActive ? `${text} ${bg} shadow-sm` : 
                            'border-2 border-muted'
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
                          <span className="text-sm">{lesson.title}</span>
                        </div>
                        
                        <div className="flex-shrink-0 ml-2">
                          {isCompleted ? (
                            <CheckCircle size={16} className="text-accent" />
                          ) : (
                            <ChevronRight size={16} className="text-muted-foreground" />
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
