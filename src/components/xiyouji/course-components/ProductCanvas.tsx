import React, { useState } from 'react';
import { PlusCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Character } from './CharacterAnalysis';

interface ProductCanvasProps {
  selectedCharacter: Character;
  showNeeds: boolean;
  characterNeeds: string[];
  productIdeas: string[];
  selectedIdeas: string[];
  productCanvas: {
    title: string;
    problem: string;
    solution: string;
    uniqueValue: string;
    userGroups: string;
    keyFeatures: string;
  };
  onAddIdea: (idea: string) => void;
  onToggleIdea: (idea: string) => void;
  onCanvasChange: (field: string, value: string) => void;
}

const ProductCanvas: React.FC<ProductCanvasProps> = ({
  selectedCharacter,
  showNeeds,
  characterNeeds,
  productIdeas,
  selectedIdeas,
  productCanvas,
  onAddIdea,
  onToggleIdea,
  onCanvasChange
}) => {
  const [newIdea, setNewIdea] = useState('');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 col-span-1">
          <h3 className="text-lg font-medium text-indigo-800 mb-3">用户需求分析</h3>
          <p className="text-sm text-gray-600 mb-3">
            根据{selectedCharacter.name}的特点，我们可以识别出以下潜在需求：
          </p>
          
          <div className="space-y-4">
            {showNeeds ? (
              <div className="flex flex-col gap-2">
                {characterNeeds.map((need, index) => (
                  <Badge key={index} className="justify-start text-left py-2 px-3">
                    {need}
                  </Badge>
                ))}
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => onCanvasChange('showNeeds', 'true')}
              >
                分析需求
              </Button>
            )}
          </div>
        </Card>
        
        <Card className="p-4 col-span-1">
          <h3 className="text-lg font-medium text-indigo-800 mb-3">产品创意</h3>
          <p className="text-sm text-gray-600 mb-3">
            根据需求分析，提出产品创意：
          </p>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {productIdeas.map((idea, index) => (
                <Badge 
                  key={index} 
                  variant={selectedIdeas.includes(idea) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onToggleIdea(idea)}
                >
                  {idea}
                  {selectedIdeas.includes(idea) && (
                    <Check size={14} className="ml-1" />
                  )}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2 mt-2">
              <Input 
                placeholder="添加新创意..." 
                value={newIdea}
                onChange={(e) => setNewIdea(e.target.value)}
                className="text-sm"
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  if (newIdea.trim()) {
                    onAddIdea(newIdea);
                    setNewIdea('');
                  }
                }}
              >
                <PlusCircle size={18} />
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 col-span-1">
          <h3 className="text-lg font-medium text-indigo-800 mb-3">选定创意</h3>
          <p className="text-sm text-gray-600 mb-3">
            已选定的产品创意:
          </p>
          
          <div className="flex flex-col gap-2">
            {selectedIdeas.length > 0 ? (
              selectedIdeas.map((idea, index) => (
                <Badge key={index} className="justify-start text-left py-2 px-3">
                  {idea}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">请从左侧选择产品创意</p>
            )}
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold text-indigo-800 mb-4">产品画布</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">产品名称</label>
            <Input 
              placeholder="为你的产品起个名字..." 
              value={productCanvas.title}
              onChange={(e) => onCanvasChange('title', e.target.value)}
              className="mb-4"
            />
            
            <label className="block text-sm font-medium mb-2">解决的问题</label>
            <Textarea 
              placeholder="描述这个产品解决的主要问题..." 
              value={productCanvas.problem}
              onChange={(e) => onCanvasChange('problem', e.target.value)}
              className="mb-4 min-h-[100px]"
            />
            
            <label className="block text-sm font-medium mb-2">解决方案</label>
            <Textarea 
              placeholder="描述产品如何解决这个问题..." 
              value={productCanvas.solution}
              onChange={(e) => onCanvasChange('solution', e.target.value)}
              className="mb-4 min-h-[100px]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">独特价值</label>
            <Textarea 
              placeholder="产品的独特价值是什么？" 
              value={productCanvas.uniqueValue}
              onChange={(e) => onCanvasChange('uniqueValue', e.target.value)}
              className="mb-4 min-h-[100px]"
            />
            
            <label className="block text-sm font-medium mb-2">用户群体</label>
            <Textarea 
              placeholder="描述主要的用户群体..." 
              value={productCanvas.userGroups}
              onChange={(e) => onCanvasChange('userGroups', e.target.value)}
              className="mb-4 min-h-[100px]"
            />
            
            <label className="block text-sm font-medium mb-2">核心功能</label>
            <Textarea 
              placeholder="列出产品的主要功能..." 
              value={productCanvas.keyFeatures}
              onChange={(e) => onCanvasChange('keyFeatures', e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductCanvas; 