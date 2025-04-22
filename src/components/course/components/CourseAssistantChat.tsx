import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from '@ai-sdk/react';

// 定义消息类型
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CourseAssistantChatProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
  courseName?: string;
}

const CourseAssistantChat: React.FC<CourseAssistantChatProps> = ({
  isChatOpen,
  setIsChatOpen,
  courseName = '当前课程'
}) => {
  // 使用Vercel AI SDK的useChat钩子
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append
  } = useChat({
    api: '/api/chat', // 假设API端点
    initialMessages: [
      {
        id: '0',
        role: 'assistant',
        content: `你好！我是你的${courseName}学习助手，由Gemini-2.5-Flash模型提供支持。有什么问题我可以帮忙解答吗？`
      }
    ],
    body: {
      courseName // 将课程名称传递给API
    }
  });
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 快速提示按钮处理函数
  const handleQuickPrompt = (prompt: string) => {
    append({
      role: 'user',
      content: prompt
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 聊天头部 */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
            <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm">Gemini-2.5-Flash 学习助手</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">AI驱动的课程辅导</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsChatOpen(false)}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 rounded-full"
        >
          <X size={18} />
        </Button>
      </div>
      
      {/* 聊天区域 */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-4">
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
              <div className="flex items-center text-slate-500 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin mr-2" />
                <span className="text-xs">AI正在思考...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* 快速提示按钮 */}
      <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-700">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs rounded-full bg-slate-100 dark:bg-slate-800"
          onClick={() => handleQuickPrompt(`解释这个概念`)}
        >
          解释这个概念
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs rounded-full bg-slate-100 dark:bg-slate-800"
          onClick={() => handleQuickPrompt(`我需要帮助`)}
        >
          我需要帮助
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs rounded-full bg-slate-100 dark:bg-slate-800"
          onClick={() => handleQuickPrompt(`推荐学习资源`)}
        >
          推荐学习资源
        </Button>
      </div>
      
      {/* 输入区域 */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input}
            onChange={handleInputChange}
            placeholder="输入你的问题..." 
            className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 w-10 flex items-center justify-center"
            disabled={isLoading || !input.trim()}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CourseAssistantChat; 