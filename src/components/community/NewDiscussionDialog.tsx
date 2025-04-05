
import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { createDiscussion } from '@/services/communityService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NewDiscussionDialogProps {
  onDiscussionCreated: () => void;
}

const NewDiscussionDialog: React.FC<NewDiscussionDialogProps> = ({ onDiscussionCreated }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "请先登录",
        description: "发布讨论前需要登录账号",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "输入不完整",
        description: "标题和内容不能为空",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await createDiscussion(title, content);
      if (result) {
        setOpen(false);
        setTitle('');
        setContent('');
        onDiscussionCreated();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-connect-blue hover:bg-blue-600">
          <MessageSquare size={16} className="mr-2" /> 新讨论
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>发起新讨论</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                标题
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入讨论标题"
                className="col-span-3"
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="content" className="text-sm font-medium">
                内容
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入讨论内容..."
                className="col-span-3 min-h-[200px]"
                maxLength={5000}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-connect-blue hover:bg-blue-600"
              disabled={isSubmitting}
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
