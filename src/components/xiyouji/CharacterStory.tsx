import React from 'react';

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
  return (
    <div className="space-y-6">
      <h3 className="text-xl md:text-2xl font-semibold text-indigo-700">
        {characterName}的故事
      </h3>
      
      {/* 显示所有故事 */}
      <div className="space-y-6">
        {stories.map((story, index) => (
          <div 
            key={index}
            className="bg-indigo-50/80 rounded-xl border border-indigo-200/80 overflow-hidden transition-all duration-300 ease-in-out shadow-sm hover:shadow-md"
          >
            <div className="p-4 border-b border-indigo-100 bg-indigo-100/60">
              <h4 className="font-bold text-base md:text-lg text-indigo-800">{story.title}</h4>
            </div>
            <div className="p-5">
              <p className="text-gray-700 text-sm md:text-base leading-relaxed">{story.content}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-amber-50 rounded-xl text-sm md:text-base text-amber-700 border border-amber-100 shadow-sm">
        <p>✨ 思考: 这些故事展示了{characterName}的哪些性格特征？</p>
      </div>
    </div>
  );
};

export default function CharacterStoryWithStyle(props: CharacterStoryProps) {
  return (
    <CharacterStory {...props} />
  );
} 