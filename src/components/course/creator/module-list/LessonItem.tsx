import React, { useState } from 'react';
import { Pencil, Trash2, GripVertical, Frame, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Lesson, LessonType } from '@/types/course';
import { getLessonTypeIcon, getLessonTypeName, LESSON_TYPES } from './lessonTypeUtils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { useDroppable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';

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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
  
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: `frame-${lesson.id}`,
    data: {
      frameId: lesson.id,
      accepts: ['lesson']
    },
    disabled: !lesson.isFrame
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

  // 处理添加子课时到框架
  const handleAddSubLesson = (type: LessonType) => {
    if (!lesson.isFrame || !onUpdateLesson) return;
    
    const newSubLesson: Lesson = {
      id: uuidv4(),
      module_id: moduleId,
      type: type,
      title: `新${type}课程`,
      content: {},
      order_index: lesson.subLessons?.length || 0
    };
    
    const updatedSubLessons = [...(lesson.subLessons || []), newSubLesson];
    const updatedLesson = {
      ...lesson,
      subLessons: updatedSubLessons
    };
    
    onUpdateLesson(updatedLesson);
    setIsExpanded(true);
    toast.success(`已添加新${getLessonTypeName(type)}到框架`);
  };

  // 处理从框架中删除子课时
  const handleDeleteSubLesson = (subLessonId: string) => {
    if (!lesson.isFrame || !lesson.subLessons || !onUpdateLesson) return;
    
    const updatedSubLessons = lesson.subLessons.filter(sl => sl.id !== subLessonId);
    const updatedLesson = {
      ...lesson,
      subLessons: updatedSubLessons
    };
    
    onUpdateLesson(updatedLesson);
    toast.success('已从框架中删除课时');
  };

  // 处理编辑子课时
  const handleEditSubLesson = (subLesson: Lesson) => {
    // 创建一个临时Lesson对象，包含框架信息
    const tempLesson = {
      ...subLesson,
      parentFrameId: lesson.id // 添加父框架ID，以便编辑后能找回
    };
    onEditLesson(tempLesson);
  };

  // 处理更新子课时
  const handleUpdateSubLesson = (updatedSubLesson: Lesson) => {
    if (!lesson.isFrame || !lesson.subLessons || !onUpdateLesson) return;
    
    const updatedSubLessons = lesson.subLessons.map(sl => 
      sl.id === updatedSubLesson.id ? updatedSubLesson : sl
    );
    
    const updatedLesson = {
      ...lesson,
      subLessons: updatedSubLessons
    };
    
    onUpdateLesson(updatedLesson);
  };

  // 基本课时项渲染
  const renderBasicLessonItem = () => (
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
      
      {lesson.isFrame && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isExpanded ? (
            <ChevronDown size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      )}
      
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
          onClick={() => lesson.isFrame ? setIsExpanded(!isExpanded) : onEditLesson(lesson)}
        >
          {lesson.title}
          <span className="ml-2 text-xs text-gray-500">
            {getLessonTypeName(lesson.type)}
          </span>
          {lesson.isFrame && (
            <span className="ml-2 text-xs bg-ghibli-purple bg-opacity-20 text-ghibli-purple px-2 py-0.5 rounded">
              框架
            </span>
          )}
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

  // 框架内容渲染
  const renderFrameContent = () => {
    if (!lesson.isFrame || !isExpanded) return null;
    
    return (
      <div 
        className="ml-6 mt-2 pl-4 border-l-2 border-ghibli-purple border-dashed"
        ref={setDroppableNodeRef}
      >
        <div 
          className={`space-y-2 mb-4 rounded-md p-2 min-h-[50px] ${
            isOver ? 'bg-blue-50 border border-dashed border-blue-300' : ''
          }`}
        >
          {lesson.subLessons && lesson.subLessons.length > 0 ? (
            <SortableContext 
              items={lesson.subLessons.map(sl => sl.id)} 
              strategy={verticalListSortingStrategy}
            >
              {lesson.subLessons
                .sort((a, b) => a.order_index - b.order_index)
                .map((subLesson, idx) => (
                  <div 
                    key={subLesson.id}
                    className="flex items-center border border-gray-200 rounded-md p-2 mb-2 bg-white hover:bg-gray-50"
                  >
                    <div className="flex-shrink-0 mr-2">
                      {getLessonTypeIcon(subLesson.type)}
                    </div>
                    
                    <div 
                      className="flex-1 cursor-pointer hover:underline"
                      onClick={() => handleEditSubLesson(subLesson)}
                    >
                      {subLesson.title}
                      <span className="ml-2 text-xs text-gray-500">
                        {getLessonTypeName(subLesson.type)}
                      </span>
                    </div>
                    
                    <div className="flex items-center ml-2 space-x-1">
                      <button
                        onClick={() => handleDeleteSubLesson(subLesson.id)}
                        className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                        aria-label="删除子课时"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              }
            </SortableContext>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm italic">
              {isOver 
                ? "放置课时到这里..." 
                : "此框架暂无课时，请添加内容"
              }
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {LESSON_TYPES
            .filter(type => type.id !== 'frame') // 不允许嵌套框架
            .map((type) => (
              <Button 
                key={type.id}
                size="sm"
                variant="outline"
                className="flex items-center space-x-1 text-xs"
                onClick={() => handleAddSubLesson(type.id)}
              >
                {type.icon}
                <span className="ml-1">{type.name}</span>
              </Button>
            ))
          }
        </div>
      </div>
    );
  };

  return (
    <>
      {renderBasicLessonItem()}
      {renderFrameContent()}
    </>
  );
};

export default LessonItem;
