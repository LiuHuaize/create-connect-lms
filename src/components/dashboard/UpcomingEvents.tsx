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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-medium">即将举行的活动</CardTitle>
          <CalendarDays className="h-5 w-5 text-connect-blue" />
        </div>
        <CardDescription>最近的学习活动</CardDescription>
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
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.title}</span>
                    <Badge variant={event.type === 'online' ? 'default' : 'outline'}>
                      {event.type === 'online' ? '线上' : '线下'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatEventDate(event.date)}
                  </p>
                </div>
                <Link to={`/events/${event.id}`}>
                  <div className="text-xs text-connect-blue hover:underline">
                    详情
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-sm text-gray-500 mb-2">您暂无即将举行的活动</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/events">浏览活动</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents; 