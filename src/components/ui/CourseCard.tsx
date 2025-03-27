import React from 'react';
import { Clock } from 'lucide-react';

interface CourseCardProps {
  type: 'skill' | 'free' | 'career';
  title: string;
  description: string;
  coursesCount?: number;
  hours?: number;
  certificate?: boolean;
  level?: string;
  className?: string;
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
}) => {
  const getBadgeColor = () => {
    switch (type) {
      case 'skill':
        return 'bg-connect-lightBlue text-connect-blue';
      case 'free':
        return 'bg-green-100 text-green-700';
      case 'career':
        return 'bg-indigo-900 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
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
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden hover-scale shadow-sm ${className}`}>
      <div className={`${type === 'career' ? 'bg-indigo-900' : 'bg-white'} p-5`}>
        <div className={`${getBadgeColor()} inline-block px-3 py-1 rounded-full text-xs font-medium mb-3`}>
          {getTypeLabel()}
        </div>
        <h3 className={`font-bold text-lg mb-2 ${type === 'career' ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm ${type === 'career' ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>{description}</p>
      </div>
      
      {(coursesCount || certificate || level || hours) && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {coursesCount && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">包含 {coursesCount} 个课程</span>
            </div>
          )}
          
          {certificate && (
            <div className="flex items-center mb-2">
              <svg className="w-4 h-4 mr-1 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L9 9.586V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs text-gray-700">含证书</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {level && <span className="text-xs text-gray-700">{level}</span>}
            
            {hours && (
              <div className="flex items-center">
                <Clock size={14} className="mr-1 text-gray-500" />
                <span className="text-xs text-gray-700">{hours} 小时</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseCard;
