
import React from 'react';
import { SearchX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-16 px-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
      <div className="mx-auto h-20 w-20 flex items-center justify-center bg-gray-50 rounded-full mb-6">
        <SearchX className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">课程未找到</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">请尝试其他搜索条件或查看所有课程分类</p>
      <div className="space-y-4">
        <div className="inline-flex gap-2 text-sm bg-blue-50 text-blue-600 px-4 py-2 rounded-full">
          <span>提示:</span>
          <span>尝试使用更广泛的搜索词或选择"全部"分类</span>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="mt-4 border-blue-200 hover:bg-blue-50 hover:text-blue-700" 
            onClick={() => navigate('/explore-courses')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回课程列表
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
