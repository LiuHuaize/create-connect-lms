import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/utils/userSession';
import { notificationService } from '@/services/notificationService';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const TestNotificationFix: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        const results = [];
        
        if (currentUser) {
          results.push(`✅ 用户已登录: ${currentUser.email}`);
          
          // 测试获取未读通知数量
          const unreadResult = await notificationService.getUnreadCount(currentUser.id);
          if (unreadResult.success) {
            results.push(`✅ 获取未读通知数量成功: ${unreadResult.data}`);
          } else {
            results.push(`❌ 获取未读通知数量失败: ${unreadResult.error?.message}`);
          }
          
          // 测试获取通知列表
          const notificationsResult = await notificationService.getNotifications(currentUser.id);
          if (notificationsResult.success) {
            results.push(`✅ 获取通知列表成功: ${notificationsResult.data?.length || 0} 条通知`);
          } else {
            results.push(`❌ 获取通知列表失败: ${notificationsResult.error?.message}`);
          }
        } else {
          results.push('❌ 用户未登录');
          
          // 测试在未登录状态下调用通知服务
          const unreadResult = await notificationService.getUnreadCount('fake-user-id');
          if (unreadResult.success) {
            results.push(`✅ 未登录状态下获取未读通知数量成功: ${unreadResult.data}`);
          } else {
            results.push(`❌ 未登录状态下获取未读通知数量失败: ${unreadResult.error?.message}`);
          }
        }
        
        setTestResults(results);
      } catch (error) {
        console.error('测试失败:', error);
        setTestResults([`❌ 测试过程中发生错误: ${error}`]);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">通知功能修复测试</h1>
        
        {/* 通知铃铛组件测试 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">通知铃铛组件</h2>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <NotificationBell size="lg" />
            <span className="text-sm text-gray-600">
              如果用户未登录，这个组件不应该触发任何错误
            </span>
          </div>
        </div>
        
        {/* 测试结果 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">测试结果</h2>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">正在测试...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.startsWith('✅') 
                      ? 'bg-green-50 text-green-800' 
                      : 'bg-red-50 text-red-800'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 用户信息 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">用户信息</h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            {user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>登录时间:</strong> {new Date(user.last_sign_in_at).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-600">未登录状态</p>
            )}
          </div>
        </div>
        
        {/* 建议操作 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">建议操作</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 如果用户未登录，请先登录后再测试通知功能</li>
            <li>2. 如果所有测试都通过，说明通知功能已经正常工作</li>
            <li>3. 如果仍有错误，请检查浏览器控制台的详细错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestNotificationFix;