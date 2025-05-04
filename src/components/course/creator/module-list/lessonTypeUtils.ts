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

// 获取课时类型对应的图标组件
export const getLessonTypeIcon = (type: LessonType) => {
  const typeInfo = getLessonTypeInfo(type);
  if (!typeInfo) {
    return React.createElement(FileText, { size: 16, className: "text-gray-500" });
  }
  
  // 返回已渲染的React元素，而不是组件类
  switch (type) {
    case 'video':
      return React.createElement(Video, { size: 16, className: "text-ghibli-skyBlue" });
    case 'text':
      return React.createElement(FileText, { size: 16, className: "text-ghibli-grassGreen" });
    case 'quiz':
      return React.createElement(FileQuestion, { size: 16, className: "text-ghibli-sunshine" });
    case 'assignment':
      return React.createElement(CheckSquare, { size: 16, className: "text-ghibli-lavender" });
    case 'card_creator':
      return React.createElement(CreditCard, { size: 16, className: "text-ghibli-coral" });
    case 'drag_sort':
      return React.createElement(Move, { size: 16, className: "text-ghibli-pink" });
    case 'resource':
      return React.createElement(Download, { size: 16, className: "text-ghibli-indigo" });
    default:
      return React.createElement(FileText, { size: 16, className: "text-gray-500" });
  }
};

// 获取课时类型的显示名称
export const getLessonTypeName = (type: LessonType): string => {
  const typeInfo = getLessonTypeInfo(type);
  return typeInfo ? typeInfo.name : '文本内容';
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
