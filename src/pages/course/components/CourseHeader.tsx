
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, BookOpen, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/course';

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
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center">
        <div className="flex items-center flex-1">
          <Link to="/learning" className="mr-2 sm:mr-4 text-gray-500 hover:text-blue-600 transition-colors">
            <div className="flex items-center">
              <ChevronLeft size={18} />
              <span className="ml-1 text-sm font-medium hidden sm:inline">返回课程</span>
            </div>
          </Link>
          
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
          )}
          
          <div className="truncate">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{courseData.title}</h1>
            <div className="flex items-center text-xs sm:text-sm text-gray-500 truncate">
              <BookOpen size={14} className="mr-1 flex-shrink-0 hidden xs:inline-block" /> 
              <span className="truncate">{courseData.short_description || ""}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;
