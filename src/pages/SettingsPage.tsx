
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const settingsSchema = z.object({
  timezone: z.string().min(1, "请选择时区"),
  language: z.string().min(1, "请选择语言"),
  emailNotifications: z.boolean().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const timezones = [
  { value: "Asia/Shanghai", label: "中国标准时间 (UTC+8)" },
  { value: "Asia/Hong_Kong", label: "香港时间 (UTC+8)" },
  { value: "Asia/Tokyo", label: "日本标准时间 (UTC+9)" },
  { value: "America/New_York", label: "美国东部时间 (UTC-5/UTC-4)" },
  { value: "Europe/London", label: "格林威治标准时间 (UTC+0)" },
  { value: "Europe/Paris", label: "中欧时间 (UTC+1)" },
];

const languages = [
  { value: "zh-CN", label: "简体中文" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
];

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: "Asia/Shanghai",
      language: "zh-CN",
      emailNotifications: false,
    },
  });

  // 获取用户设置
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data && data.settings) {
          setUserSettings(data.settings);
          form.reset({
            timezone: data.settings.timezone || "Asia/Shanghai",
            language: data.settings.language || "zh-CN",
            emailNotifications: data.settings.emailNotifications || false,
          });
        }
      } catch (error) {
        console.error('获取用户设置错误:', error);
        toast({
          title: "获取设置失败",
          description: "无法加载您的设置",
          variant: "destructive",
        });
      }
    };
    
    fetchSettings();
  }, [user, form, toast]);

  const onSubmit = async (values: SettingsFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      const existingSettings = existingProfile?.settings || {};
      const updatedSettings = {
        ...existingSettings,
        timezone: values.timezone,
        language: values.language,
        emailNotifications: values.emailNotifications,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "设置已更新",
        description: "您的设置已成功保存",
      });
      
      setUserSettings(updatedSettings);
      
    } catch (error) {
      console.error('更新设置错误:', error);
      toast({
        title: "更新失败",
        description: "无法保存您的设置",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
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
      </div>
    </div>
  );
};

export default SettingsPage;
