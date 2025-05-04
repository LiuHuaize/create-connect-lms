import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { DraggableAttributes } from '@dnd-kit/core';
import { toast } from 'sonner';

interface ModuleHeaderProps {
  moduleId: string;
  title: string;
  isExpanded: boolean;
  onToggleExpand: (moduleId: string) => void;
  onUpdateTitle: (moduleId: string, title: string) => void;
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
  const [editMode, setEditMode] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  const handleInputBlur = () => {
    if (tempTitle.trim() === '') {
      setTempTitle(title);
      toast.error('模块名称不能为空');
    } else if (tempTitle !== title) {
      onUpdateTitle(moduleId, tempTitle);
    }
    setEditMode(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setTempTitle(title);
      setEditMode(false);
    }
  };

  return (
    <div className="flex items-center p-4">
      <div className="flex items-center cursor-grab" {...attributes} {...listeners}>
        <GripVertical size={18} className="text-gray-400 mr-2" />
      </div>
      
      <button 
        onClick={() => onToggleExpand(moduleId)}
        className="mr-2 text-gray-500 hover:text-gray-700"
      >
        {isExpanded ? (
          <ChevronDown size={18} />
        ) : (
          <ChevronRight size={18} />
        )}
      </button>
      
      {editMode ? (
        <input
          type="text"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-connect-blue"
          autoFocus
        />
      ) : (
        <div 
          onClick={() => setEditMode(true)} 
          className="flex-1 font-medium cursor-pointer hover:underline"
        >
          {title}
        </div>
      )}
      
      <button 
        onClick={() => onDeleteModule(moduleId)}
        className="ml-2 text-gray-400 hover:text-red-500"
        aria-label="删除模块"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ModuleHeader;
