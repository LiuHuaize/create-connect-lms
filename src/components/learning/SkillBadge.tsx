import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SkillVariant = 'primary' | 'secondary' | 'accent';

interface SkillBadgeProps {
  label: string;
  variant?: SkillVariant;
  className?: string;
}

const variantStyles = {
  primary: "bg-primary/20 text-primary-foreground",
  secondary: "bg-secondary/20 text-secondary-foreground",
  accent: "bg-accent/20 text-accent-foreground"
};

export function SkillBadge({ 
  label, 
  variant = 'secondary',
  className
}: SkillBadgeProps) {
  return (
    <Badge 
      className={cn(
        "skill-tag font-medium rounded-full px-3 py-1 hover:opacity-80 transition-opacity",
        variantStyles[variant],
        className
      )}
    >
      {label}
    </Badge>
  );
} 