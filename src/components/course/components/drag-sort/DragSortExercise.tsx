import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { DragSortContent, DragSortMapping, Lesson } from '@/types/course';
import DraggableItem from './DraggableItem';
import CategoryDropZone from './CategoryDropZone';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CornerUpLeft, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DragSortExerciseProps {
  lesson: Lesson;
  onComplete?: (isCorrect: boolean, mappings: DragSortMapping[]) => void;
  isPreview?: boolean;
}

const DragSortExercise: React.FC<DragSortExerciseProps> = ({ 
  lesson, 
  onComplete,
  isPreview = false
}) => {
  // 提取课时content中的拖拽分类数据
  const content = lesson.content as unknown as DragSortContent;

  // 当前用户的映射状态
  const [currentMappings, setCurrentMappings] = useState<DragSortMapping[]>([]);
  
  // 操作历史记录
  const [history, setHistory] = useState<DragSortMapping[][]>([]);
  
  // 判断项目是否已被放置在某个分类中
  const isItemPlaced = (itemId: string) => {
    return currentMappings.some(mapping => mapping.itemId === itemId);
  };

  // 获取项目当前所在的分类ID
  const getItemCategory = (itemId: string) => {
    const mapping = currentMappings.find(m => m.itemId === itemId);
    return mapping ? mapping.categoryId : null;
  };

  // 设置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 最小拖拽距离，避免意外触发
      }
    })
  );

  // 处理拖拽结束事件
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // 如果没有拖到有效的放置区域上，则不执行任何操作
    if (!over) return;
    
    const itemId = active.id as string;
    const categoryId = over.id as string;
    
    // 保存当前状态到历史记录
    setHistory(prev => [...prev, [...currentMappings]]);
    
    // 更新映射关系
    setCurrentMappings(prev => {
      // 移除该项目的旧映射关系（如果有）
      const filtered = prev.filter(mapping => mapping.itemId !== itemId);
      
      // 添加新的映射关系
      return [...filtered, { itemId, categoryId }];
    });
  };
  
  // 撤销上一步操作
  const handleUndo = () => {
    if (history.length === 0) {
      toast.info('没有可撤销的操作');
      return;
    }
    
    const lastState = history[history.length - 1];
    setCurrentMappings(lastState);
    setHistory(prev => prev.slice(0, -1));
    toast.success('已撤销上一步操作');
  };

  // 检查答案是否正确
  const checkAnswer = () => {
    // 首先检查是否所有项目都已放置
    if (currentMappings.length !== content.items.length) {
      toast.error('请将所有项目拖放到相应的分类中');
      return;
    }
    
    // 检查每个映射是否正确
    const isAllCorrect = content.correctMappings.every(correctMapping => {
      return currentMappings.some(
        userMapping => 
          userMapping.itemId === correctMapping.itemId && 
          userMapping.categoryId === correctMapping.categoryId
      );
    });
    
    if (isAllCorrect) {
      toast.success('恭喜！所有分类都正确！');
    } else {
      toast.error('有些分类不正确，请再试一次');
    }
    
    // 如果有回调函数，则调用它
    if (onComplete) {
      onComplete(isAllCorrect, currentMappings);
    }
  };

  // 重置操作
  const handleReset = () => {
    // 保存当前状态到历史记录
    if (currentMappings.length > 0) {
      setHistory(prev => [...prev, [...currentMappings]]);
    }
    setCurrentMappings([]);
    toast.info('已重置所有分类');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-sm">
      {/* 介绍文字和操作说明 */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2">分类练习</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <HelpCircle size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>拖动左侧项目到右侧对应分类中。如需撤销操作，点击右上角的撤销按钮。</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">
          {content.introduction}
        </div>
      </div>
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-6">
          {/* 可拖拽项目区域 */}
          <div className="w-full md:w-1/2">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 h-full">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">待分类项目</h4>
                {currentMappings.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleUndo} 
                          disabled={history.length === 0}
                          className="h-8 w-8 p-0"
                        >
                          <CornerUpLeft size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>撤销上一步操作</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {content.items.map(item => (
                  <DraggableItem 
                    key={item.id} 
                    item={item} 
                    isPlaced={isItemPlaced(item.id)}
                  />
                ))}
              </div>
              {content.items.length > 0 && content.items.every(item => isItemPlaced(item.id)) && (
                <div className="mt-4 text-center text-sm text-gray-500">
                  所有项目已放置完成
                </div>
              )}
            </div>
          </div>
          
          {/* 分类区域 */}
          <div className="w-full md:w-1/2">
            <div className="h-full">
              <h4 className="font-medium mb-3 text-gray-700">分类区域</h4>
              <div className="space-y-4">
                {content.categories.map(category => (
                  <CategoryDropZone 
                    key={category.id} 
                    category={category}
                    items={content.items.filter(item => 
                      getItemCategory(item.id) === category.id
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DndContext>
      
      {/* 控制按钮 */}
      {!isPreview && (
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleReset} className="text-gray-600">
            重置
          </Button>
          <Button onClick={checkAnswer} className="bg-blue-600 hover:bg-blue-700 text-white">
            提交答案
          </Button>
        </div>
      )}
    </div>
  );
};

export default DragSortExercise; 