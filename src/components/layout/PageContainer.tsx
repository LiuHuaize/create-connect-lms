import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

/**
 * 统一的页面容器组件
 * 提供一致的页面标题样式和间距
 */
const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  title, 
  subtitle,
  rightContent 
}) => {
  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <div className={`relative ${subtitle ? 'mb-4' : 'mb-10'}`}>
        {/* 背景装饰 - 只在部分页面显示 */}
        {(title === "探索课程" || title === "我的学习") && (
          <div className="absolute top-0 right-0 w-full h-32 overflow-hidden -z-10 opacity-20">
            <img 
              src="/images/learning-background.svg" 
              alt="装饰背景"
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {/* 根据不同页面显示对应图标 */}
            {title === "探索课程" && (
              <img 
                src="/images/category-icon.svg" 
                alt="分类图标" 
                className="w-12 h-12 mr-3"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-indigo-700 mt-4 tracking-wide">{title}</h1>
              {subtitle && (
                <p className="text-lg text-gray-600 mt-2 mb-4">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {rightContent && (
            <div className="flex items-center">
              {rightContent}
            </div>
          )}
        </div>
        
        {/* 装饰性分隔线 */}
        <div className="mt-4 h-1 bg-gradient-to-r from-indigo-500 via-purple-400 to-pink-300 rounded-full"></div>
      </div>
      
      {children}
    </div>
  );
};

export default PageContainer; 