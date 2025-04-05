
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
  const { user } = useAuth();

  // 加载评论
  useEffect(() => {
    if (open && discussionId) {
      loadComments();
    }
  }, [open, discussionId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await communityService.getComments(discussionId);
      setComments(commentsData);
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

  // 提交评论
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
      loadComments(); // 重新加载评论
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // 使用date-fns的formatDistance来获取更准确的相对时间
      const relativeTime = formatDistance(date, now, { 
        addSuffix: true, 
        locale: zhCN 
      });
      
      // 如果距离现在超过7天，则显示完整日期
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        return format(date, 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
      }
      
      return relativeTime;
    } catch (e) {
      return dateString;
    }
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
          {/* 原讨论内容 */}
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

          {/* 评论列表 */}
          <div className="p-4">
            <h3 className="font-medium mb-4">评论 ({discussion.comments_count})</h3>
            
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
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <Heart size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 评论输入框 */}
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
