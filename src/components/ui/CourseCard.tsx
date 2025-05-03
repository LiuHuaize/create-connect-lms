import React from 'react';
import { Clock, Award, BookOpen, BarChart, Star, Users, GraduationCap, Book } from 'lucide-react';
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
  rating?: number;
  studentsCount?: number;
  gradeRangeMin?: number | null;
  gradeRangeMax?: number | null;
  primarySubject?: string | null;
  secondarySubject?: string | null;
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
  rating = 4.8,
  studentsCount = 0,
  gradeRangeMin,
  gradeRangeMax,
  primarySubject,
  secondarySubject
}) => {
  const getBadgeColor = () => {
    switch (type) {
      case 'skill':
        return 'bg-secondary/20 text-secondary-foreground border border-secondary/30';
      case 'free':
        return 'bg-accent/20 text-accent-foreground border border-accent/30';
      case 'career':
        return 'bg-primary/20 text-primary-foreground border border-primary/30';
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

  // 为不同类型的课程设置不同的渐变背景
  const getGradientBackground = () => {
    switch (type) {
      case 'skill':
        return 'bg-gradient-to-r from-secondary/10 to-secondary/30';
      case 'free':
        return 'bg-gradient-to-r from-accent/10 to-accent/30';
      case 'career':
        return 'bg-gradient-to-r from-primary/10 to-primary/30';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200';
    }
  };

  return (
    <div className={cn(
      "glow-card hover-card group cursor-pointer",
      "bg-white dark:bg-card border border-border rounded-2xl overflow-hidden",
      "transition-all duration-500 hover:border-primary/50",
      className
    )}>
      <div className={cn(
        "h-48 relative overflow-hidden",
        !coverImage && getGradientBackground()
      )}>
        {coverImage ? (
          <div className="w-full h-full overflow-hidden">
            <img 
              src={coverImage} 
              alt={title} 
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen size={48} className="text-primary/40 group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
        
        {/* 闪光效果 */}
        <div className="absolute -inset-[150%] top-1/2 group-hover:animate-[spin_3s_linear_infinite] bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* 类型标签 */}
        <div className="absolute top-4 left-4 z-10 animate-fade-in">
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full shadow-sm backdrop-blur-md ${getBadgeColor()}`}>
            {getTypeLabel()}
          </span>
        </div>
        
        {/* 评分和学生数量 */}
        {(rating || studentsCount > 0) && (
          <div className="absolute bottom-3 right-3 flex gap-3 z-10">
            {rating && (
              <div className="flex items-center gap-1 bg-white/80 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
                <Star size={12} className="text-yellow-500 fill-yellow-500" />
                <span>{rating}</span>
              </div>
            )}
            {studentsCount > 0 && (
              <div className="flex items-center gap-1 bg-white/80 dark:bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs">
                <Users size={12} />
                <span>{studentsCount}人</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-5 relative">
        {/* 标题和描述 */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-card-foreground group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        
        {/* 课程信息图标 */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-auto">
          {level && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <BarChart className="h-4 w-4" />
              <span>{level}</span>
            </div>
          )}
          
          {/* 适用年级范围 */}
          {(gradeRangeMin || gradeRangeMax) && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <GraduationCap className="h-4 w-4" />
              <span>
                {gradeRangeMin && gradeRangeMax 
                  ? `${gradeRangeMin}-${gradeRangeMax}年级` 
                  : gradeRangeMin 
                  ? `${gradeRangeMin}年级及以上` 
                  : `${gradeRangeMax}年级及以下`}
              </span>
            </div>
          )}
          
          {/* 学科 */}
          {primarySubject && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <Book className="h-4 w-4" />
              <span>
                {primarySubject}
                {secondarySubject ? ` + ${secondarySubject}` : ''}
              </span>
            </div>
          )}
          
          {hours && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <Clock className="h-4 w-4" />
              <span>{hours} 小时</span>
            </div>
          )}
          
          {coursesCount && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <BookOpen className="h-4 w-4" />
              <span>{coursesCount} 课时</span>
            </div>
          )}
          
          {certificate && (
            <div className="flex items-center gap-1.5 group-hover:text-primary/70 transition-colors duration-300">
              <Award className="h-4 w-4" />
              <span>可获证书</span>
            </div>
          )}
        </div>
        
        {/* 渐进效果的底部边框 */}
        <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-accent group-hover:w-full transition-all duration-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default CourseCard;
