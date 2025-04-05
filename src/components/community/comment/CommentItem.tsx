
import React, { useState } from 'react';
import { Comment, communityService } from '@/services/community';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { formatDate, getAvatarInitials, getAvatarBgColor } from '../utils/formatUtils';

interface CommentItemProps {
  comment: Comment;
  onLiked?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onLiked }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const { user } = useAuth();

  // Check if user has liked this comment
  React.useEffect(() => {
    const checkLikeStatus = async () => {
      if (user) {
        const hasLiked = await communityService.hasLikedComment(comment.id);
        setIsLiked(hasLiked);
      }
    };
    
    checkLikeStatus();
  }, [comment.id, user]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能点赞评论。",
        variant: "destructive"
      });
      return;
    }

    if (isLiking) return; // Prevent multiple clicks

    try {
      setIsLiking(true);
      
      // Toggle the liked status locally for immediate feedback
      const newLikedStatus = !isLiked;
      setIsLiked(newLikedStatus);
      
      // Update the comment's like count locally 
      setLikesCount(prevCount => 
        newLikedStatus ? prevCount + 1 : Math.max(0, prevCount - 1)
      );
      
      // Call the API to like/unlike the comment
      const result = await communityService.likeComment(comment.id);
      
      // If the API call fails, revert the optimistic update
      if (result !== newLikedStatus) {
        setIsLiked(!newLikedStatus);
        setLikesCount(prevCount => 
          !newLikedStatus ? prevCount + 1 : Math.max(0, prevCount - 1)
        );
      }
      
      // Notify parent component
      if (onLiked) onLiked();
      
    } catch (error) {
      console.error('点赞评论失败:', error);
      // Revert the optimistic update in case of error
      setIsLiked(!isLiked);
      setLikesCount(prevCount => 
        !isLiked ? prevCount + 1 : Math.max(0, prevCount - 1)
      );
    } finally {
      // Unmark this comment as being liked after a delay
      setTimeout(() => {
        setIsLiking(false);
      }, 500);
    }
  };

  return (
    <div className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
        getAvatarBgColor(comment.user_id)
      )}>
        {getAvatarInitials(comment.username)}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.username || '未知用户'}</span>
          <span className="text-gray-500 text-xs">• {formatDate(comment.created_at)}</span>
        </div>
        <p className="text-gray-700 text-sm">{comment.content}</p>
      </div>
      <button 
        className={cn(
          "flex items-center transition-colors",
          isLiked 
            ? "text-red-500" 
            : "text-gray-400 hover:text-red-500"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleLike();
        }}
        disabled={isLiking}
      >
        <Heart 
          size={14} 
          className={cn(isLiked && "fill-red-500")} 
        />
        {likesCount > 0 && (
          <span className="text-xs ml-1">{likesCount}</span>
        )}
      </button>
    </div>
  );
};
