import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        {/* 马卡龙风格的圆形Logo背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary rounded-full blur-sm opacity-50"></div>
        <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-full border border-muted">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">亿</span>
        </div>
      </div>
      <span className="ml-2 font-bold text-xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">亿小步</span>
    </div>
  );
} 