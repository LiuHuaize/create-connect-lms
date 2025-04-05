
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(content);
    
    if (success) {
      setContent('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-start gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="发表你的评论..."
        className="min-h-[80px] bg-white"
      />
      <Button 
        onClick={handleSubmit}
        disabled={isSubmitting || !content.trim()}
        className="mt-auto"
      >
        {isSubmitting ? '发送中...' : '发送'}
      </Button>
    </div>
  );
};
