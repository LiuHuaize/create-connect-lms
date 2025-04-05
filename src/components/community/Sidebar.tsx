
import React from 'react';
import { Topic } from '@/services/communityService';
import TopicsList from './TopicsList';

interface SidebarProps {
  topics: Topic[];
}

const Sidebar: React.FC<SidebarProps> = ({ topics }) => {
  return (
    <div className="lg:col-span-1">
      <TopicsList topics={topics} />
    </div>
  );
};

export default Sidebar;
