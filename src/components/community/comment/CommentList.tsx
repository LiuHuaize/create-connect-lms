
import React from 'react';
import { Comment } from '@/services/community';
import { CommentItem } from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  onCommentLiked?: () => void;
}

export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  isLoading,
  onCommentLiked
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无评论，快来发表第一条评论吧
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          onLiked={onCommentLiked}
        />
      ))}
    </div>
  );
};
