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
    <div className="min-h-screen bg-gray-50/50">
      <div className="animate-fade-in p-8 max-w-7xl mx-auto">
        <div className={`flex justify-between items-center ${subtitle ? 'mb-2' : 'mb-8'}`}>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {subtitle && <p className="text-lg text-muted-foreground mt-2 mb-6">{subtitle}</p>}
          </div>
          {rightContent && (
            <div className="flex items-center">
              {rightContent}
            </div>
          )}
        </div>
        
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 