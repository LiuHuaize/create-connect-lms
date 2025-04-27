import React from 'react';
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
import { UserSettings } from '@/pages/SettingsPage';

const settingsSchema = z.object({
  timezone: z.string().min(1, { message: "请选择时区" }),
  language: z.string().min(1, { message: "请选择语言" }),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

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

interface GeneralSettingsProps {
  userSettings: UserSettings | null;
  isLoading: boolean;
  onSettingsUpdate: (settings: UserSettings) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  userSettings, 
  isLoading, 
  onSettingsUpdate 
}) => {
  const { toast } = useToast();
  
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: "UTC+8",
      language: "zh-CN",
    },
  });
  
  // 当userSettings变化时，更新表单值
  React.useEffect(() => {
    if (userSettings) {
      form.reset(userSettings);
    }
  }, [userSettings, form]);
  
  const onSubmit = async (values: SettingsFormValues) => {
    try {
      // 这里应该是API保存，这里用延迟模拟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新设置并通知父组件
      onSettingsUpdate(values);
      
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
    }
  };

  return (
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
                disabled={isLoading}
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
                disabled={isLoading}
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
  );
};

export default GeneralSettings; 