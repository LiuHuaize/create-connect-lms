
import React from 'react';
import { Clock, Award, BookOpen, BarChart } from 'lucide-react';

interface CourseCardProps {
  type: 'skill' | 'free' | 'career';
  title: string;
  description: string;
  coursesCount?: number;
  hours?: number;
  certificate?: boolean;
  level?: string;
  className?: string;
  coverImage?: string | null;
}

const CourseCard: React.FC<CourseCardProps> = ({
  type,
  title,
  description,
  coursesCount,
  hours,
  certificate,
  level,
  className,
  coverImage,
}) => {
  const getBadgeColor = () => {
    switch (type) {
      case 'skill':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'free':
        return 'bg-green-50 text-green-600 border border-green-100';
      case 'career':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'skill':
        return '技能路径';
      case 'free':
        return '免费课程';
      case 'career':
        return '职业路径';
      default:
        return '课程';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:translate-y-[-4px] ${className}`}>
      <div className="h-40 bg-gradient-to-r from-gray-100 to-gray-200 relative">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={40} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getBadgeColor()}`}>
            {getTypeLabel()}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-4">{description}</p>
        
        {(coursesCount || certificate || level || hours) && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-y-2 gap-x-4">
              {coursesCount && (
                <div className="flex items-center text-xs text-gray-600">
                  <BookOpen size={14} className="mr-1 text-gray-500" />
                  <span>{coursesCount} 个课程</span>
                </div>
              )}
              
              {hours && (
                <div className="flex items-center text-xs text-gray-600">
                  <Clock size={14} className="mr-1 text-gray-500" />
                  <span>{hours} 小时</span>
                </div>
              )}
              
              {certificate && (
                <div className="flex items-center text-xs text-gray-600">
                  <Award size={14} className="mr-1 text-gray-500" />
                  <span>含证书</span>
                </div>
              )}
              
              {level && (
                <div className="flex items-center text-xs text-gray-600">
                  <BarChart size={14} className="mr-1 text-gray-500" />
                  <span>{level}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
