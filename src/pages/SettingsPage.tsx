import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { clearAllCaches } from "@/lib/utils";

// 定义声明，使TypeScript知道window上有clearCaches方法
declare global {
  interface Window {
    clearCaches?: () => Promise<void>;
  }
}

const settingsSchema = z.object({
  timezone: z.string().min(1, { message: "请选择时区" }),
  language: z.string().min(1, { message: "请选择语言" }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface UserSettings {
  timezone: string;
  language: string;
}

// 时区选项
const timezones = [
  { value: "UTC+8", label: "北京时间 (UTC+8)" },
  { value: "UTC+0", label: "格林威治标准时间 (UTC+0)" },
  { value: "UTC-5", label: "东部标准时间 (UTC-5)" },
  { value: "UTC-8", label: "太平洋标准时间 (UTC-8)" },
];

// 语言选项
const languages = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: "UTC+8",
      language: "zh-CN",
    },
  });
  
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
        form.reset(settings);
      } catch (error) {
        console.error("加载设置失败:", error);
        toast({
          variant: "destructive",
          title: "加载失败",
          description: "无法加载您的设置，请稍后再试。",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadSettings();
    }
  }, [user, form, toast]);
  
  const onSubmit = async (values: SettingsFormValues) => {
    setIsLoading(true);
    try {
      // 这里应该是API保存，这里用延迟模拟
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUserSettings(values);
      toast({
        title: "设置已更新",
        description: "您的偏好设置已成功保存。",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "无法保存您的设置，请稍后再试。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      // 使用工具函数清除缓存
      const success = await clearAllCaches();
      
      if (success) {
        toast({
          title: "缓存已清除",
          description: "应用缓存已成功清除，页面将自动刷新。",
        });
        // 延迟刷新页面，让toast有时间显示
        setTimeout(() => window.location.reload(), 1500);
      } else {
        // 如果函数方法失败，使用查询参数方法
        window.location.href = `${window.location.pathname}?clear-cache=true`;
      }
    } catch (error) {
      console.error("清除缓存失败:", error);
      toast({
        variant: "destructive",
        title: "操作失败",
        description: "清除缓存时发生错误，请重试。",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <div className="grid gap-6">
        {/* 原始设置功能 */}
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
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>时区设置</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择您的时区" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map((timezone) => (
                                <SelectItem key={timezone.value} value={timezone.value}>
                                  {timezone.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>语言设置</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择您的语言" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((language) => (
                                <SelectItem key={language.value} value={language.value}>
                                  {language.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "保存中..." : "保存设置"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="notifications">
                <div className="py-4 text-center text-gray-500">
                  通知设置功能即将推出
                </div>
              </TabsContent>
              
              <TabsContent value="security">
                <div className="py-4 text-center text-gray-500">
                  安全设置功能即将推出
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* 缓存管理卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">缓存与存储</CardTitle>
            <CardDescription>管理应用程序的缓存与存储空间</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-4">
                <h3 className="text-base font-medium">清除应用缓存</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  清除缓存可以解决某些页面加载问题或不同端口间的缓存冲突。清除后，您可能需要重新登录。
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleClearCache}
                disabled={isLoading}
              >
                {isLoading ? "正在清除..." : "清除缓存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
