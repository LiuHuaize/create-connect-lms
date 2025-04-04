
import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface CourseAssistantChatProps {
  isChatOpen: boolean;
  setIsChatOpen: (isOpen: boolean) => void;
}

const CourseAssistantChat: React.FC<CourseAssistantChatProps> = ({
  isChatOpen,
  setIsChatOpen
}) => {
  return (
    <div className={`fixed bottom-6 right-6 transition-all duration-300 z-40 ${isChatOpen ? 'w-80 h-96' : 'w-auto h-auto'}`}>
      {isChatOpen ? (
        <Card className="flex flex-col h-full shadow-xl border border-gray-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <MessageSquare size={18} className="mr-2" />
                <CardTitle className="text-base font-medium">课程助手</CardTitle>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              <div className="flex">
                <div className="bg-purple-100 rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm text-purple-800">
                    你好！我是你的学习助手。有什么问题我可以帮忙解答吗？
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="border-t border-gray-200 p-3 bg-white">
            <div className="w-full">
              <div className="flex">
                <input 
                  type="text" 
                  placeholder="输入你的问题..." 
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button className="bg-purple-600 text-white rounded-r-lg px-3 py-2 text-sm hover:bg-purple-700 transition-colors">
                  发送
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 transition-colors">
                  解释这个概念
                </button>
                <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 transition-colors">
                  我需要帮助
                </button>
              </div>
            </div>
          </CardFooter>
        </Card>
      ) : (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="打开聊天助手"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default CourseAssistantChat;
