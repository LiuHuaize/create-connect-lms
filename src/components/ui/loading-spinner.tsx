import React from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = '加载中...', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-blue-600', sizeClasses[size])} />
      <p className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
        {text}
      </p>
    </div>
  );
};

// 全屏加载组件
export const FullScreenLoader: React.FC<{ text?: string }> = ({ text = '页面加载中...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm mx-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">亿小步课堂</h3>
            <p className="text-gray-600">{text}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 课程页面专用加载组件
export const CoursePageLoader: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部加载状态 */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex flex-1">
        {/* 侧边栏加载状态 */}
        <div className="w-80 bg-white border-r border-gray-200 p-4">
          <div className="space-y-4">
            <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 主内容加载状态 */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <FullScreenLoader text="正在加载课程内容..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;