import React from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface CourseProgressCardProps {
  title: string;
  description: string;
  progress: number;
  imageUrl?: string;
  lastAccessed?: string;
  duration?: string;
  onClick?: () => void;
}

export function CourseProgressCard({
  title,
  description,
  progress,
  imageUrl,
  lastAccessed,
  duration,
  onClick
}: CourseProgressCardProps) {
  return (
    <div 
      className="group hover-card glow-card hover:cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        {/* 课程封面图片 */}
        {imageUrl && (
          <div className="w-full h-40 mb-3 overflow-hidden rounded-t-2xl">
            <div className="relative w-full h-full overflow-hidden">
              <img 
                src={imageUrl} 
                alt={title} 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* 闪光效果 */}
              <div className="absolute -right-20 top-0 h-full w-10 bg-white/20 opacity-0 group-hover:opacity-100 rotate-12 transform translate-x-0 group-hover:translate-x-96 transition-all duration-1000 ease-in-out"></div>
            </div>
          </div>
        )}
        
        {/* 课程内容 */}
        <div className="flex-1 p-5 pt-3">
          <h3 className="animated-heading text-lg mb-1 text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
          
          {/* 元数据 */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
            {lastAccessed && (
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full">
                <Calendar className="h-3 w-3 text-primary/70" />
                <span>{lastAccessed}</span>
              </div>
            )}
            {duration && (
              <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3 text-accent/70" />
                <span>{duration}</span>
              </div>
            )}
          </div>
          
          {/* 进度条 */}
          <div className="mt-auto">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">学习进度</span>
              <span className="text-xs font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                {progress}%
              </span>
            </div>
            <div className="relative overflow-hidden rounded-full h-3 bg-gray-200 dark:bg-gray-700 flex">
              <div 
                className="progress-bar bg-primary"
                style={{ width: `${progress}%` }}
              ></div>
              <div 
                className="absolute top-0 bottom-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-20 animate-pulse-slow"
                style={{ animationDuration: '2s' }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-primary/15 group-hover:bg-primary text-primary group-hover:text-primary-foreground transition-colors duration-300 shadow-sm">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 