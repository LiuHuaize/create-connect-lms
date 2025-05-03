import React from 'react';
import { CalendarClock } from 'lucide-react';

interface ActivityItemProps {
  title: string;
  date: string;
  time: string;
  tags?: string[];
  isOnline?: boolean;
}

export function ActivityItem({
  title,
  date,
  time,
  tags = [],
  isOnline = false
}: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="flex-shrink-0 bg-gradient-to-br from-accent/20 to-accent/5 p-2 rounded-lg">
        <CalendarClock className="h-5 w-5 text-accent-foreground/70" />
      </div>
      
      <div className="flex-1">
        <h4 className="font-medium text-foreground mb-1 line-clamp-1">{title}</h4>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="date-display">
            {date}, {time}
          </span>
          
          {isOnline && (
            <span className="inline-block bg-primary/10 text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
              线上
            </span>
          )}
          
          {tags.map((tag, index) => (
            <span 
              key={index}
              className="inline-block bg-secondary/10 text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
} 