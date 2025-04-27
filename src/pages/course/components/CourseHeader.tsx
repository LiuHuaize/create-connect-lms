import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Menu, Clock, Users, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/course';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useCourseData } from '@/pages/course/hooks/useCourseData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CourseHeaderProps {
  courseData: Course;
  isMobile: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ 
  courseData,
  isMobile,
  setSidebarOpen 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshCourseData } = useCourseData(courseData.id);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    try {
      // 创建一个最小延迟的Promise，确保加载UI至少显示1.5秒
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      // 同时执行数据刷新和最小加载时间
      await Promise.all([
        refreshCourseData(),
        minLoadingTime
      ]);
      
      toast.success('课程内容已更新');
    } catch (error) {
      console.error('刷新课程内容失败:', error);
      toast.error('刷新失败，请稍后重试');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            
            {isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mr-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={16} className="mr-2" />
                <span>目录</span>
              </Button>
            )}
            
            <div className="truncate flex items-center min-w-0">
              {courseData.image_url && (
                <div className="hidden sm:block w-10 h-10 rounded-lg overflow-hidden mr-3 bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                  <img src={courseData.image_url} alt={courseData.title} className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="min-w-0 mr-24 pl-4">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{courseData.title}</h1>
                <div className="flex items-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate space-x-3">
                  <div className="flex items-center">
                    <BookOpen size={14} className="mr-1 flex-shrink-0" /> 
                    <span className="truncate">{courseData.short_description || ""}</span>
                  </div>
                  {courseData.duration && (
                    <div className="hidden sm:flex items-center flex-shrink-0">
                      <Clock size={14} className="mr-1" />
                      <span>{courseData.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0 flex items-center">
            {/* 刷新按钮 - 状态改变时文字也会改变 */}
            <Button
              variant="default"
              size="sm"
              className={`mr-3 ${isRefreshing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium min-w-[140px]`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  正在刷新...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  获取最新内容
                </>
              )}
            </Button>
            
            {courseData.instructor && (
              <div className="hidden sm:flex items-center mr-4">
                <Avatar className="h-8 w-8 mr-2 border border-slate-200 dark:border-slate-600">
                  <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {courseData.instructor.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {courseData.instructor}
                </div>
              </div>
            )}
            
            {courseData.student_count && (
              <div className="hidden sm:flex text-sm text-slate-500 dark:text-slate-400 items-center">
                <Users size={14} className="mr-1" />
                <span>{courseData.student_count} 名学员</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 屏幕中央加载提示 */}
      {isRefreshing && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center max-w-xs mx-auto">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">正在刷新课程内容</h3>
            <p className="text-gray-600 text-center">
              正在获取最新内容，请稍候...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseHeader;
