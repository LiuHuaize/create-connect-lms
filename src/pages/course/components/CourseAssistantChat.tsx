import React, { useState } from 'react';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CourseAssistantChatProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
}

const CourseAssistantChat: React.FC<CourseAssistantChatProps> = ({
  isChatOpen,
  setIsChatOpen
}) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 提交消息逻辑将在此处添加
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full mr-3">
            <Sparkles size={18} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 text-sm">学习助手</h3>
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
        <div className="flex">
          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-2xl p-3 max-w-[80%] shadow-sm">
            <p className="text-sm text-slate-800 dark:text-slate-200">
              你好！我是你的学习助手。有什么问题我可以帮忙解答吗？
            </p>
          </div>
        </div>
        
        {/* 用户消息示例 */}
        <div className="flex justify-end">
          <div className="bg-blue-500 rounded-2xl p-3 max-w-[80%] shadow-sm">
            <p className="text-sm text-white">
              我想了解一下这个课程的难度如何？
            </p>
          </div>
        </div>
        
        {/* 助手消息示例 */}
        <div className="flex">
          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-2xl p-3 max-w-[80%] shadow-sm">
            <p className="text-sm text-slate-800 dark:text-slate-200">
              这个课程设计为初级到中级水平，每个模块都有详细的解释和练习。如果你已经有一些基础知识，应该能够轻松跟上。如果遇到任何困难，随时可以向我提问！
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入你的问题..." 
              className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus-visible:ring-blue-500"
            />
            <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              <Send size={16} />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-start">
            <Button variant="outline" size="sm" className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
              解释这个概念
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
              我需要帮助
            </Button>
            <Button variant="outline" size="sm" className="text-xs rounded-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
              推荐学习资源
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseAssistantChat;
