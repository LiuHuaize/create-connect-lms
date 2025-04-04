
import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Lesson } from '@/types/course';
import { getLessonTypeInfo } from './lessonTypeUtils';

interface LessonItemProps {
  lesson: Lesson;
  moduleId: string;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (moduleId: string, lessonId: string) => void;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  moduleId,
  onEditLesson,
  onDeleteLesson
}) => {
  const typeInfo = getLessonTypeInfo(lesson.type);

  return (
    <div 
      className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        {typeInfo?.icon}
        <span>{lesson.title}</span>
      </div>
      
      <div className="flex items-center gap-2">
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
