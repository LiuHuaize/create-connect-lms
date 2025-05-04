import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12 px-6 bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
      <div className="relative mb-6 animate-bounce-slow">
        <img 
          src="/images/empty-courses.svg"
          alt="未找到课程" 
          className="h-40 w-40"
        />
        <div className="absolute -right-5 top-10 animate-pulse">
          <div className="h-4 w-4 rounded-full bg-yellow-300 opacity-70"></div>
        </div>
        <div className="absolute -left-5 top-20 animate-pulse" style={{animationDelay: '0.5s'}}>
          <div className="h-5 w-5 rounded-full bg-purple-300 opacity-70"></div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-indigo-600 mb-3">哎呀，没找到课程！</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-6 text-lg">
        好像这里空空如也... 试试看别的分类，或者清空搜索框？
      </p>
      <div className="space-y-4">
        <div className="inline-flex gap-2 text-sm bg-white text-gray-600 px-4 py-2 rounded-full border border-gray-200 shadow-sm transform hover:scale-105 transition-transform">
          <span className="text-indigo-500 font-medium">提示:</span>
          <span>试试看选择"全部"分类？</span>
        </div>
        <div>
          <Button 
            variant="outline" 
            className="mt-4 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 transition-all duration-300 transform hover:scale-105" 
            onClick={() => {
              navigate('/explore-courses');
              window.location.reload();
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            刷新看看
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
