import React from 'react';
import { CheckCircle } from 'lucide-react';

export interface CharacterCardProps {
  avatar: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  isSelected: boolean;
  isAnalyzed: boolean;
  onClick: () => void;
  layout?: 'normal' | 'compact';
  customTraits?: {
    strengths: string[];
    weaknesses: string[];
  };
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  avatar,
  name,
  strengths,
  weaknesses,
  isSelected,
  onClick,
  isAnalyzed = false,
  layout = 'normal',
  customTraits = { strengths: [], weaknesses: [] }
}) => {
  // 计算已发现的特质总数
  const customTraitsCount = 
    (customTraits.strengths ? customTraits.strengths.length : 0) + 
    (customTraits.weaknesses ? customTraits.weaknesses.length : 0);
    
  return (
    <div 
      className={`relative flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all duration-300 border-2 ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
          : 'border-transparent hover:bg-indigo-50/30 bg-white'
      }`}
      onClick={onClick}
    >
      {/* 分析完成标记 */}
      {isAnalyzed && (
        <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm">
          ✓
        </div>
      )}
      
      <div className={`w-16 h-16 rounded-full mb-2 flex items-center justify-center overflow-hidden ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}>
        <img src={avatar} alt={name} className="w-full h-full object-cover" />
      </div>
      
      <div className="text-center mb-1">
        <div className="font-medium text-gray-800">{name}</div>
        <div className="text-xs text-gray-500">
          {customTraitsCount > 0 ? `已发现${customTraitsCount}个特质` : '点击分析人物'}
        </div>
      </div>
      
      <div className="text-center">
        <div 
          className={`text-[10px] flex gap-0.5 transition-opacity duration-300 ${
            isSelected ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {isSelected && (
            <div className="w-full flex mt-1 justify-center">
              <div className="w-5 h-1 bg-indigo-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard; 