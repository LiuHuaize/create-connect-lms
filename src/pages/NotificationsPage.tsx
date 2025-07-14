import React from 'react';
import { NotificationList } from '@/components/notifications/NotificationList';
import { Bell } from 'lucide-react';

const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">我的通知</h1>
        </div>
        <p className="text-gray-600">
          查看您的所有通知消息，包括作业提交、评分反馈和系统提醒
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <NotificationList />
      </div>
    </div>
  );
};

export default NotificationsPage;