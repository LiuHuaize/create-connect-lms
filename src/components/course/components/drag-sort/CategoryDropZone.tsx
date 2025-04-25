import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DragSortCategory, DragSortItem } from '@/types/course';

interface CategoryDropZoneProps {
  category: DragSortCategory;
  items: DragSortItem[]; // 当前放置在此分类中的项目
}

// 吉卜力风格的柔和色调
const CATEGORY_THEMES = [
  { bg: 'bg-[#e6efd8]', border: 'border-[#c3d5a6]', hover: 'bg-[#d9e9c2]', text: 'text-[#5c7744]' }, // 柔和绿色
  { bg: 'bg-[#f0e9d9]', border: 'border-[#d5c9a3]', hover: 'bg-[#e6dcc3]', text: 'text-[#8c7b4a]' }, // 温暖米色
  { bg: 'bg-[#e0eef7]', border: 'border-[#b8d1e0]', hover: 'bg-[#cfe4f2]', text: 'text-[#5a7d90]' }, // 淡蓝色
  { bg: 'bg-[#f7e6df]', border: 'border-[#e5c4b6]', hover: 'bg-[#f0d6ca]', text: 'text-[#a67967]' }  // 淡粉棕色
];

// 生成一个哈希值用于颜色选择
const getHashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const CategoryDropZone: React.FC<CategoryDropZoneProps> = ({ category, items }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: category.id,
  });

  // 根据分类ID选择一个主题颜色
  const themeIndex = getHashCode(category.id) % CATEGORY_THEMES.length;
  const theme = CATEGORY_THEMES[themeIndex];

  return (
    <div className={`
      rounded-lg border-2 transition-all duration-200 overflow-hidden shadow-sm
      flex-1 min-w-[220px] max-w-[320px]
      ${isOver ? `${theme.border} ring-2 ring-opacity-30 shadow-md` : theme.border}
    `}>
      {/* 分类标题 */}
      <div className={`
        p-3 border-b-2 transition-colors
        ${isOver ? `${theme.hover} ${theme.border}` : `${theme.bg} ${theme.border}`}
      `}>
        <h5 className={`font-medium ${theme.text}`}>{category.title}</h5>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>
      
      {/* 放置区域 */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[120px] p-3 transition-colors
          ${isOver ? `${theme.hover} bg-opacity-70` : 'bg-white'}
          ${items.length === 0 ? 'flex items-center justify-center' : ''}
        `}
      >
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 max-h-[280px] overflow-y-auto pr-1">
            {items.map(item => (
              <div 
                key={item.id} 
                className={`
                  p-2.5 bg-white border rounded-md transition-all
                  hover:shadow-sm ${theme.border} hover:${theme.bg}
                `}
              >
                <div className={`text-sm font-medium ${theme.text}`}>{item.text}</div>
                {item.description && (
                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`
            text-sm italic transition-colors flex flex-col items-center justify-center
            ${isOver ? theme.text : 'text-gray-400'}
          `}>
            {isOver ? (
              <>
                <div className={`text-base ${theme.text} font-medium`}>放置在这里...</div>
              </>
            ) : (
              <>
                <div className="text-gray-400">将项目拖到这里</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryDropZone; 