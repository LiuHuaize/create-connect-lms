
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | null>(null)

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, value, onValueChange, defaultValue, ...props }, ref) => {
  // Create local state if value and onValueChange are not provided
  const [localValue, setLocalValue] = React.useState(defaultValue || "")
  
  // Use either controlled (value + onValueChange) or uncontrolled (localValue + setLocalValue)
  const contextValue = React.useMemo(() => ({
    value: value !== undefined ? value : localValue,
    onValueChange: onValueChange || setLocalValue,
  }), [value, onValueChange, localValue]);

  return (
    <TabsContext.Provider value={contextValue}>
      <TabsPrimitive.Root
        ref={ref}
        className={cn(className)}
        value={contextValue.value}
        onValueChange={contextValue.onValueChange}
        defaultValue={defaultValue}
        {...props}
      />
    </TabsContext.Provider>
  )
})
Tabs.displayName = TabsPrimitive.Root.displayName

// Custom hook to access the TabsContext
const useTabsContext = () => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs compound components must be used within a Tabs component")
  }
  return context
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
    forceMount?: boolean
  }
>(({ className, forceMount, ...props }, ref) => {
  // We can use our context here even outside the TabsPrimitive.Root
  useTabsContext();
  
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      forceMount={forceMount}
      {...props}
    />
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent, useTabsContext }
