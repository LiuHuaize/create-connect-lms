import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  placeholder?: string;
  characterName?: string;
}

const AIChatBox: React.FC<AIChatBoxProps> = ({
  messages,
  onSendMessage,
  placeholder = '输入你的问题...',
  characterName = ''
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // 动画效果：打字机效果的实现
  const [displayedContent, setDisplayedContent] = useState<string[]>(
    messages.map(m => m.content)
  );
  
  useEffect(() => {
    // 仅处理最新的AI消息
    if (messages.length > 0 && messages[messages.length - 1].role === 'ai') {
      const lastMessage = messages[messages.length - 1];
      const content = lastMessage.content;
      let newDisplayed = [...displayedContent];
      
      // 确保数组长度与消息长度一致
      while (newDisplayed.length < messages.length) {
        newDisplayed.push('');
      }
      
      // 设置最后一条消息为空，然后开始逐字打印
      newDisplayed[messages.length - 1] = '';
      setDisplayedContent(newDisplayed);
      
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < content.length) {
          newDisplayed[messages.length - 1] += content.charAt(i);
          setDisplayedContent([...newDisplayed]);
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 20); // 调整速度
      
      return () => clearInterval(typingInterval);
    } else {
      // 非AI消息直接显示
      setDisplayedContent(messages.map(m => m.content));
    }
  }, [messages]);
  
  return (
    <div className="flex flex-col h-full">
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-white rounded-lg"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-4 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div 
              className={`inline-block max-w-[85%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-gray-50 text-gray-700 border border-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {displayedContent[index]}
                {msg.role === 'ai' && displayedContent[index] !== msg.content && (
                  <span className="inline-block w-1 h-4 bg-gray-300 ml-0.5 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={characterName ? `思考${characterName}的需求...` : placeholder}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
          <Button 
            onClick={handleSend} 
            className="bg-gray-800 hover:bg-gray-700 transition-colors"
            size="sm"
          >
            <Send size={14} />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          <p>提示: 尝试询问「需求」、「优点」或「弱点」</p>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox; 