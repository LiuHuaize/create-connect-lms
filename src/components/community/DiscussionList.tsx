
import React from 'react';
import { Discussion } from '@/services/communityService';
import DiscussionItem from './DiscussionItem';
import { Button } from '@/components/ui/button';

interface DiscussionListProps {
  discussions: Discussion[];
  loading: boolean;
  searchQuery: string;
  onLike: () => void;
  onNewDiscussion: () => void;
}

const DiscussionList: React.FC<DiscussionListProps> = ({
  discussions,
  loading,
  searchQuery,
  onLike,
  onNewDiscussion
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">正在加载讨论...</p>
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {searchQuery ? '没有找到匹配的讨论' : '暂无讨论'}
        </p>
        <Button 
          onClick={onNewDiscussion} 
          variant="outline" 
          className="mt-4"
        >
          发起第一个讨论
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {discussions.map(discussion => (
        <DiscussionItem 
          key={discussion.id} 
          discussion={discussion} 
          onLike={onLike}
        />
      ))}
    </div>
  );
};

export default DiscussionList;
