import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Bell, 
  Filter, 
  RefreshCw, 
  CheckCheck, 
  Trash2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationItem } from './NotificationItem';
import { Notification, NotificationType, GetNotificationsOptions } from '@/types/notification';

const notificationTypeLabels: Record<NotificationType, string> = {
  assignment_submitted: '作业提交',
  assignment_graded: '作业评分',
  series_submitted: '系列问答提交',
  series_graded: '系列问答评分',
  course_enrollment: '课程注册',
  achievement_unlocked: '成就解锁',
  system_announcement: '系统公告'
};

export const NotificationList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    hasMoreNotifications,
    fetchNotifications, 
    markAllAsRead,
    clearNotifications
  } = useNotificationStore();
  
  // 筛选状态
  const [filters, setFilters] = useState<GetNotificationsOptions>({
    limit: 20,
    offset: 0,
    order_by: 'created_at',
    order_direction: 'desc'
  });
  
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  
  // 初始加载通知
  useEffect(() => {
    loadNotifications(true);
  }, []);
  
  // 加载通知数据
  const loadNotifications = useCallback(async (reset = false) => {
    const options: GetNotificationsOptions = {
      ...filters,
      offset: reset ? 0 : filters.offset || 0,
      is_read: showUnreadOnly ? false : undefined,
      type: selectedType !== 'all' ? selectedType : undefined
    };
    
    if (reset) {
      setFilters(prev => ({ ...prev, offset: 0 }));
    }
    
    await fetchNotifications(options);
  }, [filters, showUnreadOnly, selectedType, fetchNotifications]);
  
  // 加载更多通知
  const loadMore = () => {
    const newOffset = (filters.offset || 0) + (filters.limit || 20);
    setFilters(prev => ({ ...prev, offset: newOffset }));
    
    const options: GetNotificationsOptions = {
      ...filters,
      offset: newOffset,
      is_read: showUnreadOnly ? false : undefined,
      type: selectedType !== 'all' ? selectedType : undefined
    };
    
    fetchNotifications(options);
  };
  
  // 筛选变化时重新加载
  useEffect(() => {
    loadNotifications(true);
  }, [showUnreadOnly, selectedType]);
  
  const handleNotificationClick = (notification: Notification) => {
    // 根据通知类型和相关数据进行路由跳转
    if (notification.action_data?.url) {
      window.open(notification.action_data.url, '_blank');
    } else if (notification.related_entity_type && notification.related_entity_id) {
      switch (notification.related_entity_type) {
        case 'course':
          navigate(`/course/${notification.related_entity_id}`);
          break;
        case 'lesson':
          navigate(`/lesson/${notification.related_entity_id}`);
          break;
        case 'submission':
          navigate(`/submissions/${notification.related_entity_id}`);
          break;
        case 'assignment':
          navigate(`/assignments/${notification.related_entity_id}`);
          break;
        default:
          break;
      }
    }
  };
  
  const handleRefresh = () => {
    loadNotifications(true);
  };
  
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };
  
  const handleClearAll = () => {
    clearNotifications();
  };
  
  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.is_read) return false;
    if (selectedType !== 'all' && notification.type !== selectedType) return false;
    return true;
  });
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadCount} 未读
            </Badge>
          )}
        </div>
      </div>
      
      {/* 筛选和操作栏 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* 筛选选项 */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="unread-only"
                  checked={showUnreadOnly}
                  onCheckedChange={setShowUnreadOnly}
                />
                <Label htmlFor="unread-only" className="text-sm">
                  仅显示未读
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as NotificationType | 'all')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    {Object.entries(notificationTypeLabels).map(([type, label]) => (
                      <SelectItem key={type} value={type}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  isLoading && 'animate-spin'
                )} />
                刷新
              </Button>
              
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  全部已读
                </Button>
              )}
              
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  清空
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 通知列表 */}
      <Card>
        <CardContent className="p-0">
          {isLoading && notifications.length === 0 ? (
            // 加载骨架屏
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  showActions={true}
                />
              ))}
              
              {/* 加载更多按钮 */}
              {hasMoreNotifications && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        加载中...
                      </>
                    ) : (
                      '加载更多'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // 空状态
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showUnreadOnly ? '没有未读通知' : '暂无通知'}
              </h3>
              <p className="text-gray-500 mb-4">
                {showUnreadOnly 
                  ? '所有通知都已阅读完毕' 
                  : '当有新的作业提交或评分时，您会在这里收到通知'
                }
              </p>
              {showUnreadOnly && (
                <Button
                  variant="outline"
                  onClick={() => setShowUnreadOnly(false)}
                >
                  查看所有通知
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};