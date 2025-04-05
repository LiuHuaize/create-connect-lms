
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { communityService } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';

interface NewDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscussionCreated: () => void;
}

const NewDiscussionDialog: React.FC<NewDiscussionDialogProps> = ({ open, onOpenChange, onDiscussionCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "您需要登录才能发布讨论。",
        variant: "destructive"
      });
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "内容不完整",
        description: "标题和内容不能为空。",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const result = await communityService.createDiscussion(title, content);
      
      if (result) {
        setTitle('');
        setContent('');
        onOpenChange(false);
        onDiscussionCreated();
        toast({
          title: "发布成功",
          description: "您的讨论已成功发布。"
        });
      }
    } catch (error) {
      console.error('发布讨论失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>发布新讨论</DialogTitle>
          <DialogDescription>
            分享您的想法、问题或经验与社区成员交流。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              标题
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="讨论标题"
              maxLength={100}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              内容
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述您的想法、问题或经验..."
              rows={8}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
            >
              {isSubmitting ? '发布中...' : '发布讨论'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDiscussionDialog;
