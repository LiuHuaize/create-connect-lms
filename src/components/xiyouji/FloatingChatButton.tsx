import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIChatBox, { ChatMessage } from './AIChatBox';

interface FloatingChatButtonProps {
  characterName?: string;
  initialMessages?: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
  characterName = '',
  initialMessages = [{ role: 'ai', content: `你好！我是你的AI助手，可以帮你思考。告诉我你的想法吧！` }],
  onSendMessage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听点击事件，如果点击的不是聊天组件，则关闭聊天框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = (message: string) => {
    // 添加用户消息到聊天记录
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    
    // 调用父组件传递的发送消息处理函数
    onSendMessage(message);
  };

  // 当接收到新的AI回复时更新消息列表
  useEffect(() => {
    if (initialMessages.length > messages.length) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">AI 思考助手</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full"
              onClick={toggleChat}
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChatBox 
              messages={messages}
              onSendMessage={handleSendMessage}
              characterName={characterName}
              aiName="AI 思考助手"
            />
          </div>
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="rounded-full h-12 w-12 bg-indigo-500 hover:bg-indigo-600 shadow-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      )}
    </div>
  );
};

export default FloatingChatButton; 