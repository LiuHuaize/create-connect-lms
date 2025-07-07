import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'online' | 'offline';
  location?: string;
  enrolledCount?: number;
  host?: string;
}

interface UpcomingEventsProps {
  upcomingEvents: Event[];
  loadingEvents: boolean;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ 
  upcomingEvents, 
  loadingEvents 
}) => {
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MM月dd日，HH:mm');
    } catch (e) {
      return '日期未知';
    }
  };

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">即将举行的活动</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">最近的学习活动</CardDescription>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <CalendarDays className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loadingEvents ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500">加载中...</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 1).map(event => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant="secondary" className={event.type === 'online' ? 'bg-blue-500/10 text-blue-700' : 'bg-gray-100 text-gray-700'}>
                      {event.type === 'online' ? '线上' : '线下'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(event.date)}
                  </p>
                </div>
                <Link to={`/events/${event.id}`} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  详情 →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-3">您暂无即将举行的活动</p>
            <Link to="/events" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              浏览活动 →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 