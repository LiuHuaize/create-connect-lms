import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout - 为授权页面提供吉卜力风格的布局组件
 * 提供了梦幻、自然的背景和温馨的设计风格
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ghibli-cream p-4 relative overflow-hidden">
      {/* 吉卜力风格的云朵装饰 - 左上角 */}
      <div className="absolute top-10 left-20 w-40 h-20 bg-white rounded-full opacity-70 blur-md"></div>
      <div className="absolute top-14 left-40 w-60 h-20 bg-white rounded-full opacity-70 blur-md"></div>
      
      {/* 吉卜力风格的云朵装饰 - 右下角 */}
      <div className="absolute bottom-10 right-20 w-52 h-16 bg-white rounded-full opacity-70 blur-md"></div>
      <div className="absolute bottom-14 right-40 w-32 h-16 bg-white rounded-full opacity-70 blur-md"></div>
      
      {/* 小植物装饰 - 左下角 */}
      <div className="absolute bottom-0 left-10 w-16 h-24 bg-ghibli-grassGreen rounded-t-full"></div>
      <div className="absolute bottom-0 left-20 w-10 h-16 bg-ghibli-mint rounded-t-full"></div>
      <div className="absolute bottom-0 left-32 w-14 h-20 bg-ghibli-grassGreen rounded-t-full"></div>
      
      {/* Logo和欢迎信息 */}
      <div className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-center text-ghibli-deepTeal font-serif">亿小步教育平台</h1>
        <p className="text-center text-ghibli-brown mt-2 italic">欢迎访问我们的在线学习平台</p>
      </div>
      
      {/* 内容容器 - 使用吉卜力柔和风格 */}
      <div className="w-full max-w-md bg-ghibli-parchment rounded-xl shadow-lg overflow-hidden border-2 border-ghibli-sand relative z-10">
        {children}
      </div>
      
      {/* 页脚版权信息 */}
      <div className="mt-8 text-center text-ghibli-lightBrown text-sm relative z-10">
        <p>© {new Date().getFullYear()} 亿小步教育平台. 保留所有权利.</p>
      </div>
    </div>
  );
};

export default AuthLayout; 