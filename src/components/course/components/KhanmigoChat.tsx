import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { streamCourseAssistant, AppChatMessage } from '@/services/ai/courseAssistant';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';

// 定义消息类型
interface ChatMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
  error?: boolean;
}

interface KhanmigoChatProps {
  courseContent?: string; // 左侧课程内容
  courseName?: string; // 课程名称
}

const KhanmigoChat: React.FC<KhanmigoChatProps> = ({
  courseContent = '',
  courseName = '当前课程'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'ai', 
      content: `你好！我是你的${courseName}学习助手。有什么问题我可以帮助你？` 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 切换聊天窗口
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);
  
  // 点击窗口外部关闭聊天
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // 处理重试
  const handleRetry = async () => {
    // 如果没有最后的用户消息，无法重试
    if (!lastUserMessage) return;
    
    // 移除错误消息
    setMessages(prev => prev.filter(msg => !msg.error));
    setHasError(false);
    
    // 重新发送最后的用户消息
    await sendMessage(lastUserMessage);
  };
  
  // 发送消息逻辑，抽取为单独函数便于重用
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // 添加用户消息
    const userMessage = { role: 'user' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setCurrentStreamingMessage('');
    setLastUserMessage(messageText);
    setHasError(false);
    
    try {
      // 准备系统提示，包含课程内容
      const systemPrompt = `你是一个友好、有帮助的学习助手，类似于Khanmigo。你的目标是帮助学生理解${courseName}的概念和解答题目。

重要提示：
1. 你正在帮助学生解答测验或课程题目。永远不要直接给出答案！
2. 用苏格拉底式方法引导学生思考，通过提问帮助他们自己发现答案
3. 如果学生问你答案，不要告诉他们，而是引导他们分析选项
4. 当学生问你类似"这道题选什么"的问题时，应该帮助他们理解题目而不是告诉他们答案
5. 每次回复中保持只有一个提问，让学生有思考空间
6. 如果学生提问的就是测验中的题目内容，一定要认识到这一点

保持回复简洁、清晰，使用友好的对话风格。

当前课程内容：
${courseContent || '课程内容未提供。请根据学生的问题提供相关指导。'}

几个例子：
学生:狗是从哪种动物演化而来的?
助手:这是个很有趣的题目！你觉得狗最可能和哪种现存的野生动物有亲缘关系呢？它们的外形或行为有什么相似之处？

学生:选A还是选B？
助手:我看到这是个选择题。让我们思考一下每个选项的含义。A选项说的是什么？这与我们学过的内容有什么联系？

学生:这道题的答案是什么？
助手:与其直接告诉你答案，不如我们一起分析一下这个问题。你能告诉我你对这个题目的理解吗？或者你认为哪个选项可能是正确的，为什么？

假如学生回答出正确答案，你就不要一直继续提问了，肯定学生正确答案`;

      // 准备发送给AI的消息
      const aiMessages: AppChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({ 
          role: msg.role === 'ai' ? 'ai' as const : 
                msg.role === 'system' ? 'system' as const : 'user' as const, 
          content: msg.content 
        })),
        { role: 'user' as const, content: messageText }
      ];
      
      // 使用流式输出
      let fullResponse = '';
      
      // 开始流式接收回复
      await streamCourseAssistant(
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
      setHasError(true);
      
      // 检查错误消息是否来自API服务本身
      if (currentStreamingMessage.includes('[系统消息:')) {
        // 如果已经有系统消息，不再添加新的错误消息
        if (!currentStreamingMessage.trim()) {
          setMessages(prev => [...prev, { 
            role: 'system', 
            content: '抱歉，AI助手暂时无法回应。请稍后再试或尝试刷新页面。', 
            error: true
          }]);
        }
      } else {
        // 添加错误消息
        setMessages(prev => [...prev, { 
          role: 'system', 
          content: '抱歉，AI助手暂时无法回应。请稍后再试或尝试刷新页面。', 
          error: true 
        }]);
      }
    } finally {
      setIsLoading(false);
      setCurrentStreamingMessage('');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(message);
  };

  return (
    <div ref={containerRef} className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-lg w-80 h-96 flex flex-col overflow-hidden transition-all duration-300 ease-in-out border border-gray-200">
          <div className="flex justify-between items-center p-3 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <div className="p-1.5 rounded-full bg-blue-100 mr-2">
                <Sparkles size={14} className="text-blue-600" />
              </div>
              <h3 className="text-sm font-medium text-blue-700">课程助手</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100"
              onClick={toggleChat}
            >
              <X size={16} />
            </Button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-2`}>
                <div 
                  className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : msg.error 
                        ? 'bg-red-50 border border-red-200 text-red-700'
                        : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {msg.error ? (
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center">
                        <AlertCircle size={14} className="text-red-500 mr-1" />
                        <p className="text-sm font-medium">{msg.content}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs px-2 py-1 h-auto border-red-300 text-red-600 hover:bg-red-50 flex items-center"
                        onClick={handleRetry}
                      >
                        <RefreshCw size={12} className="mr-1" />
                        重试
                      </Button>
                    </div>
                  ) : msg.role === 'ai' && containsMarkdown(msg.content) ? (
                    <MarkdownRenderer>{msg.content}</MarkdownRenderer>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* 显示流式接收的消息 */}
            {currentStreamingMessage && (
              <div className="flex justify-start">
                <div className="rounded-2xl p-3 max-w-[80%] shadow-sm bg-white border border-gray-200 text-gray-800">
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
                <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t border-gray-200 p-3 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入你的问题..." 
                className="flex-1 py-1.5 px-3 bg-gray-50 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8 p-0 flex items-center justify-center"
                disabled={isLoading || !message.trim()}
              >
                <Send size={14} />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <Button
          onClick={toggleChat}
          className="rounded-full h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-lg p-0 flex items-center justify-center transition-all duration-300 ease-in-out"
        >
          <MessageCircle size={24} className="text-white" />
        </Button>
      )}
    </div>
  );
};

export default KhanmigoChat; 