import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { getCurrentUser } from '@/utils/userSession';

interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  size = 'md'
}) => {
  const { unreadCount, fetchUnreadCount, fetchNotifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 组件加载时获取未读数量
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const initializeNotifications = async () => {
      // 检查用户是否已登录
      const user = await getCurrentUser();
      if (!user) {
        return;
      }
      
      fetchUnreadCount();
      
      // 设置定时轮询未读数量（每30秒）
      interval = setInterval(async () => {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          fetchUnreadCount();
        }
      }, 30000);
    };
    
    initializeNotifications();
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [fetchUnreadCount]);
  
  // 当未读数量变化时触发动画
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);
  
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // 检查用户是否已登录
      const user = await getCurrentUser();
      if (user) {
        // 打开时刷新通知列表
        fetchNotifications({ limit: 10, offset: 0 });
      }
    }
  };
  
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const buttonSizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'relative rounded-full',
            buttonSizes[size],
            className
          )}
        >
          <Bell className={cn(
            iconSizes[size],
            isAnimating && 'animate-pulse',
            unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'
          )} />
          
          {/* 未读数量徽章 */}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                'absolute -top-1 -right-1 min-w-5 h-5 text-xs px-1 rounded-full',
                'flex items-center justify-center',
                'animate-in fade-in-0 zoom-in-95',
                isAnimating && 'animate-bounce'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          
          {/* 新通知指示器 */}
          {unreadCount > 0 && (
            <div
              className={cn(
                'absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full',
                'animate-ping',
                isAnimating ? 'opacity-75' : 'opacity-0'
              )}
            />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-80 p-0 border-0 shadow-lg"
        align="end"
        sideOffset={8}
      >
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};