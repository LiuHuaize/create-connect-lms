import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SeriesQuestion } from '@/types/course';
import { Plus, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import SortableQuestionItem from './SortableQuestionItem';

interface SeriesQuestionListProps {
  questions: SeriesQuestion[];
  onChange: (questions: SeriesQuestion[]) => void;
  questionnaireId?: string;
}

const SeriesQuestionList: React.FC<SeriesQuestionListProps> = ({
  questions,
  onChange,
  questionnaireId
}) => {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 添加新问题
  const addQuestion = () => {
    const newQuestion: SeriesQuestion = {
      id: uuidv4(),
      questionnaire_id: questionnaireId || '',
      title: '',
      question_text: '',
      order_index: questions.length + 1,
      required: true,
      placeholder_text: '在此输入你的答案...'
    };

    const updatedQuestions = [...questions, newQuestion];
    onChange(updatedQuestions);
    setEditingQuestionId(newQuestion.id);
    toast.success('已添加新问题');
  };

  // 保存问题
  const handleSaveQuestion = (updatedQuestion: SeriesQuestion) => {
    const updatedQuestions = questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    onChange(updatedQuestions);
    setEditingQuestionId(null);
  };

  // 删除问题
  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, order_index: index + 1 })); // 重新排序
    
    onChange(updatedQuestions);
    setEditingQuestionId(null);
  };

  // 开始编辑问题
  const handleEditQuestion = (questionId: string) => {
    setEditingQuestionId(questionId);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    // 如果是新添加的问题且没有标题，则删除
    const editingQuestion = questions.find(q => q.id === editingQuestionId);
    if (editingQuestion && !editingQuestion.title.trim()) {
      handleDeleteQuestion(editingQuestionId!);
    } else {
      setEditingQuestionId(null);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);

      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex)
        .map((question, index) => ({
          ...question,
          order_index: index + 1
        }));

      onChange(reorderedQuestions);
      toast.success('问题顺序已更新');
    }
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">问题列表</h3>
          <p className="text-sm text-gray-600">
            共 {questions.length} 个问题，拖拽可调整顺序
          </p>
        </div>
        <Button onClick={addQuestion} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          添加问题
        </Button>
      </div>

      {/* 问题列表 */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">暂无问题</h4>
          <p className="text-gray-600 mb-4">
            开始创建你的第一个问题吧！
          </p>
          <Button onClick={addQuestion} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            添加问题
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext 
            items={questions.map(q => q.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {questions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id}
                  question={question}
                  questionIndex={index}
                  isEditing={editingQuestionId === question.id}
                  onSave={handleSaveQuestion}
                  onDelete={handleDeleteQuestion}
                  onEdit={handleEditQuestion}
                  onCancel={handleCancelEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* 底部添加按钮 */}
      {questions.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={addQuestion} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            添加问题
          </Button>
        </div>
      )}

      {/* 提示信息 */}
      {questions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">编辑提示：</p>
              <ul className="space-y-1 text-blue-700">
                <li>• 点击问题卡片右上角的编辑按钮可以修改问题</li>
                <li>• 拖拽问题左侧的手柄图标可以调整问题顺序</li>
                <li>• 必答题会在标题后显示红色星号 *</li>
                <li>• 建议设置合理的字数限制，帮助学生更好地回答问题</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesQuestionList;
