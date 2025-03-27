// Update this page (the content is just a fallback if you fail to update the page)

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // 自动重定向到Dashboard页面
    navigate('/dashboard');
  }, [navigate]);
  
  // 这个返回的内容只会短暂显示，随后就会重定向
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">正在加载...</h1>
      </div>
    </div>
  );
};

export default Index;
