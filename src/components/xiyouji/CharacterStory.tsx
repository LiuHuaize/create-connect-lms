import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AIChatBox, { ChatMessage } from './AIChatBox';
import { sendMessageToAI, formatMessages } from '@/services/aiService';

interface Story {
  title: string;
  content: string;
}

interface CharacterStoryProps {
  stories: Story[];
  characterName: string;
  onTraitDiscovered?: (trait: string) => void;
}

const CharacterStory: React.FC<CharacterStoryProps> = ({
  stories,
  characterName,
  onTraitDiscovered
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai' as 'ai', content: `你好！我是你的AI助手。让我们一起分析《${stories[currentPage]?.title}》中${characterName}表现出的性格特质。你有什么想法？` }
  ]);
  const [discoveredTraits, setDiscoveredTraits] = useState<string[]>([]);
  
  const totalStories = stories.length;
  
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalStories - 1 ? prev + 1 : prev));
  };

  // 当切换故事时，重置聊天
  useEffect(() => {
    setChatMessages([
      { role: 'ai' as 'ai', content: `你好！我是你的AI助手。让我们一起分析《${stories[currentPage]?.title}》中${characterName}表现出的性格特质。你有什么想法？` }
    ]);
  }, [currentPage, characterName, stories]);
  
  const handleSendMessage = async (message: string) => {
    // 添加用户消息
    const updatedMessages = [...chatMessages, { role: 'user' as 'user', content: message }];
    setChatMessages(updatedMessages);
    
    try {
      // 准备发送给AI的消息，包括系统提示
      const aiMessages = [
        { 
          role: 'system' as const, 
          content: `你是一位文学分析专家，专注于分析《西游记》中${characterName}的性格特质。
当前正在分析的故事是《${stories[currentPage]?.title}》。
故事内容：${stories[currentPage]?.content}

请帮助用户分析${characterName}在这个故事中表现出的性格特质。
你的分析应该基于故事中的具体情节和${characterName}的言行。
如果用户提到了某些特质，就分析这些特质是否在故事中有体现，并给出具体的例子。
可能的性格特质包括但不限于：勇敢、聪明、忠诚、固执、善良、坚持、谨慎、贪婪、自私、自信、谦虚等。` 
        },
        ...formatMessages(updatedMessages)
      ];
      
      // 调用API获取回复
      const aiResponse = await sendMessageToAI(aiMessages);
      
      // 添加AI回复
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
      
      // 分析AI回复中提到的特质
      const traits = analyzeTraits(aiResponse);
      
      // 添加新发现的特质
      if (traits.length > 0) {
        const newTraits = traits.filter(trait => !discoveredTraits.includes(trait));
        if (newTraits.length > 0) {
          setDiscoveredTraits(prev => [...prev, ...newTraits]);
          
          // 通知父组件有新特质被发现
          newTraits.forEach(trait => {
            onTraitDiscovered && onTraitDiscovered(trait);
          });
        }
      }
    } catch (error) {
      console.error('获取AI回复失败:', error);
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        content: '抱歉，我在分析故事时遇到了问题。请稍后再试。' 
      }]);
    }
  };
  
  // 简单分析文本中可能提到的特质
  const analyzeTraits = (text: string): string[] => {
    // 预设一些可能的性格特质关键词
    const possibleTraits = [
      '勇敢', '聪明', '忠诚', '固执', '善良', '坚持', '谨慎', '贪婪', '自私', 
      '自信', '谦虚', '正直', '诚实', '谨慎', '冲动', '耐心', '暴躁', '温柔',
      '机智', '傲慢', '叛逆', '踏实', '负责', '轻信', '多疑', '乐观', '悲观',
      '贪心', '慷慨', '胆小', '大胆', '坚强', '软弱', '细心', '粗心'
    ];
    
    // 在用户输入中查找这些特质
    return possibleTraits.filter(trait => text.includes(trait));
  };
  
  const currentStory = stories[currentPage];
  
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-indigo-700 flex items-center justify-between">
        <span>{characterName}的故事</span>
        <div className="text-sm font-normal text-gray-500">
          {currentPage + 1} / {totalStories}
        </div>
      </h3>
      
      {/* 故事内容区域 */}
      <div className="relative bg-white rounded-2xl border border-indigo-100 shadow-md overflow-hidden min-h-[300px]">
        {/* 故事标题 */}
        <div className="p-4 bg-gradient-to-r from-indigo-100 to-indigo-50 border-b border-indigo-100">
          <h4 className="font-bold text-lg text-indigo-800">{currentStory.title}</h4>
        </div>
        
        {/* 故事内容 */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed">{currentStory.content}</p>
        </div>
        
        {/* 页码和翻页控制 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent py-4 px-6 flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="h-8 flex items-center gap-1 text-xs"
          >
            <ChevronLeft size={14} />
            上一个故事
          </Button>
          
          <div className="flex gap-1">
            {stories.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPage 
                    ? 'bg-indigo-500 scale-125' 
                    : 'bg-indigo-200 hover:bg-indigo-300'
                }`}
                aria-label={`跳转到故事 ${index + 1}`}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalStories - 1}
            className="h-8 flex items-center gap-1 text-xs"
          >
            下一个故事
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700 border border-amber-100 shadow-sm flex justify-between items-center">
        <p>✨ 思考: 这个故事展示了{characterName}的哪些性格特征？</p>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
          onClick={() => setShowChat(!showChat)}
        >
          <MessageCircle size={16} className="mr-1" /> 
          {showChat ? '收起对话' : '与AI讨论'}
        </Button>
      </div>
      
      {/* 发现的特质展示 */}
      {discoveredTraits.length > 0 && (
        <div className="p-4 bg-indigo-50 rounded-xl shadow-sm border border-indigo-100">
          <h4 className="text-sm font-medium text-indigo-800 mb-2">已发现的性格特质:</h4>
          <div className="flex flex-wrap gap-2">
            {discoveredTraits.map((trait, index) => (
              <span key={index} className="px-3 py-1 bg-white text-indigo-700 text-xs rounded-full border border-indigo-200">
                {trait}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* AI聊天区域 */}
      {showChat && (
        <div className="bg-white rounded-xl border border-indigo-100 shadow-md overflow-hidden h-64">
          <AIChatBox 
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            characterName={characterName}
            aiName={`${characterName}故事分析助手`}
            placeholder={`分析${characterName}在故事中的特质...`}
          />
        </div>
      )}
    </div>
  );
};

export default function CharacterStoryWithStyle(props: CharacterStoryProps) {
  return (
    <CharacterStory {...props} />
  );
} 