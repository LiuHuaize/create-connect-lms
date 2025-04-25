import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragSortCategory, DragSortItem } from '@/types/course';

interface CategoryDropZoneProps {
  category: DragSortCategory;
  items: DragSortItem[]; // 当前放置在此分类中的项目
}

const CategoryDropZone: React.FC<CategoryDropZoneProps> = ({ category, items }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: category.id,
  });

  return (
    <div className={`
      rounded-md border transition-all duration-200
      ${isOver ? 'border-blue-300 shadow-md' : 'border-gray-200'}
    `}>
      {/* 分类标题 */}
      <div className={`
        p-3 border-b rounded-t-md transition-colors
        ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}
      `}>
        <h5 className="font-medium text-gray-800">{category.title}</h5>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>
      
      {/* 放置区域 */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[120px] p-3 transition-colors rounded-b-md
          ${isOver ? 'bg-blue-50/50' : 'bg-white'}
          ${items.length === 0 ? 'flex items-center justify-center' : ''}
        `}
      >
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => (
              <div 
                key={item.id} 
                className="p-3 bg-white border rounded-md shadow-sm transition-all hover:shadow"
              >
                <div className="text-sm font-medium text-gray-700">{item.text}</div>
                {item.description && (
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`
            text-sm italic transition-colors
            ${isOver ? 'text-blue-500' : 'text-gray-400'}
          `}>
            {isOver ? '放置在这里...' : '将项目拖到这里'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDropZone; 