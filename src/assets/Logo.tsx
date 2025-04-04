
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'compact' | 'full';
}

const Logo: React.FC<LogoProps> = ({ 
  className, 
  variant = 'default' 
}) => {
  const logoStyles = {
    default: 'flex items-center',
    compact: 'flex items-center justify-center',
    full: 'flex items-center space-x-2'
  };

  const iconStyles = {
    default: 'h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold',
    compact: 'h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold',
    full: 'h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold'
  };

  const textStyles = {
    default: 'ml-2 font-bold text-lg',
    compact: 'hidden',
    full: 'font-bold text-xl text-gray-800'
  };

  return (
    <div className={`${logoStyles[variant]} ${className || ''}`}>
      <div className={iconStyles[variant]}>亿</div>
      {variant !== 'compact' && (
        <span className={textStyles[variant]}>小亿步</span>
      )}
    </div>
  );
};

export default Logo;

