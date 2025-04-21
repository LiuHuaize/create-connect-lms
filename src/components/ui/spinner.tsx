import React from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = "md", 
  className 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <Clock 
      className={cn(
        "animate-spin text-connect-blue", 
        sizeClasses[size], 
        className
      )} 
    />
  );
}; 