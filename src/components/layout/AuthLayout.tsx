import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout - A simple layout component for authentication pages.
 * Provides a clean, centered design with a light background.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      {/* Logo or branding could be placed here */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center text-primary">学习平台</h1>
        <p className="text-center text-gray-600 mt-2">欢迎访问我们的在线学习平台</p>
      </div>
      
      {/* Content container with shadow and rounded corners */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        {children}
      </div>
      
      {/* Footer with copyright info */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} 学习平台. 保留所有权利.</p>
      </div>
    </div>
  );
};

export default AuthLayout; 