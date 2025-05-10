import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ResourceUploader from './ResourceUploader';
import ResourceList from './ResourceList';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  download_count: number;
  created_at: string;
}

interface ResourceManagerProps {
  moduleId: string;
  courseId: string;
}

export function ResourceManager({ moduleId, courseId }: ResourceManagerProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState('resources');
  
  // 加载模块资源
  const loadResources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // @ts-ignore - Supabase类型定义中没有course_resources表
      const { data, error } = await supabase
        .from('course_resources')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`加载资源失败: ${error.message}`);
      }
      
      // @ts-ignore - 类型定义不完全匹配，但实际数据结构是兼容的
      setResources(data || []);
    } catch (err) {
      console.error('加载资源时出错:', err);
      setError(err instanceof Error ? err.message : '加载资源失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 刷新资源列表
  const refreshResources = async () => {
    setIsRefreshing(true);
    await loadResources();
    setIsRefreshing(false);
  };
  
  // 处理资源上传完成
  const handleResourceUploaded = (resource: Resource) => {
    setResources(prev => [resource, ...prev]);
    setShowUploader(false);
    setActiveTab('resources');
  };
  
  // 处理资源删除
  const handleResourceDeleted = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
  };
  
  // 处理资源下载
  const handleResourceDownloaded = (resourceId: string) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, download_count: (r.download_count || 0) + 1 } 
        : r
    ));
  };
  
  // 初始加载
  useEffect(() => {
    if (moduleId) {
      // 清空之前的资源，确保不会显示旧模块的资源
      setResources([]);
      loadResources();
    }
  }, [moduleId]);
  
  // 切换到上传模式
  const handleAddResource = () => {
    setShowUploader(true);
    setActiveTab('upload');
  };
  
  // 取消上传
  const handleCancelUpload = () => {
    setShowUploader(false);
    setActiveTab('resources');
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>资源管理</CardTitle>
            <CardDescription>管理课程的学习资料和下载文件</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshResources}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              刷新
            </Button>
            
            {!showUploader && (
              <Button
                size="sm"
                onClick={handleAddResource}
              >
                <Plus className="mr-2 h-4 w-4" />
                添加资源
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="resources">资源列表</TabsTrigger>
            {showUploader && (
              <TabsTrigger value="upload">上传资源</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="resources">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={refreshResources}
                >
                  重试
                </Button>
              </div>
            ) : (
              <ResourceList
                resources={resources}
                onResourceDeleted={handleResourceDeleted}
                onResourceDownloaded={handleResourceDownloaded}
              />
            )}
          </TabsContent>
          
          {showUploader && (
            <TabsContent value="upload">
              <div className="space-y-4">
                <ResourceUploader
                  moduleId={moduleId}
                  courseId={courseId}
                  onResourceUploaded={handleResourceUploaded}
                />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    onClick={handleCancelUpload}
                  >
                    取消
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ResourceManager; 