import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// 定义消息类型
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface FloatingAssistantChatProps {
  courseName?: string;
  pageContent?: string;
}

const FloatingAssistantChat: React.FC<FloatingAssistantChatProps> = ({
  courseName = '当前课程',
  pageContent = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      content: `你好！我是你的${courseName}学习助手。我很高兴能陪伴你探索这个主题！我不会直接给你答案，而是通过提问引导你思考，帮助你形成自己的理解。有什么问题想一起探讨吗？` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  const handleOutsideClick = (e: MouseEvent) => {
    if (isOpen && containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // 添加用户消息
    const userMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setCurrentStreamingMessage('');
    
    try {
      // 假设这里会调用API
      // 为了演示，我们模拟一个响应
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: `这是关于"${message}"的回答。我是${courseName}的学习助手，请继续提问！` 
        }]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };
  
  // 快速提示按钮处理函数
  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
    handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };
  
  // 聊天气泡样式
  const chatBubbleStyles = {
    user: "bg-primary text-primary-foreground self-end rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl",
    ai: "bg-muted text-foreground self-start rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
  };

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* 浮动聊天按钮 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-20 w-20 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        >
          <MessageSquare size={32} />
        </Button>
      )}
      
      {/* 聊天面板 */}
      <div className={cn(
        "bg-card border border-border rounded-xl shadow-xl overflow-hidden transition-all duration-300 flex flex-col",
        isOpen
          ? "opacity-100 scale-100 w-[26rem] md:w-[28rem] h-[80vh] max-h-[600px]"
          : "opacity-0 scale-95 h-0 w-0 pointer-events-none"
      )}>
        {/* 聊天头部 */}
        <div className="flex justify-between items-center p-3 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center">
            <div className="bg-primary/20 p-2 rounded-full mr-3 flex items-center justify-center">
              <Sparkles size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{courseName}学习助手</h3>
              <p className="text-xs text-muted-foreground">AI驱动的课程辅导</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-muted-foreground hover:text-foreground rounded-full h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>
        
        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 max-w-[90%] ${chatBubbleStyles[msg.role]}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className={`px-4 py-2 ${chatBubbleStyles.ai}`}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
            
            {currentStreamingMessage && (
              <div className="flex justify-start">
                <div className={`px-4 py-3 ${chatBubbleStyles.ai}`}>
                  <p className="text-sm">{currentStreamingMessage}</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* 快速提示区域 */}
        <div className="px-3 py-2 flex flex-wrap gap-2 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs rounded-full bg-muted/60"
            onClick={() => handleQuickPrompt("解释这个概念")}
            disabled={isLoading}
          >
            探索概念
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs rounded-full bg-muted/60"
            onClick={() => handleQuickPrompt("我对这部分内容有些困惑")}
            disabled={isLoading}
          >
            我有困惑
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs rounded-full bg-muted/60"
            onClick={() => handleQuickPrompt("这个知识点如何应用？")}
            disabled={isLoading}
          >
            应用知识
          </Button>
        </div>
        
        {/* 输入区域 */}
        <div className="border-t border-border p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入你的问题..." 
              className="flex-1 bg-muted/50 focus-visible:ring-primary"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-9 w-9 flex items-center justify-center"
              disabled={isLoading || !message.trim()}
            >
              <Send size={14} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FloatingAssistantChat; 