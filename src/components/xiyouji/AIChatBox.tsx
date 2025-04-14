import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
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
        className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white rounded-lg"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`mb-4 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div className="flex items-start gap-2 mb-1">
              {msg.role === 'ai' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <Bot size={14} className="text-green-600" />
                </div>
              )}
              <div 
                className={`inline-block max-w-[80%] p-3 rounded-lg animate-fadeIn ${
                  msg.role === 'user' 
                    ? 'bg-blue-500 text-white rounded-tr-none' 
                    : 'bg-white text-gray-700 border border-gray-200 rounded-tl-none shadow-sm'
                }`}
              >
                {/* 实际显示打字机效果的内容 */}
                <div className="whitespace-pre-wrap">
                  {displayedContent[index]}
                  {msg.role === 'ai' && displayedContent[index] !== msg.content && (
                    <span className="animate-pulse">|</span>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={14} className="text-blue-600" />
                </div>
              )}
            </div>
            
            {/* 时间戳 - 可选 */}
            {/* <div className="text-xs text-gray-400 mx-8">
              {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div> */}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 bg-white border-t border-gray-100 rounded-b-lg">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={characterName ? `思考${characterName}的需求...` : placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <Button 
            onClick={handleSend} 
            className="bg-blue-500 hover:bg-blue-600 transition-colors"
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
        
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
          <p>💡 提示: 尝试询问{characterName ? `关于${characterName}的` : ''}「需求」、「优点」或「弱点」</p>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox; 