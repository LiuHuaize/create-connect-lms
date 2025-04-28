import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMessageToAI, streamMessageFromAI, formatMessages, AppChatMessage } from '@/services/aiService';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';

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
      content: `你好！我是你的${courseName}学习助手，有什么问题我可以帮忙解答吗？` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);
  
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
      // 准备发送给AI的消息，包括系统提示
      const aiMessages: AppChatMessage[] = [
        { role: 'system', content: `你是一个专业、友善的学习助手，专注于帮助学生学习${courseName}。
提供准确、有用的回答，解释复杂概念，并鼓励学生继续探索。请使用Markdown格式来增强你的回复的可读性。` },
        ...messages.map(msg => ({ 
          role: msg.role === 'ai' ? 'ai' as const : 'user' as const, 
          content: msg.content 
        })),
        { role: 'user' as const, content: message }
      ];
      
      // 使用流式输出
      let fullResponse = '';
      
      // 开始流式接收回复
      await streamMessageFromAI(
        aiMessages,
        (chunk) => {
          fullResponse += chunk;
          setCurrentStreamingMessage(fullResponse);
        },
        { temperature: 0.7 }
      );
      
      // 流式输出完成后，添加完整回复
      setMessages(prev => [...prev, { role: 'ai', content: fullResponse }]);
      setCurrentStreamingMessage('');
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
      <div className="flex justify-between items-center p-4 border-b border-ghibli-sand dark:border-ghibli-deepTeal/50">
        <div className="flex items-center">
          <div className="bg-ghibli-cream p-2 rounded-full mr-3">
            <Sparkles size={18} className="text-ghibli-deepTeal" />
          </div>
          <div>
            <h3 className="font-medium text-ghibli-deepTeal text-sm">亿小步平台助手</h3>
            <p className="text-xs text-ghibli-brown">AI驱动的课程辅导</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsChatOpen(false)}
          className="text-ghibli-brown hover:text-ghibli-deepTeal rounded-full"
        >
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-ghibli-parchment space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-ghibli-deepTeal text-white' 
                  : 'bg-ghibli-cream/80 border border-ghibli-sand/50 text-ghibli-brown'
              }`}
            >
              {/* 根据是否包含Markdown语法选择渲染方式 */}
              {msg.role === 'ai' && containsMarkdown(msg.content) ? (
                <MarkdownRenderer>{msg.content}</MarkdownRenderer>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {/* 显示正在流式接收的消息 */}
        {currentStreamingMessage && (
          <div className="flex justify-start">
            <div className="rounded-2xl p-3 max-w-[80%] shadow-sm bg-ghibli-cream/80 border border-ghibli-sand/50 text-ghibli-brown">
              {containsMarkdown(currentStreamingMessage) ? (
                <MarkdownRenderer>{currentStreamingMessage}</MarkdownRenderer>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{currentStreamingMessage}</p>
              )}
            </div>
          </div>
        )}
        
        {/* 加载指示器 */}
        {isLoading && !currentStreamingMessage && (
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
      
      <div className="border-t border-ghibli-sand p-4 bg-ghibli-cream/30">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入你的问题..." 
              className="flex-1 bg-white/70 border-ghibli-sand/70 focus-visible:ring-ghibli-teal"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white rounded-full"
              disabled={isLoading || !message.trim()}
            >
              <Send size={16} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-start">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white/70 border-ghibli-sand hover:bg-ghibli-cream text-ghibli-brown"
              onClick={() => handleQuickPrompt("请解释这个课程中的重要概念")}
              disabled={isLoading}
            >
              解释这个概念
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white/70 border-ghibli-sand hover:bg-ghibli-cream text-ghibli-brown"
              onClick={() => handleQuickPrompt("我在理解这部分内容时遇到了困难，能帮我解释一下吗？")}
              disabled={isLoading}
            >
              我需要帮助
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white/70 border-ghibli-sand hover:bg-ghibli-cream text-ghibli-brown"
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
