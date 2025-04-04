
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">没有找到符合条件的课程</p>
      <p className="text-gray-400 text-sm">请尝试其他搜索条件或稍后再试</p>
    </div>
  );
};

export default EmptyState;
