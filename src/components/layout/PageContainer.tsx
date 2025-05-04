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
      <div className={`flex justify-between items-center ${subtitle ? 'mb-2' : 'mb-8'}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 pl-1">{title}</h1>
          {subtitle && <p className="text-lg text-gray-600 mt-2 mb-6 pl-1">{subtitle}</p>}
        </div>
        {rightContent && (
          <div className="flex items-center">
            {rightContent}
          </div>
        )}
      </div>
      
      {children}
    </div>
  );
};

export default PageContainer; 