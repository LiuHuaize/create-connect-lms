
import React from 'react';
import { Button } from '@/components/ui/button';
import { LessonType } from '@/types/course';

interface LessonTypeButtonProps {
  icon: React.ReactNode;
  name: string;
  type: LessonType;
  moduleId: string;
  onAddLesson: (moduleId: string, lessonType: LessonType) => void;
}

const LessonTypeButton: React.FC<LessonTypeButtonProps> = ({
  icon,
  name,
  type,
  moduleId,
  onAddLesson
}) => {
  return (
    <Button 
      variant="outline" 
      className="text-sm"
      onClick={() => onAddLesson(moduleId, type)}
    >
      {icon}
      <span className="ml-2">添加{name}</span>
    </Button>
  );
};

export default LessonTypeButton;
