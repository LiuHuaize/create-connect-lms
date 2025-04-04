
import React from 'react';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-16 px-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
      <SearchX className="mx-auto h-16 w-16 text-gray-300 mb-6" />
      <h3 className="text-xl font-semibold text-gray-800 mb-3">没有找到符合条件的课程</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">请尝试其他搜索条件或查看所有课程分类</p>
      <div className="space-y-4">
        <div className="inline-flex gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-full">
          <span>提示:</span>
          <span>尝试使用更广泛的搜索词或选择"全部"分类</span>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => navigate('/course-selection')}
          >
            返回课程列表
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
