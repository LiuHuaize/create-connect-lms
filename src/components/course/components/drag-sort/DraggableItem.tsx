import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DragSortItem } from '@/types/course';
import { GripVertical } from 'lucide-react';

interface DraggableItemProps {
  item: DragSortItem;
  isPlaced: boolean;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ item, isPlaced }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: isPlaced,
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 border rounded-md relative
        ${isDragging ? 'shadow-md border-blue-300 bg-blue-50 z-10' : ''} 
        ${isPlaced ? 'opacity-40 bg-gray-100 cursor-not-allowed' : 'bg-white cursor-grab hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'}
        transition-all duration-200 group
      `}
    >
      <div className="flex items-start">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-700">{item.text}</div>
          {item.description && (
            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
          )}
        </div>
        
        {!isPlaced && (
          <div className={`
            text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity
            ${isDragging ? 'opacity-100' : ''}
          `}>
            <GripVertical size={16} className="ml-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableItem; 