import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border-0 bg-card text-card-foreground shadow-sm transition-all duration-200",
      "dark:shadow-none dark:hover:shadow-none dark:hover:bg-card/90",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// 新增适合儿童的卡片组件
const KidsCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-ghibli-parchment rounded-3xl shadow-md border-2 border-ghibli-sand hover:shadow-lg hover:border-ghibli-teal/50 transition-all duration-300 overflow-hidden relative",
      "shadow-[4px_8px_0_rgba(82,72,58,0.2)] hover:shadow-[6px_12px_0_rgba(82,72,58,0.15)] hover:-translate-y-1",
      className
    )}
    {...props}
  />
))
KidsCard.displayName = "KidsCard"

// 彩虹边框卡片
const RainbowBorderCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { innerClassName?: string }
>(({ className, innerClassName, children, ...props }, ref) => (
  <div
    className={cn(
      "relative p-1 rounded-2xl",
      "bg-gradient-to-r from-ghibli-teal via-ghibli-sunshine via-ghibli-coral via-ghibli-grassGreen to-ghibli-skyBlue",
      className
    )}
    {...props}
  >
    <div
      ref={ref}
      className={cn(
        "bg-ghibli-parchment rounded-xl p-6 relative z-10",
        innerClassName
      )}
    >
      {children}
    </div>
  </div>
))
RainbowBorderCard.displayName = "RainbowBorderCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  KidsCard,
  RainbowBorderCard
}
