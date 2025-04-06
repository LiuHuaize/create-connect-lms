import React from 'react';
import { Trash2, Pencil, GripVertical } from 'lucide-react';
import { Lesson } from '@/types/course';
import { getLessonTypeInfo } from './lessonTypeUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LessonItemProps {
  lesson: Lesson;
  moduleId: string;
  index: number;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  moduleId,
  index,
  onEditLesson,
  onDeleteLesson
}) => {
  const typeInfo = getLessonTypeInfo(lesson.type);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: lesson.id,
    data: {
      moduleId,
      index
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 border rounded-md 
        ${isDragging ? 'border-blue-300 bg-blue-50 shadow-md' : 'border-gray-100 hover:bg-gray-50'} 
        transition-colors`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div 
          className="cursor-grab hover:text-blue-500 flex-shrink-0" 
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </div>
        {typeInfo?.icon}
        <span className="truncate">{lesson.title}</span>
      </div>
      
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <button 
          onClick={() => onEditLesson(lesson)}
          className="text-gray-400 hover:text-connect-blue transition-colors"
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={() => onDeleteLesson(moduleId, lesson.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default LessonItem;
