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
  pageContent?: string; // 新增页面内容属性
}

const CourseAssistantChat: React.FC<CourseAssistantChatProps> = ({
  isChatOpen,
  setIsChatOpen,
  courseName = '当前课程',
  pageContent = ''
}) => {
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
      // 准备苏格拉底式教学的系统提示
      const socraticPrompt = `你是一个采用苏格拉底式教学法的专业学习助手，专注于帮助学生学习${courseName}。
      
你的主要目标是通过提问引导学生自己思考和发现答案，而不是直接提供信息。遵循以下原则：

1. **提问而非解答**：不要直接给出答案，而是提出深思熟虑的问题，引导学生自己获得理解。
2. **循序渐进**：通过一系列递进的问题，从简单到复杂，逐步引导思考。
3. **等待回应**：在每次提问后，给学生充分的思考时间。不要一次提出太多问题。
4. **深入追问**：根据学生的回答进一步提问，深入探索话题。
5. **反思验证**：引导学生反思自己的答案，验证其合理性。
6. **保持鼓励**：使用积极、支持性的语言，肯定学生的思考过程。
7. **引发批判性思维**：鼓励学生质疑假设，考虑不同角度。
8. **推进自我总结**：在对话结束时，引导学生自己总结所学内容。

请使用Markdown格式来增强你的回复的可读性。始终保持耐心和尊重，记住你的目标是培养学生的独立思考能力，而不是简单地提供信息。

${pageContent ? `当前页面内容：${pageContent}` : '如果你不确定学生正在学习的具体内容，可以礼貌地询问，然后基于他们的描述进行引导。'}`;

      // 准备发送给AI的消息
      const aiMessages: AppChatMessage[] = [
        { role: 'system', content: socraticPrompt },
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
            <p className="text-xs text-ghibli-brown">苏格拉底式学习引导</p>
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
              placeholder="和我分享你的想法..." 
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
              onClick={() => handleQuickPrompt("我想理解这个概念的核心原理")}
              disabled={isLoading}
            >
              探索概念
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white/70 border-ghibli-sand hover:bg-ghibli-cream text-ghibli-brown"
              onClick={() => handleQuickPrompt("我对这部分内容有些困惑，能引导我理解吗？")}
              disabled={isLoading}
            >
              我有困惑
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs rounded-full bg-white/70 border-ghibli-sand hover:bg-ghibli-cream text-ghibli-brown"
              onClick={() => handleQuickPrompt("这个知识点如何应用到实际场景中？")}
              disabled={isLoading}
            >
              应用知识
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseAssistantChat;
