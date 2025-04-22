import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">学习助手</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full"
              onClick={toggleChat}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2`}>
                <div 
                  className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* 加载指示器 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 p-3">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                value={input}
                onChange={handleInputChange}
                placeholder="输入你的问题..." 
                className="flex-1 py-1.5 px-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center"
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
          className="rounded-full h-12 w-12 bg-blue-500 hover:bg-blue-600 shadow-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      )}
    </div>
  );
};

export default FloatingChatButton; 