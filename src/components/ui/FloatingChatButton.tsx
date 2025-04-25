import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChat } from '@ai-sdk/react';

interface FloatingChatButtonProps {
  courseName?: string;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  courseName = '当前课程'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '0',
        role: 'assistant',
        content: `你好！我是你的${courseName}学习助手，有什么问题我可以帮忙解答吗？`
      }
    ],
    body: {
      courseName
    }
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 切换聊天窗口状态
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // 点击外部关闭聊天窗口
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="bg-ghibli-parchment rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden transition-all duration-300 ease-in-out border border-ghibli-sand/50">
          <div className="flex justify-between items-center p-3 border-b border-ghibli-sand bg-ghibli-cream/50">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-ghibli-cream mr-2">
                <Sparkles size={14} className="text-ghibli-deepTeal" />
              </div>
              <h3 className="text-sm font-medium text-ghibli-deepTeal">亿小步平台助手</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full text-ghibli-brown hover:text-ghibli-deepTeal hover:bg-ghibli-cream/70"
              onClick={toggleChat}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto bg-ghibli-parchment space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2`}>
                <div 
                  className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-ghibli-deepTeal text-white' 
                      : 'bg-ghibli-cream/80 border border-ghibli-sand/50 text-ghibli-brown'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* 加载指示器 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ghibli-cream/80 border border-ghibli-sand/50 rounded-2xl p-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-ghibli-teal animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-ghibli-teal animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-ghibli-teal animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-ghibli-sand p-3 bg-ghibli-cream/30">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                value={input}
                onChange={handleInputChange}
                placeholder="输入你的问题..." 
                className="flex-1 py-1.5 px-3 bg-white/70 border border-ghibli-sand/70 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-ghibli-teal focus:border-ghibli-teal"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white rounded-full h-8 w-8 p-0 flex items-center justify-center"
                disabled={isLoading || !input.trim()}
              >
                <Send size={14} />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="rounded-full h-12 w-12 bg-ghibli-teal hover:bg-ghibli-deepTeal shadow-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      )}
    </div>
  );
};

export default FloatingChatButton; 