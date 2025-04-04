
import React from 'react';
import { Button as UIButton } from '@/components/ui/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'default', 
  size = 'default', 
  children, 
  ...props 
}) => {
  return (
    <UIButton variant={variant} size={size} {...props}>
      {children}
    </UIButton>
  );
};

export default Button;
