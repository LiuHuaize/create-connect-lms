
import React from 'react';
import { SearchX } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <SearchX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-600 font-medium mb-2">没有找到符合条件的课程</p>
      <p className="text-gray-500 text-sm">请尝试其他搜索条件或稍后再试</p>
    </div>
  );
};

export default EmptyState;
