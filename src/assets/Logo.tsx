
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`flex items-center ${className || ''}`}>
      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-connect-blue to-connect-purple flex items-center justify-center text-white font-bold">
        亿
      </div>
      <span className="ml-2 font-bold text-lg">亿小步</span>
    </div>
  );
};

export default Logo;
