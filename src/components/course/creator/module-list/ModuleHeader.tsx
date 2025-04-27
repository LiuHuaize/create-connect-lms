import React from 'react';
import { ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { DraggableAttributes } from '@dnd-kit/core';
import { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities/useListeners';

interface ModuleHeaderProps {
  moduleId: string;
  title: string;
  isExpanded: boolean;
  onToggleExpand: (moduleId: string) => void;
  onUpdateTitle: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
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
  return (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200"
    >
      <div className="flex items-center gap-2 flex-grow">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab text-gray-400 hover:text-gray-600 p-1 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={18} />
        </button>
        
        <button 
          onClick={() => onToggleExpand(moduleId)}
          className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        
        <input
          type="text"
          value={title}
          onChange={(e) => onUpdateTitle(moduleId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-lg font-medium focus:outline-none focus:ring-1 focus:ring-connect-blue rounded px-2 py-0.5 flex-grow bg-transparent"
          placeholder="模块标题"
        />
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteModule(moduleId);
        }}
        className="text-gray-400 hover:text-red-500 transition-colors ml-2 p-1"
        aria-label="删除模块"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ModuleHeader;
