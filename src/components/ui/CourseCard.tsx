import React from 'react';
import { Clock, Award, BookOpen, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        return 'bg-ghibli-lightTeal text-ghibli-deepTeal border border-ghibli-teal/30';
      case 'free':
        return 'bg-ghibli-mint text-ghibli-deepTeal border border-ghibli-teal/30';
      case 'career':
        return 'bg-ghibli-skyBlue text-ghibli-deepTeal border border-ghibli-teal/30';
      default:
        return 'bg-muted text-muted-foreground border border-border';
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
    <div className={cn(
      "bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 hover:translate-y-[-4px]",
      className
    )}>
      <div className="h-40 bg-gradient-to-r from-ghibli-cream to-ghibli-sand relative">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={40} className="text-ghibli-teal/30" />
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getBadgeColor()}`}>
            {getTypeLabel()}
          </span>
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-card-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        
        {(coursesCount || certificate || level || hours) && (
          <div className="pt-3 border-t border-border">
            <div className="flex flex-wrap gap-y-2 gap-x-4">
              {coursesCount && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <BookOpen size={14} className="mr-1 text-ghibli-teal" />
                  <span>{coursesCount} 个课程</span>
                </div>
              )}
              
              {hours && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock size={14} className="mr-1 text-ghibli-teal" />
                  <span>{hours} 小时</span>
                </div>
              )}
              
              {certificate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Award size={14} className="mr-1 text-ghibli-teal" />
                  <span>含证书</span>
                </div>
              )}
              
              {level && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <BarChart size={14} className="mr-1 text-ghibli-teal" />
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
