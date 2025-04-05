
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { communityService, Discussion, Comment } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Heart, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discussionId: string;
  discussion: Discussion;
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  open,
  onOpenChange,
  discussionId,
  discussion
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const [likingComments, setLikingComments] = useState<Record<string, boolean>>({});
  const [localCommentsCount, setLocalCommentsCount] = useState(discussion.comments_count);
  const { user } = useAuth();

  useEffect(() => {
    if (open && discussionId) {
      loadComments();
      setLocalCommentsCount(discussion.comments_count);
    }
  }, [open, discussionId, discussion.comments_count]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await communityService.getComments(discussionId);
      setComments(commentsData);
      
      // Check like status for each comment if user is logged in
      if (user) {
        const likeStatusMap: Record<string, boolean> = {};
        for (const comment of commentsData) {
          // This would require a new function to check if user has liked a comment
          // For now we'll leave it unimplemented
          likeStatusMap[comment.id] = false;
        }
        setLikedComments(likeStatusMap);
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      toast({
        title: "加载失败",
        description: "获取评论数据时出错，请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能发表评论。",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "评论不能为空",
        description: "请输入评论内容。",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await communityService.addComment(discussionId, newComment);
      setNewComment('');
      
      // Update local comments count
      setLocalCommentsCount(prevCount => prevCount + 1);
      
      // Reload comments to show the new one
      loadComments();
      
      toast({
        title: "评论成功",
        description: "您的评论已发布。"
      });
    } catch (error) {
      console.error('发表评论失败:', error);
      toast({
        title: "评论失败",
        description: "发表评论时出错，请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能点赞评论。",
        variant: "destructive"
      });
      return;
    }

    if (likingComments[commentId]) return; // Prevent multiple clicks

    try {
      // Mark this comment as being liked to prevent multiple clicks
      setLikingComments(prev => ({ ...prev, [commentId]: true }));
      
      // Toggle the liked status locally for immediate feedback
      const newLikedStatus = !likedComments[commentId];
      setLikedComments(prev => ({ ...prev, [commentId]: newLikedStatus }));
      
      // Update the comment's like count locally 
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === commentId 
            ? { 
                ...comment, 
                likes_count: newLikedStatus 
                  ? (comment.likes_count || 0) + 1 
                  : Math.max(0, (comment.likes_count || 0) - 1) 
              } 
            : comment
        )
      );
      
      // In a real implementation, this would call an API to like the comment
      // For now we'll simulate the behavior
      setTimeout(() => {
        // API call would go here
        console.log(`${newLikedStatus ? 'Liked' : 'Unliked'} comment: ${commentId}`);
      }, 300);
      
    } catch (error) {
      console.error('点赞评论失败:', error);
      // Revert the optimistic update in case of error
      setLikedComments(prev => ({ ...prev, [commentId]: !likedComments[commentId] }));
    } finally {
      // Unmark this comment as being liked
      setTimeout(() => {
        setLikingComments(prev => ({ ...prev, [commentId]: false }));
      }, 500);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      const relativeTime = formatDistance(date, now, { 
        addSuffix: true, 
        locale: zhCN 
      });
      
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
      }
      
      return relativeTime;
    } catch (e) {
      return dateString;
    }
  };

  const getAvatarInitials = (username: string = '未知用户') => {
    return username.substring(0, 2);
  };

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
    
    const charSum = userId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorIndex = charSum % colors.length;
    
    return colors[colorIndex];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 h-8 w-8" 
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>讨论详情</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto">
          <div className="p-4 border-b">
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
                <p className="text-gray-600 mb-2 break-words whitespace-pre-line">{discussion.content}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-medium mb-4">评论 ({localCommentsCount})</h3>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无评论，快来发表第一条评论吧
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
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
                        likedComments[comment.id] 
                          ? "text-red-500" 
                          : "text-gray-400 hover:text-red-500"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeComment(comment.id);
                      }}
                      disabled={likingComments[comment.id]}
                    >
                      <Heart 
                        size={14} 
                        className={cn(likedComments[comment.id] && "fill-red-500")} 
                      />
                      {comment.likes_count > 0 && (
                        <span className="text-xs ml-1">{comment.likes_count}</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-start gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="发表你的评论..."
              className="min-h-[80px] bg-white"
            />
            <Button 
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              className="mt-auto"
            >
              {isSubmitting ? '发送中...' : '发送'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
