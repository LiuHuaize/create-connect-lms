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
      <h3 className="text-2xl font-semibold text-gray-800 mb-3">未找到课程</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6">
        当前没有可供选择的课程，或者您的搜索条件没有匹配的结果
      </p>
      <div className="space-y-4">
        <div className="inline-flex gap-2 text-sm bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200">
          <span>提示:</span>
          <span>尝试清除搜索条件或选择"全部"分类</span>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="mt-4 border-gray-200 hover:bg-gray-50 hover:text-gray-700" 
            onClick={() => {
              // 重置搜索条件并刷新页面
              navigate('/explore-courses');
              window.location.reload();
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            刷新课程列表
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
