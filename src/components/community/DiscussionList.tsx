
import React from 'react';
import { Discussion } from '@/services/communityService';
import DiscussionItem from './DiscussionItem';
import { Button } from '@/components/ui/button';
import { PenLine } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">正在加载讨论...</p>
      </div>
    );
  }

  if (discussions.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <p className="text-gray-500 mb-4">
          {searchQuery ? '没有找到匹配的讨论' : '暂无讨论'}
        </p>
        <Button 
          onClick={onNewDiscussion} 
          className="bg-primary hover:bg-primary/90"
        >
          <PenLine className="h-4 w-4 mr-2" />
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
