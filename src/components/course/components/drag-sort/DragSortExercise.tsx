import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { DragSortContent, DragSortMapping, Lesson } from '@/types/course';
import DraggableItem from './DraggableItem';
import CategoryDropZone from './CategoryDropZone';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CornerUpLeft, HelpCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
  
  // 添加提交状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // 添加评分结果状态
  const [evaluationResult, setEvaluationResult] = useState<{
    correctCount: number;
    totalCount: number;
    accuracy: number;
    correctMappings: Record<string, boolean>;
  } | null>(null);
  
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
    
    // 重置已提交状态，允许用户重新提交
    if (hasSubmitted) {
      setHasSubmitted(false);
      setEvaluationResult(null);
    }
  };

  // 撤销上一步操作
  const handleUndo = () => {
    if (history.length === 0) return;
    
    // 获取最近的历史状态
    const lastState = history[history.length - 1];
    
    // 恢复到历史状态
    setCurrentMappings(lastState);
    
    // 从历史记录中移除该状态
    setHistory(prev => prev.slice(0, -1));
    
    // 重置已提交状态，允许用户重新提交
    if (hasSubmitted) {
      setHasSubmitted(false);
      setEvaluationResult(null);
    }
  };

  // 重置所有分类
  const handleReset = () => {
    setCurrentMappings([]);
    setHistory([]);
    
    // 重置已提交状态，允许用户重新提交
    if (hasSubmitted) {
      setHasSubmitted(false);
      setEvaluationResult(null);
    }
    
    toast.info('已重置所有分类。');
  };

  // 检查答案并完成练习
  const checkAnswer = () => {
    console.log('开始检查答案');
    
    // 如果正在提交，不要重复处理
    if (isSubmitting) {
      console.log('正在提交中，请稍候...');
      return;
    }
    
    // 如果已经提交过，不要重复处理
    if (hasSubmitted) {
      console.log('已经提交过，不需要重复提交');
      toast.info('答案已提交，请继续下一步');
      return;
    }
    
    // 如果没有完成所有分类，则提示用户
    if (content.items.some(item => !isItemPlaced(item.id))) {
      console.log('未完成所有分类');
      toast.warning('请先完成所有项目的分类');
      return;
    }
    
    // 开始提交
    setIsSubmitting(true);
    
    try {
      console.log('正在评估答案...');
      
      // 创建结果映射表，记录每个项目分类是否正确
      const correctMappings: Record<string, boolean> = {};
      
      // 判断每个项目的分类是否正确
      const correctCount = currentMappings.filter(mapping => {
        // 从正确答案中查找
        const correctMapping = content.correctMappings.find(correct => 
          correct.itemId === mapping.itemId
        );
        
        // 验证此项目的分类是否正确
        const isCorrect = correctMapping && correctMapping.categoryId === mapping.categoryId;
        
        // 记录每个项目的正确状态
        correctMappings[mapping.itemId] = isCorrect;
        
        return isCorrect;
      }).length;
      
      // 计算正确率
      const accuracy = correctCount / content.items.length;
      console.log(`正确率: ${accuracy * 100}%, 正确数: ${correctCount}/${content.items.length}`);
      
      // 保存评估结果
      setEvaluationResult({
        correctCount,
        totalCount: content.items.length,
        accuracy,
        correctMappings
      });
      
      // 根据正确率显示不同的消息
      if (accuracy === 1) {
        toast.success('恭喜！所有分类都正确！');
      } else if (accuracy >= 0.8) {
        toast.success(`做得不错！你有 ${correctCount} 个分类是正确的，共 ${content.items.length} 个。`);
      } else if (accuracy >= 0.6) {
        toast.info(`有 ${correctCount} 个分类是正确的，共 ${content.items.length} 个。再试一次吧！`);
      } else {
        toast.error(`只有 ${correctCount} 个分类是正确的，共 ${content.items.length} 个。请检查并再试一次。`);
      }
      
      // 标记为已提交
      setHasSubmitted(true);
      
      // 触发完成回调
      if (onComplete) {
        console.log('调用onComplete回调函数...');
        
        try {
          onComplete(accuracy === 1, currentMappings);
          console.log('onComplete回调完成');
        } catch (error) {
          console.error('执行onComplete回调时出错:', error);
          toast.error('提交答案时发生错误，请重试');
        }
      } else {
        console.log('未提供onComplete回调');
      }
    } catch (error) {
      console.error('检查答案时出错:', error);
      toast.error('检查答案时发生错误，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 获取项目所在分类是否正确
  const isItemCorrectlyMapped = (itemId: string) => {
    if (!evaluationResult || !hasSubmitted) return null;
    return evaluationResult.correctMappings[itemId];
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 bg-gradient-to-b from-white to-[#f2f7e9] rounded-xl shadow-sm">
      {/* 介绍文字和操作说明 */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold mb-2 text-[#5c7744]">分类练习</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2 text-[#5c7744]">
                  <HelpCircle size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>将上方项目拖动到下方对应的分类中。如需撤销操作，点击右上角的撤销按钮。</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="text-gray-700 bg-white p-4 rounded-lg border border-[#d5e0c0] shadow-sm">
          {content.introduction}
        </div>
      </div>
      
      {/* 评估结果显示 */}
      {hasSubmitted && evaluationResult && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${
          evaluationResult.accuracy === 1 
            ? 'border-green-400 bg-green-50' 
            : evaluationResult.accuracy >= 0.8
              ? 'border-blue-400 bg-blue-50'
              : evaluationResult.accuracy >= 0.6
                ? 'border-amber-400 bg-amber-50'
                : 'border-red-400 bg-red-50'
        }`}>
          <div className="flex items-center mb-2">
            {evaluationResult.accuracy === 1 ? (
              <CheckCircle className="text-green-600 mr-2" size={20} />
            ) : (
              <AlertCircle className={`${
                evaluationResult.accuracy >= 0.8 
                  ? 'text-blue-600' 
                  : evaluationResult.accuracy >= 0.6
                    ? 'text-amber-600'
                    : 'text-red-600'
              } mr-2`} size={20} />
            )}
            <h3 className="font-medium text-lg">
              {evaluationResult.accuracy === 1 
                ? '恭喜！所有分类都正确！' 
                : `你的得分：${Math.round(evaluationResult.accuracy * 100)}%`}
            </h3>
          </div>
          <p className="mb-2">
            正确答案数量：<span className="font-medium">{evaluationResult.correctCount}</span> / {evaluationResult.totalCount}
          </p>
          {evaluationResult.accuracy < 1 && (
            <p className="text-sm italic mt-1">
              提示：请查看每个分类中项目旁的图标，以了解哪些答案是正确的，哪些需要修改。
            </p>
          )}
        </div>
      )}
      
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-6">
          {/* 可拖拽项目区域 - 上方 */}
          <div className="w-full">
            <div className="bg-white p-4 rounded-lg border-2 border-[#d5e0c0] shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-[#5c7744]">待分类项目</h4>
                {currentMappings.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleUndo} 
                          disabled={history.length === 0 || isSubmitting}
                          className="h-8 w-8 p-0 border-[#d5e0c0] text-[#5c7744]"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {content.items.map(item => (
                  <DraggableItem 
                    key={item.id} 
                    item={item} 
                    isPlaced={isItemPlaced(item.id)}
                  />
                ))}
              </div>
              {content.items.length > 0 && content.items.every(item => isItemPlaced(item.id)) && (
                <div className="mt-4 text-center text-sm text-[#5c7744] font-medium">
                  所有项目已放置完成 ✓
                </div>
              )}
            </div>
          </div>
          
          {/* 分类区域 - 下方 */}
          <div className="w-full">
            <div>
              <h4 className="font-medium mb-3 text-[#5c7744]">分类区域</h4>
              <div className="flex flex-wrap gap-4 justify-center">
                {content.categories.map(category => (
                  <CategoryDropZone 
                    key={category.id} 
                    category={category}
                    items={content.items.filter(item => 
                      getItemCategory(item.id) === category.id
                    ).map(item => ({
                      ...item,
                      isCorrect: isItemCorrectlyMapped(item.id)
                    }))}
                    showCorrectness={hasSubmitted}
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
          <Button 
            variant="outline" 
            onClick={handleReset} 
            className="border-[#d5e0c0] text-[#5c7744] hover:bg-[#f2f7e9]"
            disabled={isSubmitting || currentMappings.length === 0}
          >
            重置
          </Button>
          <Button 
            onClick={checkAnswer} 
            className="bg-[#7d9d60] hover:bg-[#6c8a52] text-white"
            disabled={isSubmitting || !content.items.every(item => isItemPlaced(item.id))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : hasSubmitted ? (
              '已提交答案'
            ) : (
              '提交答案'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DragSortExercise; 