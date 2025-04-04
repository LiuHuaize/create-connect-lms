import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Menu, AlignLeft } from 'lucide-react';
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
  const navigate = useNavigate();
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
              onClick={() => navigate('/learning')}
            >
              <ChevronLeft size={16} />
              <span>返回课程</span>
            </Button>
            
            <div className="hidden md:block h-5 w-px bg-gray-200 mx-1"></div>
            
            <h1 className="text-base md:text-lg font-medium text-gray-900 line-clamp-1">
              {courseData.title || '课程标题'}
            </h1>
          </div>
          
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <AlignLeft size={20} />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default CourseHeader;
