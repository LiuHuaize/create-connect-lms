import React from 'react';

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
      className={`cursor-pointer rounded-lg p-2 transition-all duration-200 ${
        isSelected 
          ? 'bg-gray-50 border border-gray-200 shadow-sm' 
          : 'bg-white hover:bg-gray-50 border border-gray-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`w-16 h-16 overflow-hidden rounded-full mb-2 ${isSelected ? 'ring-2 ring-gray-300' : ''}`}>
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        </div>
        <p className={`text-sm font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{name}</p>
        
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1"></div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard; 