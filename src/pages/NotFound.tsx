import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // 自动重定向到首页
    const redirectTimer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 100); // 设置短暂延迟，给用户看到404页面的机会

    return () => clearTimeout(redirectTimer);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">哎呀！页面不存在</p>
        <p className="text-gray-500 mb-2">正在自动返回首页...</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          立即返回首页
        </a>
      </div>
    </div>
  );
};

export default NotFound;
