import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-[0px_4px_12px_rgba(41,121,255,0.15)] hover:-translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-[0px_4px_12px_rgba(239,68,68,0.15)] hover:-translate-y-0.5",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 状态按钮变体
        inProgress: "bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg shadow-blue-500/20",
        completed: "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg shadow-green-500/20",
        saved: "bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg shadow-purple-500/20",
        // 柔和的状态按钮
        inProgressSoft: "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200",
        completedSoft: "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200",
        savedSoft: "bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200",
        macaron: "bg-macaron-pink text-white border-2 border-macaron-pink/80 hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(156,54,93,0.2)] hover:shadow-[6px_8px_0_rgba(156,54,93,0.15)] hover:-translate-y-0.5",
        macaronMint: "bg-macaron-mint text-macaron-deepMint border-2 border-macaron-mint/80 hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(42,125,101,0.2)] hover:shadow-[6px_8px_0_rgba(42,125,101,0.15)] hover:-translate-y-0.5",
        macaronLavender: "bg-macaron-lavender text-macaron-deepLavender border-2 border-macaron-lavender/80 hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(105,51,176,0.2)] hover:shadow-[6px_8px_0_rgba(105,51,176,0.15)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
