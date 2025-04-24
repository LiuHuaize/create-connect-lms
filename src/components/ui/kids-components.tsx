import * as React from "react"
import { cn } from "@/lib/utils"

// 儿童友好的导航菜单
interface KidsNavProps extends React.HTMLAttributes<HTMLDivElement> {}

export const KidsNav = React.forwardRef<HTMLDivElement, KidsNavProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex gap-2 p-2 bg-ghibli-cream rounded-2xl border-2 border-ghibli-teal/30 shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)
KidsNav.displayName = "KidsNav"

// 导航项
interface KidsNavItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export const KidsNavItem = React.forwardRef<HTMLButtonElement, KidsNavItemProps>(
  ({ className, active, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-ghibli-sunshine hover:text-ghibli-brown",
        active && "bg-ghibli-mint text-ghibli-deepTeal",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
KidsNavItem.displayName = "KidsNavItem"

// 儿童友好的标签
interface KidsTabsProps extends React.HTMLAttributes<HTMLDivElement> {}

export const KidsTabs = React.forwardRef<HTMLDivElement, KidsTabsProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
)
KidsTabs.displayName = "KidsTabs"

// 标签项
interface KidsTabProps extends React.HTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export const KidsTab = React.forwardRef<HTMLButtonElement, KidsTabProps>(
  ({ className, active, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "bg-ghibli-sand px-4 py-2 rounded-t-xl font-medium border-2 border-b-0 border-ghibli-teal/30 transition-all duration-200",
        active && "bg-ghibli-parchment border-ghibli-teal/50 text-ghibli-deepTeal",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
KidsTab.displayName = "KidsTab"

// 彩虹标题
interface RainbowTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

export const RainbowTitle = React.forwardRef<HTMLHeadingElement, RainbowTitleProps>(
  ({ className, as = "h2", children, ...props }, ref) => {
    const Component = as
    return (
      <Component
        ref={ref}
        className={cn(
          "font-bold bg-gradient-to-r from-ghibli-teal via-ghibli-sunshine via-ghibli-coral to-ghibli-skyBlue bg-clip-text text-transparent",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
RainbowTitle.displayName = "RainbowTitle"

// 卡通图标按钮
interface KidsIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: "teal" | "sunshine" | "coral" | "mint" | "skyBlue" | "lavender" | "peach"
}

export const KidsIconButton = React.forwardRef<HTMLButtonElement, KidsIconButtonProps>(
  ({ className, color = "teal", children, ...props }, ref) => {
    const colorStyles = {
      teal: "bg-ghibli-teal text-white hover:bg-ghibli-teal/90 border-ghibli-teal/80",
      sunshine: "bg-ghibli-sunshine text-ghibli-brown hover:bg-ghibli-sunshine/90 border-ghibli-sunshine/80",
      coral: "bg-ghibli-coral text-white hover:bg-ghibli-coral/90 border-ghibli-coral/80",
      mint: "bg-ghibli-mint text-ghibli-deepTeal hover:bg-ghibli-mint/90 border-ghibli-mint/80",
      skyBlue: "bg-ghibli-skyBlue text-ghibli-deepTeal hover:bg-ghibli-skyBlue/90 border-ghibli-skyBlue/80",
      lavender: "bg-ghibli-lavender text-ghibli-deepTeal hover:bg-ghibli-lavender/90 border-ghibli-lavender/80",
      peach: "bg-ghibli-peach text-ghibli-brown hover:bg-ghibli-peach/90 border-ghibli-peach/80",
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center border-2 shadow-[3px_5px_0_rgba(82,72,58,0.2)]",
          "hover:shadow-[5px_7px_0_rgba(82,72,58,0.15)] hover:-translate-y-0.5 transition-all duration-300",
          colorStyles[color],
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)
KidsIconButton.displayName = "KidsIconButton"

// 课程进度卡片
interface CourseProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  progress: number
  totalModules: number
  completedModules: number
}

export const CourseProgressCard = React.forwardRef<HTMLDivElement, CourseProgressCardProps>(
  ({ className, title, progress, totalModules, completedModules, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-ghibli-parchment rounded-3xl shadow-md border-2 border-ghibli-sand p-5",
        "hover:shadow-lg hover:border-ghibli-teal/50 transition-all duration-300",
        "shadow-[4px_6px_0_rgba(82,72,58,0.2)] hover:shadow-[6px_8px_0_rgba(82,72,58,0.15)] hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      <h3 className="text-xl font-bold text-ghibli-brown mb-3">{title}</h3>
      <div className="h-5 bg-ghibli-sand rounded-full overflow-hidden border border-ghibli-teal/30 mb-2">
        <div 
          className="h-full bg-gradient-to-r from-ghibli-teal to-ghibli-skyBlue transition-all duration-700 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center text-sm">
        <span className="text-ghibli-brown">{completedModules} / {totalModules} 模块完成</span>
        <span className="font-medium text-ghibli-deepTeal">{progress}%</span>
      </div>
    </div>
  )
)
CourseProgressCard.displayName = "CourseProgressCard"
