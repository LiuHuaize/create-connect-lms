import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 导入拆分后的组件
import GeneralSettings from '@/components/settings/GeneralSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import CacheManager from '@/components/settings/CacheManager';

// 定义声明，使TypeScript知道window上有clearCaches方法
declare global {
  interface Window {
    clearCaches?: () => Promise<void>;
  }
}

export interface UserSettings {
  timezone: string;
  language: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  
  useEffect(() => {
    // 模拟从服务器加载用户设置
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        // 这里应该是从API获取，这里用模拟数据
        await new Promise(resolve => setTimeout(resolve, 500));
        const settings = {
          timezone: "UTC+8",
          language: "zh-CN",
        };
        
        setUserSettings(settings);
      } catch (error) {
        console.error("加载设置失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadSettings();
    }
  }, [user]);
  
  const handleSettingsUpdate = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <div className="grid gap-6">
        {/* 账户设置 */}
        <Card>
          <CardHeader>
            <CardTitle>账户设置</CardTitle>
            <CardDescription>管理账户的基本设置与偏好</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general">
              <TabsList className="mb-6 w-full">
                <TabsTrigger value="general" className="flex-1">基本设置</TabsTrigger>
                <TabsTrigger value="notifications" className="flex-1">通知设置</TabsTrigger>
                <TabsTrigger value="security" className="flex-1">账号安全</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general">
                <GeneralSettings 
                  userSettings={userSettings} 
                  isLoading={isLoading} 
                  onSettingsUpdate={handleSettingsUpdate} 
                />
              </TabsContent>
              
              <TabsContent value="notifications">
                <NotificationSettings />
              </TabsContent>
              
              <TabsContent value="security">
                <SecuritySettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* 缓存管理 */}
        <CacheManager />
      </div>
    </div>
  );
};

export default SettingsPage;
