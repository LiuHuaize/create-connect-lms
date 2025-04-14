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
          ? 'bg-indigo-50/80 border border-indigo-200/50 shadow-sm' 
          : 'bg-white hover:bg-gray-50/80 border border-gray-100'
      }`}
    >
      <div className="flex flex-col items-center">
        <div className={`w-14 h-14 overflow-hidden rounded-full mb-1.5 ${isSelected ? 'ring-2 ring-indigo-300' : ''}`}>
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
          />
        </div>
        <p className={`text-xs font-medium ${isSelected ? 'text-indigo-800' : 'text-gray-600'}`}>{name}</p>
        
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-0.5"></div>
        )}
      </div>
    </div>
  );
};

export default CharacterCard; 