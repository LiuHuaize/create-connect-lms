import React from 'react';
import { Heart, AlertTriangle } from 'lucide-react';

interface CharacterCardProps {
  avatar: string;
  name: string;
  strengths: string[];
  weaknesses: string[];
  isSelected: boolean;
  onClick: () => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  avatar,
  name,
  strengths,
  weaknesses,
  isSelected,
  onClick
}) => {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer rounded-xl p-3 transition-all duration-300 ${
        isSelected 
          ? 'bg-orange-100 border-2 border-orange-300 shadow-md scale-105' 
          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:scale-105'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`w-20 h-20 overflow-hidden rounded-full mb-2 border-2 ${isSelected ? 'border-orange-400' : 'border-gray-200'}`}>
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
        </div>
        <p className={`font-bold ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>{name}</p>
        
        <div className="mt-3 w-full">
          <div className="flex items-center mb-1">
            <Heart size={14} className="mr-1 text-red-500" />
            <span className="text-xs text-gray-600">优点</span>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {strengths.slice(0, 2).map((strength, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                {strength}
              </span>
            ))}
            {strengths.length > 2 && (
              <span className="text-xs px-1 text-gray-500">+{strengths.length - 2}</span>
            )}
          </div>
          
          <div className="flex items-center mb-1">
            <AlertTriangle size={14} className="mr-1 text-amber-500" />
            <span className="text-xs text-gray-600">弱点</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {weaknesses.slice(0, 2).map((weakness, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
                {weakness}
              </span>
            ))}
            {weaknesses.length > 2 && (
              <span className="text-xs px-1 text-gray-500">+{weaknesses.length - 2}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard; 