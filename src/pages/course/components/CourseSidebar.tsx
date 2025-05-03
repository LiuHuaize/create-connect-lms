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
      <div className="py-2 h-full overflow-y-auto flex flex-col items-center bg-macaron-cream rounded-r-xl">
        {/* 整体课程进度指示器 */}
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-macaron-mint text-macaron-deepMint mb-4 relative shadow-md animate-pulse-slow">
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
            { bg: 'bg-macaron-mint', text: 'text-macaron-deepMint' },
            { bg: 'bg-macaron-blue', text: 'text-macaron-darkGray' },
            { bg: 'bg-macaron-lavender', text: 'text-macaron-deepLavender' },
            { bg: 'bg-macaron-yellow', text: 'text-macaron-darkGray' },
            { bg: 'bg-macaron-blue', text: 'text-macaron-darkGray' },
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
                  : "bg-macaron-lightGray text-macaron-darkGray"
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
                    stroke={moduleProgress === 100 ? "#2A7D65" : currentModuleHasActiveLesson ? "currentColor" : "#7C8495"}
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
    <div className="py-3 h-full overflow-y-auto bg-macaron-cream rounded-r-xl custom-scrollbar">
      {/* 课程总体进度 */}
      <div className="mx-4 mb-6 p-4 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-macaron-darkGray">学习进度</h3>
          <Badge variant="outline" className="bg-macaron-mint/20 text-macaron-deepMint border-macaron-mint">
            {progress}%
          </Badge>
        </div>
        <div className="h-3 w-full bg-macaron-lightGray rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(90deg, #D0F5EA, #2A7D65)`,
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
          { bg: 'bg-macaron-mint/20', text: 'text-macaron-deepMint', border: 'border-macaron-mint/50', icon: <GraduationCap size={18} /> },
          { bg: 'bg-macaron-blue/20', text: 'text-macaron-darkGray', border: 'border-macaron-blue/50', icon: <BookOpen size={18} /> },
          { bg: 'bg-macaron-lavender/20', text: 'text-macaron-deepLavender', border: 'border-macaron-lavender/50', icon: <Award size={18} /> },
          { bg: 'bg-macaron-yellow/20', text: 'text-macaron-darkGray', border: 'border-macaron-yellow/50', icon: <Medal size={18} /> },
          { bg: 'bg-macaron-blue/20', text: 'text-macaron-darkGray', border: 'border-macaron-blue/50', icon: <Star size={18} /> },
        ];
        
        const colorIndex = moduleIndex % moduleColors.length;
        const { bg, text, border, icon } = moduleColors[colorIndex];
        
        return (
          <div key={module.id} className="mb-5 hover-card mx-2 bg-white rounded-xl shadow-sm overflow-hidden">
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
              <div className="h-2 w-full bg-macaron-lightGray rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out`}
                  style={{ 
                    width: `${moduleProgress}%`,
                    backgroundColor: moduleProgress === 100 ? '#2A7D65' : 
                                     colorIndex === 0 ? '#2A7D65' : 
                                     colorIndex === 1 ? '#3B82F6' : 
                                     colorIndex === 2 ? '#6933B0' : 
                                     colorIndex === 3 ? '#FFC107' : '#3B82F6'
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
                        className={`flex items-center px-4 py-3 hover:bg-macaron-lightGray/30 transition-all rounded-lg mx-2 ${
                          isActive ? `${bg} ${text}` : 'text-macaron-darkGray'
                        }`}
                        onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isLoadingStatus ? 'text-macaron-gray bg-macaron-lightGray' :
                            isCompleted ? 'text-white bg-macaron-coral shadow-sm' : 
                            isActive ? `${text} ${bg} shadow-sm` : 
                            'border-2 border-macaron-lightGray'
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
                          <div className={`text-sm truncate ${
                            isActive ? 'font-bold' : ''
                          }`}>
                            {lesson.title}
                          </div>
                          <div className="text-xs text-macaron-gray mt-0.5 flex items-center">
                            <ContentTypeIcon type={lesson.type} size={12} />
                            <span className="ml-1">
                              {lesson.type === 'video' ? '视频' : 
                               lesson.type === 'quiz' ? '测验' : 
                               lesson.type === 'text' ? '阅读' : '内容'}
                            </span>
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <div className="flex-shrink-0 ml-2 text-macaron-coral animate-pulse-slow">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-macaron-gray px-6 py-3 italic">此模块暂无课时内容</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
