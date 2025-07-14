import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  BookOpen, 
  FileText, 
  Award, 
  Users, 
  Settings,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, NotificationType } from '@/types/notification';
import { useNotificationStore } from '@/stores/notificationStore';

interface NotificationItemProps {
  notification: Notification;
  onClick?: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
}

const notificationIcons: Record<NotificationType, React.ElementType> = {
  assignment_submitted: FileText,
  assignment_graded: FileText,
  series_submitted: BookOpen,
  series_graded: BookOpen,
  course_enrollment: Users,
  achievement_unlocked: Award,
  system_announcement: Settings
};

const notificationColors: Record<NotificationType, string> = {
  assignment_submitted: 'text-blue-600',
  assignment_graded: 'text-green-600',
  series_submitted: 'text-purple-600',
  series_graded: 'text-emerald-600',
  course_enrollment: 'text-indigo-600',
  achievement_unlocked: 'text-yellow-600',
  system_announcement: 'text-gray-600'
};

const priorityColors: Record<number, string> = {
  1: 'border-l-gray-300',
  2: 'border-l-blue-400',
  3: 'border-l-yellow-400',
  4: 'border-l-orange-400',
  5: 'border-l-red-400'
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  showActions = false,
  compact = false
}) => {
  const { markAsRead, deleteNotification } = useNotificationStore();
  
  const IconComponent = notificationIcons[notification.type] || Bell;
  const iconColor = notificationColors[notification.type] || 'text-gray-600';
  const priorityColor = priorityColors[notification.priority] || 'border-l-gray-300';
  
  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    onClick?.(notification);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };
  
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return '刚刚';
    }
  };
  
  return (
    <div
      className={cn(
        'group border-l-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer',
        priorityColor,
        !notification.is_read && 'bg-blue-50 hover:bg-blue-100',
        compact ? 'p-3' : 'p-4'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={cn(
          'flex-shrink-0 rounded-full p-2',
          !notification.is_read ? 'bg-blue-100' : 'bg-gray-100'
        )}>
          <IconComponent className={cn(
            'h-4 w-4',
            iconColor
          )} />
        </div>
        
        {/* 内容区域 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* 标题 */}
              <h4 className={cn(
                'text-sm truncate',
                !notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
              )}>
                {notification.title}
              </h4>
              
              {/* 消息内容 */}
              <p className={cn(
                'text-sm text-gray-600 mt-1',
                compact ? 'line-clamp-1' : 'line-clamp-2'
              )}>
                {notification.message}
              </p>
              
              {/* 时间和优先级 */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(notification.created_at)}
                </span>
                
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
                
                {notification.priority > 3 && (
                  <Badge variant="destructive" className="text-xs px-1 py-0">
                    高优先级
                  </Badge>
                )}
              </div>
            </div>
            
            {/* 操作按钮 */}
            {showActions && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {notification.action_data?.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.action_data.url, '_blank');
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};