
import React, { useState, useEffect } from 'react';
import { MessageSquare, Heart } from 'lucide-react';
import { communityService } from '@/services/community';
import { cn } from '@/lib/utils';
import { formatDate } from './utils/formatUtils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import CommentDialog from './CommentDialog';

interface DiscussionItemProps {
  discussion: {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    likes_count: number;
    comments_count: number;
    tags: string[] | null;
    username?: string;
  };
  onLike: () => void;
}

const DiscussionItem: React.FC<DiscussionItemProps> = ({ discussion, onLike }) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(discussion.likes_count || 0);
  const [localCommentsCount, setLocalCommentsCount] = useState(discussion.comments_count || 0);
  const { user } = useAuth();
  
  // 初始化点赞状态
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (user) {
        const liked = await communityService.hasLikedDiscussion(discussion.id);
        setHasLiked(liked);
      }
    };
    
    checkLikeStatus();
  }, [discussion.id, user]);
  
  // 确保当discussion属性变化时更新本地状态
  useEffect(() => {
    setLocalLikesCount(discussion.likes_count || 0);
    setLocalCommentsCount(discussion.comments_count || 0);
  }, [discussion.likes_count, discussion.comments_count]);
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能点赞。",
        variant: "destructive"
      });
      return;
    }
    
    if (isLiking) return; // 防止多次点击
    
    try {
      setIsLiking(true);
      
      // 立即更新UI以提供即时反馈
      const newLikeStatus = !hasLiked;
      setHasLiked(newLikeStatus);
      setLocalLikesCount(prevCount => newLikeStatus ? prevCount + 1 : Math.max(0, prevCount - 1));
      
      // 调用API来更新服务器状态
      const result = await communityService.likeDiscussion(discussion.id);
      
      // 如果API调用结果与预期不符，恢复本地状态
      if (result !== newLikeStatus) {
        setHasLiked(!newLikeStatus);
        setLocalLikesCount(prevCount => !newLikeStatus ? prevCount + 1 : Math.max(0, prevCount - 1));
      }
      
      // 延迟通知父组件刷新列表，防止UI闪烁
      setTimeout(() => {
        onLike();
      }, 2000);
    } catch (error) {
      console.error('点赞失败:', error);
      // 恢复本地状态
      setHasLiked(!hasLiked);
      setLocalLikesCount(prevCount => !hasLiked ? prevCount + 1 : Math.max(0, prevCount - 1));
    } finally {
      // 延迟一段时间后才允许再次点赞，防止连击
      setTimeout(() => {
        setIsLiking(false);
      }, 500);
    }
  };
  
  const handleOpenComments = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsCommentDialogOpen(true);
  };
  
  // 提取用户头像的首字母
  const getAvatarInitials = (username: string = '未知用户') => {
    return username.substring(0, 2);
  };
  
  // 随机生成头像背景色（但对同一用户保持一致）
  const getAvatarBgColor = (userId: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-purple-100 text-purple-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-indigo-100 text-indigo-700',
      'bg-pink-100 text-pink-700',
    ];
    
    // 使用用户ID生成一个一致的索引
    const charSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charSum % colors.length;
    
    return colors[colorIndex];
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleOpenComments}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0",
            getAvatarBgColor(discussion.user_id)
          )}>
            {getAvatarInitials(discussion.username)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{discussion.username || '未知用户'}</h3>
              <span className="text-gray-500 text-sm">• {formatDate(discussion.created_at)}</span>
              {discussion.tags && discussion.tags.length > 0 && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  {discussion.tags[0]}
                </span>
              )}
            </div>
            
            <h4 className="text-lg font-bold mb-2">{discussion.title}</h4>
            <p className="text-gray-600 mb-4 break-words whitespace-pre-line">{discussion.content}</p>
            
            <div className="flex items-center gap-6">
              <button 
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  hasLiked 
                    ? "text-red-500 hover:text-red-600" 
                    : "text-gray-500 hover:text-connect-blue"
                )}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart size={16} className={cn(hasLiked && "fill-red-500")} />
                <span className="text-sm">{localLikesCount}</span>
              </button>
              <button 
                className="flex items-center gap-1 text-gray-500 hover:text-connect-blue transition-colors"
                onClick={handleOpenComments}
              >
                <MessageSquare size={16} />
                <span className="text-sm">{localCommentsCount}条评论</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <CommentDialog 
        open={isCommentDialogOpen} 
        onOpenChange={setIsCommentDialogOpen}
        discussionId={discussion.id}
        discussion={{
          ...discussion,
          comments_count: localCommentsCount  // 确保使用本地评论计数
        }}
      />
    </>
  );
};

export default DiscussionItem;
