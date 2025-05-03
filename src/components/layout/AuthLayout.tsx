import { Logo } from "@/components/ui/logo";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description: string;
}

/**
 * AuthLayout - 为授权页面提供吉卜力风格的布局组件
 * 提供了梦幻、自然的背景和温馨的设计风格
 */
export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* 装饰元素 */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20"></div>
      
      {/* 气泡装饰 */}
      <div className="absolute top-10 right-10 w-16 h-16 bg-primary/40 rounded-full blur-xl"></div>
      <div className="absolute top-20 right-20 w-24 h-24 bg-secondary/30 rounded-full blur-xl"></div>
      <div className="absolute top-40 right-5 w-12 h-12 bg-accent/20 rounded-full blur-xl"></div>
      
      {/* 装饰元素底部 */}
      <div className="absolute bottom-0 left-10 w-16 h-24 bg-secondary/40 rounded-t-full blur-sm"></div>
      <div className="absolute bottom-0 left-20 w-10 h-16 bg-primary/30 rounded-t-full blur-sm"></div>
      <div className="absolute bottom-0 left-32 w-14 h-20 bg-accent/30 rounded-t-full blur-sm"></div>
      
      {/* 装饰元素左侧 */}
      <div className="absolute top-28 left-20 w-20 h-20 bg-secondary/20 rounded-full blur-xl"></div>
      <div className="absolute top-52 left-10 w-28 h-28 bg-primary/20 rounded-full blur-xl"></div>
      
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