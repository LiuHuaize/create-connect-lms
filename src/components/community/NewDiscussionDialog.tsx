
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { communityService } from '@/services/community';
import { toast } from '@/hooks/use-toast';
import { PenLine } from 'lucide-react';

interface NewDiscussionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscussionCreated: () => void;
}

const NewDiscussionDialog: React.FC<NewDiscussionDialogProps> = ({
  open,
  onOpenChange,
  onDiscussionCreated
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "标题不能为空",
        description: "请输入讨论标题。",
        variant: "destructive"
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "内容不能为空",
        description: "请输入讨论内容。",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      const discussion = await communityService.createDiscussion(title, content);
      
      if (discussion) {
        setTitle('');
        setContent('');
        onOpenChange(false);
        onDiscussionCreated();
      }
    } catch (error) {
      console.error('发布讨论失败:', error);
      toast({
        title: "发布失败",
        description: "发布讨论时出错，请稍后再试。",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <PenLine className="h-5 w-5 mr-2" />
            发起新讨论
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">标题</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="讨论的主题是什么？"
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">内容</label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述你想讨论的话题..."
              className="min-h-[200px]"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? '发布中...' : '发布讨论'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewDiscussionDialog;
