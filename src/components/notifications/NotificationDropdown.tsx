import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCheck, 
  Eye, 
  Bell, 
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';
import { Notification } from '@/types/notification';

interface NotificationDropdownProps {
  onClose?: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onClose
}) => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAllAsRead 
  } = useNotificationStore();
  
  // 显示最近的通知（最多10条）
  const recentNotifications = notifications.slice(0, 10);
  const hasUnread = unreadCount > 0;
  
  const handleNotificationClick = (notification: Notification) => {
    // 根据通知类型和相关数据进行路由跳转
    if (notification.action_data?.url) {
      window.open(notification.action_data.url, '_blank');
    } else if (notification.related_entity_type && notification.related_entity_id) {
      // 根据实体类型构建路由
      switch (notification.related_entity_type) {
        case 'course':
          navigate(`/course/${notification.related_entity_id}`);
          break;
        case 'lesson':
          // 课程路由需要courseId，从metadata或action_data中获取
          const courseId = notification.metadata?.course_id || notification.action_data?.course_id;
          if (courseId) {
            navigate(`/course/${courseId}/lesson/${notification.related_entity_id}`);
          } else {
            navigate('/notifications');
          }
          break;
        case 'submission':
          navigate(`/submissions/${notification.related_entity_id}`);
          break;
        case 'assignment':
          navigate(`/assignments/${notification.related_entity_id}`);
          break;
        default:
          // 默认跳转到通知列表页
          navigate('/notifications');
          break;
      }
    } else {
      // 没有具体跳转目标，跳转到通知列表页
      navigate('/notifications');
    }
    
    onClose?.();
  };
  
  const handleViewAll = () => {
    navigate('/notifications');
    onClose?.();
  };
  
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };
  
  if (isLoading) {
    return (
      <div className="w-80 h-96 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-80 bg-white rounded-lg shadow-lg border">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">通知</h3>
          {hasUnread && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              全部已读
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="h-7 px-2 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            查看全部
          </Button>
        </div>
      </div>
      
      {/* 通知列表 */}
      <div className="max-h-96">
        {recentNotifications.length > 0 ? (
          <ScrollArea className="h-full">
            <div className="divide-y">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id} className="hover:bg-gray-50">
                  <NotificationItem
                    notification={notification}
                    onClick={handleNotificationClick}
                    compact={true}
                  />
                  {index < recentNotifications.length - 1 && (
                    <Separator className="ml-12" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">暂无通知</p>
            <p className="text-xs text-gray-400">
              当有新的作业提交或评分时，您会收到通知
            </p>
          </div>
        )}
      </div>
      
      {/* 底部操作 */}
      {recentNotifications.length > 0 && (
        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={handleViewAll}
          >
            查看所有通知
            <MoreHorizontal className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};