import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SeriesQuestion } from '@/types/course';
import SeriesQuestionEditor from './SeriesQuestionEditor';

interface SortableQuestionItemProps {
  question: SeriesQuestion;
  questionIndex: number;
  isEditing: boolean;
  onSave: (question: SeriesQuestion) => void;
  onDelete: (questionId: string) => void;
  onEdit: (questionId: string) => void;
  onCancel: () => void;
}

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  questionIndex,
  isEditing,
  onSave,
  onDelete,
  onEdit,
  onCancel
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: isEditing, // 编辑时禁用拖拽
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50' : ''}`}
    >
      <SeriesQuestionEditor
        question={question}
        questionIndex={questionIndex}
        isEditing={isEditing}
        onSave={onSave}
        onDelete={onDelete}
        onEdit={onEdit}
        onCancel={onCancel}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      />
    </div>
  );
};

export default SortableQuestionItem;
