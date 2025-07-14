import { create } from 'zustand';
import { Notification, GetNotificationsOptions, NotificationStats } from '@/types/notification';
import { notificationService } from '@/services/notificationService';
import { getCurrentUser } from '@/utils/userSession';

interface NotificationState {
  // 状态
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMoreNotifications: boolean;
  stats: NotificationStats | null;
  
  // 方法
  fetchNotifications: (options?: GetNotificationsOptions) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  
  // 内部方法
  setLoading: (loading: boolean) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  setStats: (stats: NotificationStats) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasMoreNotifications: true,
  stats: null,
  
  setLoading: (loading) => set({ isLoading: loading }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setStats: (stats) => set({ stats }),
  
  fetchNotifications: async (options = {}) => {
    const { isLoading } = get();
    if (isLoading) return;
    
    set({ isLoading: true });
    
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        set({ isLoading: false });
        return;
      }

      const result = await notificationService.getNotifications(currentUser.id, options);
      
      if (result.success && result.data) {
        if (options.offset === 0 || !options.offset) {
          set({ notifications: result.data });
        } else {
          const { notifications } = get();
          set({ notifications: [...notifications, ...result.data] });
        }
        
        set({ hasMoreNotifications: result.data.length >= (options.limit || 10) });
      } else {
        console.error('获取通知失败:', result.error);
      }
      
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchUnreadCount: async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const result = await notificationService.getUnreadCount(currentUser.id);
      
      if (result.success && typeof result.data === 'number') {
        set({ unreadCount: result.data });
      } else {
        console.error('获取未读通知数量失败:', result.error);
      }
      
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
    }
  },
  
  markAsRead: async (notificationId: string) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success && result.data) {
        // 更新本地状态
        const { notifications, unreadCount } = get();
        const updatedNotifications = notifications.map(notification => {
          if (notification.id === notificationId) {
            return result.data;
          }
          return notification;
        });
        
        const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
        const newUnreadCount = wasUnread ? Math.max(0, unreadCount - 1) : unreadCount;
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: newUnreadCount
        });
      } else {
        console.error('标记通知为已读失败:', result.error);
      }
      
    } catch (error) {
      console.error('标记通知为已读失败:', error);
    }
  },
  
  markAllAsRead: async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const result = await notificationService.markAllAsRead(currentUser.id);
      
      if (result.success) {
        // 更新本地状态
        const { notifications } = get();
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        set({ 
          notifications: updatedNotifications,
          unreadCount: 0
        });
      } else {
        console.error('标记所有通知为已读失败:', result.error);
      }
      
    } catch (error) {
      console.error('标记所有通知为已读失败:', error);
    }
  },
  
  deleteNotification: async (notificationId: string) => {
    try {
      const result = await notificationService.deleteNotification(notificationId);
      
      if (result.success) {
        // 更新本地状态
        const { notifications, unreadCount } = get();
        const notificationToDelete = notifications.find(n => n.id === notificationId);
        const filteredNotifications = notifications.filter(n => n.id !== notificationId);
        const newUnreadCount = notificationToDelete && !notificationToDelete.is_read 
          ? Math.max(0, unreadCount - 1) 
          : unreadCount;
        
        set({ 
          notifications: filteredNotifications,
          unreadCount: newUnreadCount
        });
      } else {
        console.error('删除通知失败:', result.error);
      }
      
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  },
  
  addNotification: (notification: Notification) => {
    const { notifications, unreadCount } = get();
    const newNotifications = [notification, ...notifications];
    const newUnreadCount = notification.is_read ? unreadCount : unreadCount + 1;
    
    set({ 
      notifications: newNotifications,
      unreadCount: newUnreadCount
    });
  },
  
  clearNotifications: () => {
    set({ 
      notifications: [],
      unreadCount: 0,
      hasMoreNotifications: true,
      stats: null
    });
  }
}));