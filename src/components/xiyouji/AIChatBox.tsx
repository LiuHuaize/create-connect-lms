import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
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
  const inputRef = useRef<HTMLInputElement>(null);
  
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
      }, 15); // 稍微加快打字速度
      
      return () => clearInterval(typingInterval);
    } else {
      // 非AI消息直接显示
      setDisplayedContent(messages.map(m => m.content));
    }
  }, [messages]);

  // 自动聚焦输入框
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg backdrop-blur-sm shadow-inner">
      {/* 聊天头部 */}
      <div className="py-2 px-3 border-b border-indigo-100/50 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
          <Bot size={15} className="text-indigo-600" />
        </div>
        <div className="text-xs font-medium text-indigo-700">AI 思考助手</div>
      </div>
      
      {/* 聊天区域 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-4"
      >
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div 
              className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white shadow-sm' 
                  : 'bg-white border border-indigo-100/50 shadow-sm text-gray-700'
              }`}
            >
              <div className="whitespace-pre-wrap text-xs md:text-sm">
                {displayedContent[index]}
                {msg.role === 'ai' && displayedContent[index] !== msg.content && (
                  <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-0.5 animate-pulse rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入区域 */}
      <div className="p-3 bg-white border-t border-indigo-100/50 rounded-b-lg">
        <div className="flex items-center gap-2 bg-indigo-50/50 p-1 rounded-full border border-indigo-100/50 shadow-sm">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={characterName ? `思考${characterName}的需求...` : placeholder}
            className="flex-1 px-3 py-1.5 bg-transparent rounded-full text-xs md:text-sm focus:outline-none text-gray-700 placeholder-gray-400"
          />
          <Button 
            onClick={handleSend} 
            className="rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all p-1.5 h-auto"
            disabled={!input.trim()}
          >
            <Send size={14} className="text-white" />
          </Button>
        </div>
        
        <div className="mt-2 px-2 flex items-center justify-between">
          <div className="text-xs text-indigo-400">
            <p>提示: 尝试询问「需求」、「优点」或「弱点」</p>
          </div>
          <div className="text-xs text-gray-400">
            {input.length > 0 ? `${input.length}字` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox; 