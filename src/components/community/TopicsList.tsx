
import React from 'react';
import { Topic } from '@/services/communityService';

interface TopicsListProps {
  topics: Topic[];
}

const TopicsList: React.FC<TopicsListProps> = ({ topics }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="font-bold mb-4">热门话题</h3>
      <div className="space-y-3">
        {topics.map(topic => (
          <button 
            key={topic.id}
            className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
          >
            {topic.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicsList;
