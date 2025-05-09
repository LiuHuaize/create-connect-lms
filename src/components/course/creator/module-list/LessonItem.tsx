import React, { useState, useEffect } from 'react';
import { Trash2, Pencil, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
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
  onMoveUp?: (moduleId: string, lessonId: string) => void;
  onMoveDown?: (moduleId: string, lessonId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const LessonItem: React.FC<LessonItemProps> = ({
  lesson,
  moduleId,
  index,
  onEditLesson,
  onUpdateLesson,
  onDeleteLesson,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(lesson.title);
  const [originalTitle, setOriginalTitle] = useState(lesson.title);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 当外部传入的课时标题变更时，更新内部状态
  useEffect(() => {
    setEditedTitle(lesson.title);
    setOriginalTitle(lesson.title);
  }, [lesson.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    
    // 如果标题没有变化，不做任何操作
    if (editedTitle === originalTitle) {
      return;
    }
    
    // 如果标题为空，恢复原始标题
    if (!editedTitle.trim()) {
      setEditedTitle(originalTitle);
      toast.error('课时标题不能为空');
      return;
    }
    
    // 更新课时标题
    const updatedLesson = {
      ...lesson,
      title: editedTitle.trim()
    };
    
    // 先记录日志，便于调试
    console.log(`课时标题更新: ${lesson.id} - 从 "${originalTitle}" 到 "${editedTitle.trim()}"`);
    
    // 如果有onUpdateLesson，优先使用它进行更新
    if (onUpdateLesson) {
      console.log('调用onUpdateLesson更新课时标题');
      onUpdateLesson(updatedLesson);
    } else {
      // 否则回退到onEditLesson
      console.log('没有onUpdateLesson函数，使用onEditLesson代替');
      onEditLesson(updatedLesson);
    }
    
    // 更新内部状态
    setOriginalTitle(editedTitle.trim());
    
    // 显示反馈
    console.log(`课时标题已更新: ${originalTitle} -> ${editedTitle.trim()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setEditedTitle(originalTitle);
      setIsEditing(false);
    }
  };

  const lessonTypeIcon = getLessonTypeIcon(lesson.type);
  const lessonTypeName = getLessonTypeName(lesson.type);

  // 处理完整的课时编辑（点击课时本身而不是标题）
  const handleFullLessonEdit = () => {
    // 只有在点击课时内容区域(而不是标题编辑区域)时才触发完整编辑
    if (!isEditing) {
      onEditLesson(lesson);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center p-2 my-1 bg-white border border-gray-200 rounded-md shadow-sm group"
    >
      <div className="cursor-move mr-2" {...attributes} {...listeners}>
        <GripVertical size={16} className="text-gray-400" />
      </div>
      
      <div className="mr-2" title={`${lessonTypeName}课时`}>
        {lessonTypeIcon}
      </div>
      
      <div className="flex-1">
        {isEditing ? (
          <input
            type="text"
            value={editedTitle}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            autoFocus
          />
        ) : (
          <div 
            className="font-medium text-gray-700 hover:bg-gray-100 p-1 rounded-md cursor-pointer"
            onClick={handleEditClick}
          >
            {editedTitle || '未命名课时'}
          </div>
        )}
      </div>
      
      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* 上移按钮 */}
        {onMoveUp && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isFirst && onMoveUp) onMoveUp(moduleId, lesson.id);
            }}
            className={`p-1 rounded ${
              isFirst 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
            }`}
            disabled={isFirst}
            title="上移课时"
          >
            <ChevronUp size={14} />
          </button>
        )}
        
        {/* 下移按钮 */}
        {onMoveDown && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isLast && onMoveDown) onMoveDown(moduleId, lesson.id);
            }}
            className={`p-1 rounded ${
              isLast 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-500 hover:text-blue-500 hover:bg-gray-100'
            }`}
            disabled={isLast}
            title="下移课时"
          >
            <ChevronDown size={14} />
          </button>
        )}
        
        <button
          onClick={handleFullLessonEdit}
          className="p-1 text-gray-500 hover:text-blue-500 hover:bg-gray-100 rounded"
          aria-label="编辑课时内容"
        >
          <Pencil size={14} />
        </button>
        
        <button
          onClick={() => onDeleteLesson(moduleId, lesson.id)}
          className="p-1 text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded"
          aria-label="删除课时"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default LessonItem;
