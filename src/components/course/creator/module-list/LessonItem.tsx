import React, { useState } from 'react';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { Lesson } from '@/types/course';
import { getLessonTypeIcon, getLessonTypeName } from './lessonTypeUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface LessonItemProps {
  lesson: Lesson;
  moduleId: string;
  index: number;
  onEditLesson: (lesson: Lesson) => void;
  onUpdateLesson?: (lesson: Lesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
  isInFrame?: boolean;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  moduleId,
  index,
  onEditLesson,
  onUpdateLesson,
  onDeleteLesson,
  isInFrame = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  
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
      type: 'lesson',
      lesson,
      index,
      moduleId
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative' as 'relative'
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };
  
  const handleTitleBlur = () => {
    setIsEditing(false);
    if (title.trim() === '') {
      setTitle(lesson.title);
      toast.error('课时标题不能为空');
      return;
    }
    
    if (title !== lesson.title && onUpdateLesson) {
      const updatedLesson = { ...lesson, title };
      onUpdateLesson(updatedLesson);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setTitle(lesson.title);
      setIsEditing(false);
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`flex items-center border border-gray-200 rounded-md p-2 mb-2 ${
        isInFrame 
          ? 'bg-white shadow-sm hover:shadow-md transition-shadow' 
          : 'bg-white hover:bg-gray-50'
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab mr-2">
        <GripVertical size={16} className="text-gray-400" />
      </div>
      
      <div className="flex-shrink-0 mr-2">
        {getLessonTypeIcon(lesson.type)}
      </div>
      
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
      ) : (
        <div 
          className="flex-1 cursor-pointer hover:underline"
          onClick={() => onEditLesson(lesson)}
        >
          {lesson.title}
          <span className="ml-2 text-xs text-gray-500">
            {getLessonTypeName(lesson.type)}
          </span>
        </div>
      )}
      
      <div className="flex items-center ml-2 space-x-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-gray-400 hover:text-blue-500 focus:outline-none"
          aria-label="编辑课时标题"
        >
          <Pencil size={14} />
        </button>
        
        <button
          onClick={() => onDeleteLesson(moduleId, lesson.id)}
          className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
          aria-label="删除课时"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default LessonItem;
