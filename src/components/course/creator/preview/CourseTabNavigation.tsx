
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CourseTabNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const CourseTabNavigation: React.FC<CourseTabNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <TabsList>
      <TabsTrigger 
        value="overview" 
        onClick={() => onTabChange('overview')}
        data-state={activeTab === 'overview' ? 'active' : 'inactive'}
      >
        课程概览
      </TabsTrigger>
      <TabsTrigger 
        value="content" 
        onClick={() => onTabChange('content')}
        data-state={activeTab === 'content' ? 'active' : 'inactive'}
      >
        课程内容
      </TabsTrigger>
      <TabsTrigger 
        value="info" 
        onClick={() => onTabChange('info')}
        data-state={activeTab === 'info' ? 'active' : 'inactive'}
      >
        课程信息
      </TabsTrigger>
    </TabsList>
  );
};

export default CourseTabNavigation;
