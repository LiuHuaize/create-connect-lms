import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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
      }, 300);
    }, 200);
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
      }, 300);
    }, 200);
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {characterName}的故事
        </h3>
        
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">
            {currentStoryIndex + 1}/{stories.length}
          </span>
          
          <button 
            onClick={handlePrevStory}
            disabled={isAnimating || stories.length <= 1}
            className="p-1 rounded-md bg-gray-50 text-gray-500 disabled:opacity-50"
          >
            <ChevronLeft size={14} />
          </button>
          
          <button 
            onClick={handleNextStory}
            disabled={isAnimating || stories.length <= 1}
            className="p-1 rounded-md bg-gray-50 text-gray-500 disabled:opacity-50"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
      {/* 进度条 */}
      <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gray-400 transition-all duration-300 ease-in-out rounded-full"
          style={{ width: progressWidth }}
        ></div>
      </div>
      
      {/* 故事卡片 */}
      <div className="relative overflow-hidden">
        <div 
          className={`bg-gray-50 rounded-lg border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out ${getAnimationClass()}`}
        >
          <div className="p-3 border-b border-gray-100">
            <h4 className="font-medium text-sm text-gray-800">{currentStory.title}</h4>
          </div>
          <div className="p-4">
            <p className="text-gray-600 text-sm leading-relaxed">{currentStory.content}</p>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-gray-50 rounded text-xs text-gray-500 border border-gray-100">
        <p>思考: 这个故事展示了{characterName}的哪些性格特征？</p>
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
          transform: translateX(-5%);
          opacity: 0;
        }
      }
      
      @keyframes slideOutRight {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(5%);
          opacity: 0;
        }
      }
      
      .animate-slide-out-left {
        animation: slideOutLeft 0.2s forwards;
      }
      
      .animate-slide-out-right {
        animation: slideOutRight 0.2s forwards;
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