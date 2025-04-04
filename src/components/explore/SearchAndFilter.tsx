
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

  // 自适应显示类别数量
  useEffect(() => {
    if (isMobile) {
      // 移动设备只显示前3个类别
      setVisibleCategories(showAllCategories ? categories : categories.slice(0, 3));
    } else {
      // 桌面设备根据容器宽度计算可显示数量
      const calculateVisibleCategories = () => {
        if (!containerRef.current) return;
        
        const containerWidth = containerRef.current.offsetWidth;
        const averageBadgeWidth = 100; // 估计每个标签的平均宽度(包括间距)
        const visibleCount = Math.floor(containerWidth / averageBadgeWidth);
        
        setVisibleCategories(
          showAllCategories ? categories : categories.slice(0, Math.max(3, visibleCount))
        );
      };
      
      calculateVisibleCategories();
      
      // 窗口大小改变时重新计算
      window.addEventListener('resize', calculateVisibleCategories);
      return () => window.removeEventListener('resize', calculateVisibleCategories);
    }
  }, [categories, isMobile, showAllCategories]);

  // 清除搜索
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="搜索课程..."
          className="pl-10 pr-10"
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
      
      <div ref={containerRef} className="flex flex-wrap gap-2">
        {visibleCategories.map((category) => (
          <Badge 
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="cursor-pointer transition-all hover:shadow-sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
        
        {categories.length > visibleCategories.length && (
          <Badge 
            variant="outline"
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => setShowAllCategories(!showAllCategories)}
          >
            {showAllCategories ? '收起' : `+${categories.length - visibleCategories.length}`}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;
