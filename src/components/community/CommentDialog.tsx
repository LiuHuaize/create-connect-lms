
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { communityService, Discussion } from '@/services/community';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { DiscussionDetails } from './discussion/DiscussionDetails';
import { CommentList } from './comment/CommentList';
import { CommentForm } from './comment/CommentForm';

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
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleAddComment = async (content: string) => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能发表评论。",
        variant: "destructive"
      });
      return;
    }

    try {
      await communityService.addComment(discussionId, content);
      
      // Update local comments count
      setLocalCommentsCount(prevCount => prevCount + 1);
      
      // Reload comments to show the new one
      loadComments();
      
      toast({
        title: "评论成功",
        description: "您的评论已发布。"
      });
      
      return true;
    } catch (error) {
      console.error('发表评论失败:', error);
      toast({
        title: "评论失败",
        description: "发表评论时出错，请稍后再试。",
        variant: "destructive"
      });
      return false;
    }
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
          <DiscussionDetails discussion={discussion} />

          <div className="p-4">
            <h3 className="font-medium mb-4">评论 ({localCommentsCount})</h3>
            <CommentList 
              comments={comments} 
              isLoading={isLoading} 
              onCommentLiked={() => {
                // Optionally refresh comments after a certain time
                setTimeout(() => loadComments(), 3000);
              }} 
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50">
          <CommentForm onSubmit={handleAddComment} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
