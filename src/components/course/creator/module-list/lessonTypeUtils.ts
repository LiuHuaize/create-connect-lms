
import React from 'react';
import { Video, FileText, FileQuestion, CheckSquare } from 'lucide-react';
import { LessonType } from '@/types/course';

export type LessonTypeInfo = {
  id: LessonType;
  name: string;
  icon: React.ReactNode;
};

export const LESSON_TYPES: LessonTypeInfo[] = [
  { id: 'video', name: '视频', icon: React.createElement(Video, { size: 16, className: "text-blue-600" }) },
  { id: 'text', name: '文本内容', icon: React.createElement(FileText, { size: 16, className: "text-green-600" }) },
  { id: 'quiz', name: '测验', icon: React.createElement(FileQuestion, { size: 16, className: "text-amber-600" }) },
  { id: 'assignment', name: '作业', icon: React.createElement(CheckSquare, { size: 16, className: "text-purple-600" }) }
];

export const getLessonTypeInfo = (type: LessonType): LessonTypeInfo | undefined => {
  return LESSON_TYPES.find(lessonType => lessonType.id === type);
};

export const getInitialContentByType = (type: LessonType) => {
  switch(type) {
    case 'video':
      return { videoUrl: '' };
    case 'text':
      return { text: '' };
    case 'quiz':
      return { questions: [] };
    case 'assignment':
      return { instructions: '', criteria: '' };
    default:
      return { text: '' };
  }
};
