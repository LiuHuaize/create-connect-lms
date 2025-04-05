import React from 'react';
import { Topic } from '@/services/community/types';

interface TopicsListProps {
  topics: Topic[];
}

const TopicsList: React.FC<TopicsListProps> = ({ topics }) => {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm">
      <h3 className="text-xl font-bold p-5 border-b border-gray-100">热门话题</h3>
      <div className="p-5 space-y-2">
        {topics.map(topic => (
          <button 
            key={topic.id}
            className="w-full text-left p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {topic.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicsList;
