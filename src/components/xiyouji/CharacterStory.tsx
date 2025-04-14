import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'next' | 'prev'>('next');
  
  const currentStory = stories[currentStoryIndex];
  
  const handleNextStory = () => {
    if (isAnimating || stories.length <= 1) return;
    
    setIsAnimating(true);
    setAnimationDirection('next');
    
    setTimeout(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % stories.length);
      
      // 重置动画状态
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };
  
  const handlePrevStory = () => {
    if (isAnimating || stories.length <= 1) return;
    
    setIsAnimating(true);
    setAnimationDirection('prev');
    
    setTimeout(() => {
      setCurrentStoryIndex((prev) => (prev - 1 + stories.length) % stories.length);
      
      // 重置动画状态
      setTimeout(() => {
        setIsAnimating(false);
      }, 500);
    }, 300);
  };
  
  // 故事翻页动画类名
  const getAnimationClass = () => {
    if (!isAnimating) return 'opacity-100 transform-none';
    
    if (animationDirection === 'next') {
      return 'animate-slide-out-left';
    } else {
      return 'animate-slide-out-right';
    }
  };
  
  // 计算进度条宽度
  const progressWidth = `${((currentStoryIndex + 1) / stories.length) * 100}%`;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-indigo-700 flex items-center">
          <BookOpen size={18} className="mr-2 text-indigo-500" />
          {characterName}的故事
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {currentStoryIndex + 1} / {stories.length}
          </span>
          
          <button 
            onClick={handlePrevStory}
            disabled={isAnimating || stories.length <= 1}
            className="p-1 rounded-full bg-indigo-50 text-indigo-600 disabled:opacity-50 transition-colors hover:bg-indigo-100"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button 
            onClick={handleNextStory}
            disabled={isAnimating || stories.length <= 1}
            className="p-1 rounded-full bg-indigo-50 text-indigo-600 disabled:opacity-50 transition-colors hover:bg-indigo-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300 ease-in-out rounded-full"
          style={{ width: progressWidth }}
        ></div>
      </div>
      
      {/* 故事卡片 */}
      <div className="relative overflow-hidden">
        <Card 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${getAnimationClass()}`}
        >
          <CardContent className="p-0">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-blue-100">
              <h4 className="font-bold text-indigo-700">{currentStory.title}</h4>
            </div>
            <div className="p-5 bg-white">
              <p className="text-gray-700 leading-relaxed">{currentStory.content}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-amber-700 border border-amber-100">
        <p>👉 思考: 这个故事展示了{characterName}的哪些性格特征？这些特征会导致什么样的需求？</p>
      </div>
    </div>
  );
};

// 添加动画样式
const GlobalStyle = () => {
  return (
    <style jsx global>{`
      @keyframes slideOutLeft {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-10%);
          opacity: 0;
        }
      }
      
      @keyframes slideOutRight {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(10%);
          opacity: 0;
        }
      }
      
      @keyframes slideInLeft {
        0% {
          transform: translateX(10%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideInRight {
        0% {
          transform: translateX(-10%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .animate-slide-out-left {
        animation: slideOutLeft 0.3s forwards;
      }
      
      .animate-slide-out-right {
        animation: slideOutRight 0.3s forwards;
      }
      
      .animate-slide-in-left {
        animation: slideInLeft 0.3s forwards;
      }
      
      .animate-slide-in-right {
        animation: slideInRight 0.3s forwards;
      }
    `}</style>
  );
};

export default function CharacterStoryWithStyle(props: CharacterStoryProps) {
  return (
    <>
      <GlobalStyle />
      <CharacterStory {...props} />
    </>
  );
} 