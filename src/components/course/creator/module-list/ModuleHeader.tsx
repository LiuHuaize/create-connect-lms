
import React from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';

interface ModuleHeaderProps {
  moduleId: string;
  title: string;
  isExpanded: boolean;
  onToggleExpand: (moduleId: string) => void;
  onUpdateTitle: (moduleId: string, title: string) => void;
  onDeleteModule: (moduleId: string) => void;
}

const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  moduleId,
  title,
  isExpanded,
  onToggleExpand,
  onUpdateTitle,
  onDeleteModule
}) => {
  return (
    <div 
      className="flex items-center justify-between p-4 cursor-pointer"
      onClick={() => onToggleExpand(moduleId)}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <input
          type="text"
          value={title}
          onChange={(e) => onUpdateTitle(moduleId, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="text-lg font-medium focus:outline-none focus:ring-1 focus:ring-connect-blue rounded px-1"
        />
      </div>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteModule(moduleId);
        }}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ModuleHeader;
