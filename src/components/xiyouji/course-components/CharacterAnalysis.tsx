import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import CharacterCard from '../CharacterCard';
import AIChatBox, { ChatMessage } from '../AIChatBox';
import CharacterStoryWithStyle from '../CharacterStory';

// 人物数据类型
export interface Character {
  id: string;
  name: string;
  avatar: string;
  strengths: string[];
  weaknesses: string[];
  stories: { title: string; content: string }[];
  needs: string[];
}

// 人物特质类型
export interface CharacterTraits {
  [key: string]: {
    strengths: string[];
    weaknesses: string[];
  }
}

interface CharacterAnalysisProps {
  characters: Character[];
  characterTraits: CharacterTraits;
  selectedCharacter: Character;
  aiResponses: ChatMessage[];
  analyzedCharacters: {[key: string]: boolean};
  onSelectCharacter: (character: Character) => void;
  onSendMessage: (message: string) => Promise<void>;
  onTraitDiscovered: (trait: string, type: 'strength' | 'weakness') => void;
  onAddTrait: (type: 'strength' | 'weakness') => void;
  onSaveCharacterAnalysis: (characterId: string, characterName: string) => Promise<void>;
}

const CharacterAnalysis: React.FC<CharacterAnalysisProps> = ({
  characters,
  characterTraits,
  selectedCharacter,
  aiResponses,
  analyzedCharacters,
  onSelectCharacter,
  onSendMessage,
  onTraitDiscovered,
  onAddTrait,
  onSaveCharacterAnalysis
}) => {
  const [newTrait, setNewTrait] = useState('');

  const hasEnoughTraits = (characterId: string) => {
    return (
      characterTraits[characterId]?.strengths.length > 0 && 
      characterTraits[characterId]?.weaknesses.length > 0
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            name={character.name}
            avatar={character.avatar}
            strengths={characterTraits[character.id]?.strengths || []}
            weaknesses={characterTraits[character.id]?.weaknesses || []}
            isComplete={analyzedCharacters[character.id]}
            onSelect={() => onSelectCharacter(character)}
            isSelected={selectedCharacter.id === character.id}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm md:col-span-2">
          <Tabs defaultValue="analysis">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="analysis">人物特点</TabsTrigger>
              <TabsTrigger value="traits-panel">特点标记</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="pb-2">
              {renderCharacterTraitsPanel()}
            </TabsContent>
            
            <TabsContent value="traits-panel">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-2">优点:</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterTraits[selectedCharacter.id]?.strengths.map((trait, index) => (
                      <Badge key={index} variant="success">{trait}</Badge>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 gap-1">
                          <PlusCircle size={14} /> 添加
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>添加一个优点</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="输入优点..." 
                            value={newTrait}
                            onChange={(e) => setNewTrait(e.target.value)}
                          />
                          <Button 
                            onClick={() => {
                              if (newTrait.trim()) {
                                onTraitDiscovered(newTrait, 'strength');
                                setNewTrait('');
                              }
                            }}
                          >
                            添加
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm mb-2">缺点:</h3>
                  <div className="flex flex-wrap gap-2">
                    {characterTraits[selectedCharacter.id]?.weaknesses.map((trait, index) => (
                      <Badge key={index} variant="destructive">{trait}</Badge>
                    ))}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-6 gap-1">
                          <PlusCircle size={14} /> 添加
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>添加一个缺点</DialogTitle>
                        </DialogHeader>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            placeholder="输入缺点..." 
                            value={newTrait}
                            onChange={(e) => setNewTrait(e.target.value)}
                          />
                          <Button 
                            onClick={() => {
                              if (newTrait.trim()) {
                                onTraitDiscovered(newTrait, 'weakness');
                                setNewTrait('');
                              }
                            }}
                          >
                            添加
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    className="w-full mt-2" 
                    size="sm"
                    disabled={!hasEnoughTraits(selectedCharacter.id) || analyzedCharacters[selectedCharacter.id]}
                    onClick={() => onSaveCharacterAnalysis(selectedCharacter.id, selectedCharacter.name)}
                  >
                    {analyzedCharacters[selectedCharacter.id] 
                      ? '已完成分析' 
                      : '保存并标记为已完成'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="md:row-span-2">
          <CharacterStoryWithStyle 
            character={selectedCharacter} 
            highlightOnHover={true}
          />
        </div>
        
        <div className="md:col-span-2 h-[500px]">
          <AIChatBox
            messages={aiResponses}
            onSendMessage={onSendMessage}
            placeholder={`请告诉我，从故事中你发现了${selectedCharacter.name}哪些性格特点？`}
            className="h-full"
          />
        </div>
      </div>
    </>
  );

  function renderCharacterTraitsPanel() {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-sm mb-2">预设优点:</h3>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              <div className="flex flex-wrap gap-2">
                {selectedCharacter.strengths.map((trait, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-green-50"
                    onClick={() => onTraitDiscovered(trait, 'strength')}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-2">预设缺点:</h3>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              <div className="flex flex-wrap gap-2">
                {selectedCharacter.weaknesses.map((trait, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="cursor-pointer hover:bg-red-50"
                    onClick={() => onTraitDiscovered(trait, 'weakness')}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="font-medium text-sm mb-2">已发现优点:</h3>
            <div className="flex flex-wrap gap-2 min-h-[60px] border rounded-md p-2">
              {characterTraits[selectedCharacter.id]?.strengths.map((trait, index) => (
                <Badge key={index} variant="success">{trait}</Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 rounded-full"
                onClick={() => onAddTrait('strength')}
              >
                <PlusCircle size={14} />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-2">已发现缺点:</h3>
            <div className="flex flex-wrap gap-2 min-h-[60px] border rounded-md p-2">
              {characterTraits[selectedCharacter.id]?.weaknesses.map((trait, index) => (
                <Badge key={index} variant="destructive">{trait}</Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 rounded-full"
                onClick={() => onAddTrait('weakness')}
              >
                <PlusCircle size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CharacterAnalysis; 