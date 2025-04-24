import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        kids: "bg-ghibli-teal text-white border-2 border-ghibli-teal/80 hover:bg-ghibli-skyBlue hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(82,72,58,0.2)] hover:shadow-[6px_8px_0_rgba(82,72,58,0.15)] hover:-translate-y-0.5",
        kidsOutline: "bg-ghibli-parchment text-ghibli-deepTeal border-2 border-ghibli-teal hover:bg-ghibli-mint hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(82,72,58,0.2)] hover:shadow-[6px_8px_0_rgba(82,72,58,0.15)] hover:-translate-y-0.5",
        kidsSunshine: "bg-ghibli-sunshine text-ghibli-brown border-2 border-ghibli-sunshine/80 hover:bg-ghibli-peach hover:scale-105 transition-all duration-300 shadow-[4px_6px_0_rgba(82,72,58,0.2)] hover:shadow-[6px_8px_0_rgba(82,72,58,0.15)] hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        kidsDefault: "h-12 px-6 py-3 rounded-full text-base",
        kidsLg: "h-14 px-8 py-4 rounded-full text-lg",
        kidsSm: "h-10 px-4 py-2 rounded-full text-sm",
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
