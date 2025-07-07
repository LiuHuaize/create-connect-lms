import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import { CourseCategory } from '@/types/course-enrollment';
import { useIsMobile } from '@/hooks/use-mobile';

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: CourseCategory;
  setSelectedCategory: (category: CourseCategory) => void;
  categories: CourseCategory[];
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories
}) => {
  const isMobile = useIsMobile();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<CourseCategory[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // 记录分类变化
  useEffect(() => {
    console.log('SearchAndFilter - 接收到分类列表:', categories);
    console.log('SearchAndFilter - 当前选择的分类:', selectedCategory);
  }, [categories, selectedCategory]);

  // 自适应显示类别数量
  useEffect(() => {
    try {
      if (isMobile) {
        // 移动设备只显示前3个类别
        const visibleCats = showAllCategories ? categories : categories.slice(0, 3);
        console.log('移动设备可见分类:', visibleCats);
        setVisibleCategories(visibleCats);
      } else {
        // 桌面设备根据容器宽度计算可显示数量
        const calculateVisibleCategories = () => {
          if (!containerRef.current) return;
          
          const containerWidth = containerRef.current.offsetWidth;
          const averageBadgeWidth = 100; // 估计每个标签的平均宽度(包括间距)
          const visibleCount = Math.floor(containerWidth / averageBadgeWidth);
          
          const visibleCats = showAllCategories 
            ? categories 
            : categories.slice(0, Math.max(3, visibleCount));
            
          console.log('桌面设备可见分类:', visibleCats);
          setVisibleCategories(visibleCats);
        };
        
        calculateVisibleCategories();
        
        // 窗口大小改变时重新计算
        window.addEventListener('resize', calculateVisibleCategories);
        return () => window.removeEventListener('resize', calculateVisibleCategories);
      }
    } catch (error) {
      console.error('计算可见分类时出错:', error);
      setVisibleCategories(categories.slice(0, 3)); // 出错时默认显示前3个
    }
  }, [categories, isMobile, showAllCategories]);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 处理分类选择
  const handleCategoryClick = (category: CourseCategory) => {
    console.log('用户选择了分类:', category);
    setSelectedCategory(category);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="搜索课程..."
          className="pl-10 pr-10 border-gray-200 focus:border-blue-400 focus:ring-blue-400"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={handleClearSearch}
          >
            <X size={18} />
          </button>
        )}
      </div>
      
      {/* 分类标签区域 */}
      <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
        <div className="flex items-center mb-3">
          <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-3"></div>
          <h4 className="text-sm font-medium text-gray-700">课程分类</h4>
        </div>
        
        <div ref={containerRef} className="flex flex-wrap gap-2">
          {visibleCategories.map((category) => (
            <Badge 
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className={
                selectedCategory === category 
                  ? "cursor-pointer transition-all hover:shadow-sm bg-blue-500 hover:bg-blue-600 text-white border-blue-500 px-3 py-1"
                  : "cursor-pointer transition-all hover:shadow-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border-gray-300 text-gray-600 px-3 py-1"
              }
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Badge>
          ))}
          
          {categories.length > visibleCategories.length && (
            <Badge 
              variant="outline"
              className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 border-gray-300 text-gray-600 px-3 py-1"
              onClick={() => setShowAllCategories(!showAllCategories)}
            >
              {showAllCategories ? '收起' : `+${categories.length - visibleCategories.length}`}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndFilter;
