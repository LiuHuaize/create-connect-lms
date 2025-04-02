
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const profileSchema = z.object({
  username: z.string().min(2, "用户名至少需要2个字符"),
  age: z.string().refine((val) => !val || !isNaN(parseInt(val)), {
    message: "年龄必须是数字",
  }),
  location: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage: React.FC = () => {
  const { user, refreshUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      age: "",
      location: "",
      bio: "",
    },
  });

  // 获取用户资料
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data);
          form.reset({
            username: data.username || "",
            age: data.age ? String(data.age) : "",
            location: data.location || "",
            bio: data.bio || "",
          });
        }
      } catch (error) {
        console.error('获取用户资料错误:', error);
        toast({
          title: "获取资料失败",
          description: "无法加载您的个人资料",
          variant: "destructive",
        });
      }
    };
    
    fetchProfile();
  }, [user, form, toast]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const updates = {
        id: user.id,
        username: values.username,
        age: values.age ? parseInt(values.age) : null,
        location: values.location,
        bio: values.bio,
        updated_at: new Date().toISOString(),
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "资料已更新",
        description: "您的个人资料已成功更新",
      });
      
      // 刷新用户角色，以防资料变更影响角色
      await refreshUserRole();
      
    } catch (error) {
      console.error('更新资料错误:', error);
      toast({
        title: "更新失败",
        description: "无法更新您的个人资料",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="输入您的用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>年龄</FormLabel>
                  <FormControl>
                    <Input placeholder="输入您的年龄" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所在地</FormLabel>
                  <FormControl>
                    <Input placeholder="输入您的所在地" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>个人简介</FormLabel>
                  <FormControl>
                    <Input placeholder="简单介绍一下自己" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "保存中..." : "保存资料"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProfilePage;
