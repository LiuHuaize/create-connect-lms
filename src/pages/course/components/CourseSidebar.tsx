import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Course, CourseModule } from '@/types/course';
import ContentTypeIcon from './ContentTypeIcon';
import { CheckCircle, Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { courseService, lessonCompletionCache } from '@/services/courseService';
import { Badge } from '@/components/ui/badge';

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
  
  return (
    <div className="py-2 h-full overflow-y-auto">
      {courseData?.modules && courseData.modules.map((module, moduleIndex) => {
        // 计算模块完成进度
        const totalLessons = module.lessons?.length || 0;
        const completedLessons = module.lessons?.filter(lesson => completionStatus[lesson.id]).length || 0;
        const moduleProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        return (
          <div key={module.id} className="mb-5">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 dark:bg-blue-900/50 w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <GraduationCap size={16} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {moduleIndex + 1}. {module.title}
                </h3>
              </div>
              
              <Badge variant="outline" className="text-xs bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                {completedLessons}/{totalLessons}
              </Badge>
            </div>
            
            {/* 模块进度条 */}
            <div className="px-4 mb-2">
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
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
                        className={`flex items-center px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all rounded-lg mx-2 ${
                          isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                        }`}
                        onClick={() => isMobile && setSidebarOpen && setSidebarOpen(false)}
                      >
                        <div className="flex-shrink-0 mr-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isLoadingStatus ? 'text-blue-300 dark:text-blue-500' :
                            isCompleted ? 'text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 
                            isActive ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' : 
                            'border-2 border-slate-200 dark:border-slate-700'
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
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center">
                            <ContentTypeIcon type={lesson.type} size={12} />
                            <span className="ml-1">
                              {lesson.type === 'video' ? '视频' : 
                               lesson.type === 'quiz' ? '测验' : 
                               lesson.type === 'text' ? '阅读' : '内容'}
                            </span>
                          </div>
                        </div>
                        
                        {isCompleted && (
                          <div className="flex-shrink-0 ml-2 text-green-500 dark:text-green-400">
                            <CheckCircle size={14} />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 px-6 py-3 italic">此模块暂无课时内容</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CourseSidebar;
