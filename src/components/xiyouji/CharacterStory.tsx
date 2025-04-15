import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Story {
  title: string;
  content: string;
}

interface CharacterStoryProps {
  stories: Story[];
  characterName: string;
}

const CharacterStory: React.FC<CharacterStoryProps> = ({
  stories,
  characterName
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalStories = stories.length;
  
  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  };
  
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalStories - 1 ? prev + 1 : prev));
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
      
      <div className="p-4 bg-amber-50 rounded-xl text-sm text-amber-700 border border-amber-100 shadow-sm">
        <p>✨ 思考: 这个故事展示了{characterName}的哪些性格特征？</p>
      </div>
    </div>
  );
};

export default function CharacterStoryWithStyle(props: CharacterStoryProps) {
  return (
    <CharacterStory {...props} />
  );
} 