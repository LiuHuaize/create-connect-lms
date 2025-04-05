
import React from 'react';
import { Topic } from '@/services/communityService';
import TopicsList from './TopicsList';
import ActiveMembers from './ActiveMembers';
import WeeklyDiscussionCard from './WeeklyDiscussionCard';

interface SidebarProps {
  topics: Topic[];
}

const Sidebar: React.FC<SidebarProps> = ({ topics }) => {
  return (
    <div className="lg:col-span-1">
      <TopicsList topics={topics} />
      <ActiveMembers />
      <WeeklyDiscussionCard />
    </div>
  );
};

export default Sidebar;
