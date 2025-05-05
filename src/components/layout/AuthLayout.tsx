import { Logo } from "@/components/ui/logo";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

/**
 * AuthLayout - 为授权页面提供简化的布局组件
 * 减少装饰性元素以提高初始加载性能
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* 简化的背景渐变 */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"></div>
      
      {/* 主要内容 */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden border border-muted relative z-10">
        <div className="text-center px-8 pt-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout; 