import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { notificationService, notificationHelpers } from '@/services/notificationService';
import { getCurrentUser } from '@/utils/userSession';
import { v4 as uuidv4 } from 'uuid';
import { 
  Notification, 
  CreateNotificationData, 
  NotificationStats 
} from '@/types/notification';

const TestNotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setMessage('');
    } else {
      setMessage(msg);
      setError('');
    }
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const handleCreateTestNotification = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const testData: CreateNotificationData = {
        recipient_id: currentUser.id,
        type: 'system_announcement',
        title: '测试通知',
        message: '这是一条测试通知消息，用于验证通知系统功能',
        priority: 2,
        metadata: {
          test: true,
          created_by: 'test_function'
        }
      };

      const result = await notificationService.createNotification(testData);
      
      if (result.success) {
        showMessage('测试通知创建成功');
        await loadNotifications();
      } else {
        showMessage(`创建通知失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`创建通知异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeriesNotification = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const testData = {
        student_name: '测试学生',
        course_title: '测试课程',
        questionnaire_title: '测试系列问答',
        submission_id: uuidv4(),
        course_id: uuidv4(),
        lesson_id: uuidv4()
      };

      const result = await notificationHelpers.notifySeriesSubmission(
        currentUser.id,
        testData
      );
      
      if (result.success) {
        showMessage('系列问答通知创建成功');
        await loadNotifications();
      } else {
        showMessage(`创建系列问答通知失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`创建系列问答通知异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const result = await notificationService.getNotifications(currentUser.id, {
        limit: 10,
        order_by: 'created_at',
        order_direction: 'desc'
      });
      
      if (result.success && result.data) {
        setNotifications(result.data);
        showMessage('通知列表加载成功');
      } else {
        showMessage(`加载通知列表失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`加载通知列表异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const result = await notificationService.getNotificationStats(currentUser.id);
      
      if (result.success && result.data) {
        setStats(result.data);
        showMessage('通知统计加载成功');
      } else {
        showMessage(`加载通知统计失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`加载通知统计异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setLoading(true);
    try {
      const result = await notificationService.markAsRead(notificationId);
      
      if (result.success) {
        showMessage('通知已标记为已读');
        await loadNotifications();
      } else {
        showMessage(`标记已读失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`标记已读异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const result = await notificationService.markAllAsRead(currentUser.id);
      
      if (result.success) {
        showMessage('所有通知已标记为已读');
        await loadNotifications();
      } else {
        showMessage(`标记所有通知已读失败: ${result.error?.message}`, true);
      }
    } catch (error) {
      showMessage(`标记所有通知已读异常: ${error instanceof Error ? error.message : '未知错误'}`, true);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return 'bg-red-500';
      case 4: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 2: return 'bg-blue-500';
      case 1: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>通知系统测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleCreateTestNotification}
              disabled={loading}
            >
              创建测试通知
            </Button>
            
            <Button 
              onClick={handleCreateSeriesNotification}
              disabled={loading}
            >
              创建系列问答通知
            </Button>
            
            <Button 
              onClick={loadNotifications}
              disabled={loading}
            >
              加载通知列表
            </Button>
            
            <Button 
              onClick={loadStats}
              disabled={loading}
            >
              加载通知统计
            </Button>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button 
                onClick={handleMarkAllAsRead}
                disabled={loading}
                variant="outline"
              >
                标记所有为已读
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知统计 */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>通知统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_count}</div>
                <div className="text-sm text-gray-600">总通知数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unread_count}</div>
                <div className="text-sm text-gray-600">未读通知</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.last_7_days_count}</div>
                <div className="text-sm text-gray-600">最近7天</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(stats.priority_counts).length}
                </div>
                <div className="text-sm text-gray-600">优先级类型</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 通知列表 */}
      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无通知，点击上方按钮创建测试通知
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 rounded-lg border ${
                    notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <Badge variant="outline">{notification.type}</Badge>
                        <Badge 
                          className={`text-white ${getPriorityColor(notification.priority)}`}
                        >
                          P{notification.priority}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="destructive">未读</Badge>
                        )}
                      </div>
                      <p className="text-gray-700 mb-2">{notification.message}</p>
                      <div className="text-sm text-gray-500">
                        创建时间: {formatDate(notification.created_at)}
                        {notification.read_at && (
                          <span className="ml-4">
                            已读时间: {formatDate(notification.read_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={loading}
                      >
                        标记已读
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNotificationPage;