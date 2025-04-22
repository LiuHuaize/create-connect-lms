import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessageToAI, formatMessages } from '@/services/aiService';

// 定义消息类型
interface ChatMessage {
  role: 'user' | 'ai';
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
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      content: `你好！我是你的${courseName}学习助手，由Gemini-2.5-Flash模型提供支持。有什么问题我可以帮忙解答吗？` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // 添加用户消息
    const userMessage = { role: 'user' as const, content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    try {
      // 准备发送给AI的消息，包括系统提示
      const aiMessages = [
        { role: 'system' as const, content: `你是一个专业、友善的学习助手，专注于帮助学生学习${courseName}。
提供准确、有用的回答，解释复杂概念，并鼓励学生继续探索。` },
        ...formatMessages(messages),
        formatMessages([userMessage])[0]
      ];
      
      // 调用API获取回复
      const aiResponse = await sendMessageToAI(aiMessages);
      
      // 添加AI回复
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error('获取AI回复失败:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '抱歉，我在处理您的请求时遇到了问题。请稍后再试。' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full">
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
      
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-blue-100 dark:bg-blue-900/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-2xl p-3 shadow-sm">
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
      
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入你的问题..." 
              className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              disabled={isLoading || !message.trim()}
            >
              <Send size={16} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-start">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              onClick={() => handleQuickPrompt("请解释这个课程中的重要概念")}
              disabled={isLoading}
            >
              解释这个概念
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              onClick={() => handleQuickPrompt("我在理解这部分内容时遇到了困难，能帮我解释一下吗？")}
              disabled={isLoading}
            >
              我需要帮助
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              onClick={() => handleQuickPrompt("你能推荐一些学习资源来加深我对这个主题的理解吗？")}
              disabled={isLoading}
            >
              推荐学习资源
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseAssistantChat;
