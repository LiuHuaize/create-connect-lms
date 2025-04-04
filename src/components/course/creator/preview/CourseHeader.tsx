
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/course';

interface CourseHeaderProps {
  course: Course;
  onClose: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({ course, onClose }) => {
  return (
    <div 
      className="relative h-60 bg-gradient-to-r from-blue-600 to-indigo-700 overflow-hidden"
      style={{
        backgroundImage: course.cover_image 
          ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${course.cover_image})` 
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute top-4 left-4 z-10">
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/70 backdrop-blur-sm" 
          onClick={onClose}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>
      
      <div className="absolute bottom-6 left-6 text-white z-10">
        <h1 className="text-3xl font-bold mb-2">
          {course.title || '课程标题'}
        </h1>
        <p className="text-white/90 max-w-2xl">
          {course.short_description || '课程简短描述将显示在这里'}
        </p>
      </div>
    </div>
  );
};

export default CourseHeader;
