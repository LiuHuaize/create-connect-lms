
import React, { useState, useEffect } from 'react';
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
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (user) {
        try {
          const hasLiked = await communityService.hasLikedComment(comment.id);
          setIsLiked(hasLiked);
        } catch (error) {
          console.error('获取评论点赞状态失败:', error);
        }
      }
    };
    
    checkLikeStatus();
  }, [comment.id, user]);

  // 确保当likes_count属性变化时更新本地状态
  useEffect(() => {
    if (comment.likes_count !== undefined) {
      setLikesCount(comment.likes_count);
    }
  }, [comment.likes_count]);

  const handleLike = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
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
      
      // 立即更新UI以提供即时反馈
      const newLikedStatus = !isLiked;
      setIsLiked(newLikedStatus);
      setLikesCount(prevCount => newLikedStatus ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // 调用API来更新服务器状态
      const result = await communityService.likeComment(comment.id);
      
      // 如果API调用结果与预期不符，修正UI状态
      if (result !== newLikedStatus) {
        console.log('API返回与预期不符，修正本地状态');
        setIsLiked(result);
        setLikesCount(prevCount => 
          result ? Math.max(1, prevCount) : Math.max(0, prevCount - 1)
        );
      }
      
      // 通知父组件，但不要立即刷新
      if (onLiked) {
        setTimeout(() => {
          onLiked();
        }, 5000);
      }
      
    } catch (error) {
      console.error('点赞评论失败:', error);
      // 恢复本地更新
      setIsLiked(!isLiked);
      setLikesCount(prevCount => !isLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    } finally {
      // 延迟一段时间后才允许再次点赞，防止连击
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
        onClick={handleLike}
        disabled={isLiking}
        aria-label={isLiked ? "取消点赞" : "点赞"}
      >
        <Heart 
          size={16} // 增加心形图标尺寸
          className={cn(isLiked && "fill-red-500")} 
        />
        {likesCount > 0 && (
          <span className="text-xs ml-1">{likesCount}</span>
        )}
      </button>
    </div>
  );
};
