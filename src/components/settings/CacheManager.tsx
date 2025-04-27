import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { clearAllCaches } from "@/lib/utils";

const CacheManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
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
  );
};

export default CacheManager; 