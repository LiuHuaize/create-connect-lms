import React from 'react';
import { Trash2, Pencil, GripVertical } from 'lucide-react';
import { Lesson } from '@/types/course';
import { getLessonTypeInfo } from './lessonTypeUtils';
import { Draggable } from 'react-beautiful-dnd';

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

  return (
    <Draggable draggableId={lesson.id} index={index}>
      {(provided, snapshot) => (
        <div 
          className={`flex items-center justify-between p-3 border ${snapshot.isDragging ? 'border-blue-300 bg-blue-50' : 'border-gray-100'} rounded-md hover:bg-gray-50 transition-colors`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? '0 5px 10px rgba(0, 0, 0, 0.1)' : 'none',
            transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
            zIndex: snapshot.isDragging ? 10 : 'auto',
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div 
              className="cursor-grab hover:text-blue-500 flex-shrink-0" 
              {...provided.dragHandleProps}
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
      )}
    </Draggable>
  );
};

export default LessonItem;
