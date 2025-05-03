import React from 'react';
import { Video, FileText, FileQuestion, CheckSquare, CreditCard, Move, Download } from 'lucide-react';
import { LessonType } from '@/types/course';

export type LessonTypeInfo = {
  id: LessonType;
  name: string;
  icon: React.ReactNode;
};

export const LESSON_TYPES: LessonTypeInfo[] = [
  { id: 'video', name: '视频', icon: React.createElement(Video, { size: 16, className: "text-ghibli-skyBlue" }) },
  { id: 'text', name: '文本内容', icon: React.createElement(FileText, { size: 16, className: "text-ghibli-grassGreen" }) },
  { id: 'quiz', name: '测验', icon: React.createElement(FileQuestion, { size: 16, className: "text-ghibli-sunshine" }) },
  { id: 'assignment', name: '作业', icon: React.createElement(CheckSquare, { size: 16, className: "text-ghibli-lavender" }) },
  { id: 'card_creator', name: '卡片创建', icon: React.createElement(CreditCard, { size: 16, className: "text-ghibli-coral" }) },
  { id: 'drag_sort', name: '拖拽分类', icon: React.createElement(Move, { size: 16, className: "text-ghibli-pink" }) },
  { id: 'resource', name: '资源下载', icon: React.createElement(Download, { size: 16, className: "text-ghibli-indigo" }) }
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
    case 'card_creator':
      return { 
        instructions: '',
        templateType: 'text',
        templateDescription: ''
      };
    case 'drag_sort':
      return { 
        introduction: '将下面的项目拖拽到正确的分类中',
        items: [],
        categories: [],
        correctMappings: []
      };
    case 'resource':
      return { 
        description: '',
        resourceFiles: []
      };
    default:
      return { text: '' };
  }
};
