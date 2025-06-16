import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { DraggableAttributes } from '@dnd-kit/core';
import { toast } from 'sonner';

interface ModuleHeaderProps {
  moduleId: string;
  title: string;
  isExpanded: boolean;
  onToggleExpand: (moduleId: string) => void;
  onUpdateTitle: (moduleId: string, title: string) => Promise<void>;
  onDeleteModule: (moduleId: string) => void;
  attributes?: DraggableAttributes;
  listeners?: any;
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  moduleId,
  title,
  isExpanded,
  onToggleExpand,
  onUpdateTitle,
  onDeleteModule,
  attributes,
  listeners
}) => {
  const [currentTitle, setCurrentTitle] = useState(title);
  const [isEditing, setIsEditing] = useState(false);
  const [originalTitle, setOriginalTitle] = useState(title);

  // 当外部传入的标题变化时，更新本地状态
  useEffect(() => {
    setCurrentTitle(title);
    setOriginalTitle(title);
  }, [title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTitle(e.target.value);
  };

  const handleTitleBlur = async () => {
    setIsEditing(false);

    // 如果标题没有变化，不做任何操作
    if (currentTitle === originalTitle) {
      return;
    }

    // 如果标题为空，使用原始标题
    if (!currentTitle.trim()) {
      setCurrentTitle(originalTitle);
      toast.error('模块标题不能为空');
      return;
    }

    // 提交更改
    try {
      await onUpdateTitle(moduleId, currentTitle);
      setOriginalTitle(currentTitle);

      // 显示反馈
      console.log(`模块标题已更新: ${originalTitle} -> ${currentTitle}`);
    } catch (error) {
      console.error('更新模块标题失败:', error);
      // 如果更新失败，恢复原始标题
      setCurrentTitle(originalTitle);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setCurrentTitle(originalTitle);
      setIsEditing(false);
    }
  };

  const handleTitleClick = () => {
    setIsEditing(true);
  };

  return (
    <div
      className="flex items-center p-2 bg-slate-100 border-b border-gray-200 rounded-t cursor-pointer select-none"
      {...attributes}
    >
      <div className="cursor-move mr-2" {...listeners}>
        <GripVertical size={16} className="text-gray-500" />
      </div>
      <div
        className="mr-2 cursor-pointer"
        onClick={() => onToggleExpand(moduleId)}
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-700" />
        ) : (
          <ChevronRight size={16} className="text-gray-700" />
        )}
      </div>
      {isEditing ? (
        <input
          type="text"
          value={currentTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300 text-left"
          autoFocus
        />
      ) : (
        <div
          className="flex-1 font-medium text-gray-800 hover:bg-gray-200 p-1 rounded-md text-left"
          onClick={handleTitleClick}
        >
          {currentTitle || '未命名模块'}
        </div>
      )}
      <button
        onClick={() => onDeleteModule(moduleId)}
        className="p-1 text-gray-500 hover:text-red-500 focus:outline-none"
        aria-label="删除模块"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ModuleHeader;
