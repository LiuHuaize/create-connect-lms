import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pink" | "mint" | "lavender"
  intensity?: "light" | "medium" | "heavy"
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", intensity = "medium", ...props }, ref) => {
    const intensityStyles = {
      light: "bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm",
      medium: "bg-white/60 dark:bg-gray-800/60 backdrop-blur-md",
      heavy: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg",
    }

    const variantStyles = {
      default: "border-white/20 dark:border-gray-700/20",
      pink: "border-macaron-pink/20 dark:border-macaron-deepPink/20",
      mint: "border-macaron-mint/20 dark:border-macaron-deepMint/20",
      lavender: "border-macaron-lavender/20 dark:border-macaron-deepLavender/20",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border transition-all duration-300",
          intensityStyles[intensity],
          variantStyles[variant],
          "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.2)]",
          "hover:shadow-[0_6px_8px_-1px_rgba(0,0,0,0.1),0_4px_6px_-1px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,0.2)]",
          "hover:-translate-y-0.5",
          className
        )}
        {...props}
      />
    )
  }
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel } 