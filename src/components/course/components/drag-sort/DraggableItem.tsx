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
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 border-2 rounded-lg relative flex items-start
        ${isDragging ? 'shadow-lg border-[#b3c596] bg-[#edf5e1] z-10' : ''} 
        ${isPlaced ? 'opacity-35 bg-gray-50 cursor-not-allowed border-gray-200' : 'bg-white cursor-grab hover:border-[#c3d5a6] hover:bg-[#f7f9f2] hover:shadow-sm border-[#e4ebd5]'}
        transition-all duration-150 group
      `}
    >
      <div className="flex-1">
        <div className={`text-sm font-medium ${isPlaced ? 'text-gray-400' : 'text-[#5c7744]'}`}>{item.text}</div>
        {item.description && (
          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
        )}
      </div>
      
      {!isPlaced && (
        <div className={`
          text-[#8aad6a] opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0
          ${isDragging ? 'opacity-100' : ''}
        `}>
          <GripVertical size={16} />
        </div>
      )}
    </div>
  );
};

export default DraggableItem; 