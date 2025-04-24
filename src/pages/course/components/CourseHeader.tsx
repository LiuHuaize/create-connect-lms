import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Menu, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/course';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  return (
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
        
        <div className="ml-4 flex-shrink-0 hidden sm:flex items-center">
          {courseData.instructor && (
            <div className="flex items-center mr-4">
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
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
              <Users size={14} className="mr-1" />
              <span>{courseData.student_count} 名学员</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;
