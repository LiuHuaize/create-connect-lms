// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Download, File, FileText, FileImage, FileSpreadsheet, Search, Info, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lesson, ResourceFile } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { courseService } from '@/services/courseService';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 存储桶名称
const STORAGE_BUCKET = 'course-assets';

// 自定义类型断言
const courseResourcesTable = supabase.from('course_resources') as unknown as ReturnType<typeof supabase.from<Record<string, any>>>;

interface ResourceLessonViewProps {
  lesson: Lesson;
  onComplete?: () => void;
  isCompleted?: boolean;
  courseId?: string;
  enrollmentId?: string | null;
}

export function ResourceLessonView({ lesson, onComplete, isCompleted = false, courseId, enrollmentId }: ResourceLessonViewProps) {
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [localIsCompleted, setLocalIsCompleted] = useState(isCompleted);
  
  // 加载资源
  useEffect(() => {
    const loadResources = async () => {
      if (!lesson.module_id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // @ts-ignore - Supabase类型定义中没有course_resources表
        const { data, error } = await supabase
          .from('course_resources')
          .select('*')
          .eq('module_id', lesson.module_id)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(`加载资源失败: ${error.message}`);
        }
        
        // 转换数据
        const resourceFiles: ResourceFile[] = (data || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          filePath: item.file_path,
          fileName: item.file_name,
          fileType: item.file_type,
          fileSize: item.file_size,
          downloadCount: item.download_count
        }));
        
        setResources(resourceFiles);
      } catch (err) {
        console.error('加载资源时出错:', err);
        setError(err instanceof Error ? err.message : '加载资源失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResources();
  }, [lesson.module_id]);

  // 当isCompleted属性变化时，更新本地状态
  useEffect(() => {
    setLocalIsCompleted(isCompleted);
  }, [isCompleted]);
  
  // 根据文件类型获取图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <FileImage className="text-blue-500 h-8 w-8" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="text-red-500 h-8 w-8" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
      return <FileSpreadsheet className="text-green-500 h-8 w-8" />;
    } else {
      return <File className="text-gray-500 h-8 w-8" />;
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
  };
  
  // 下载资源
  const handleDownload = async (resource: ResourceFile) => {
    try {
      // 获取文件URL
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(resource.filePath);
      
      // 打开下载链接
      window.open(data.publicUrl, '_blank');
      
      // 增加下载计数
      // @ts-ignore - Supabase类型定义中没有course_resources表
      await supabase
        .from('course_resources')
        .update({
          download_count: (resource.downloadCount || 0) + 1
        })
        .eq('id', resource.id);
      
      // 标记为已完成
      if (onComplete && !localIsCompleted) {
        onComplete();
        setLocalIsCompleted(true);
      }
    } catch (err) {
      console.error('下载失败:', err);
    }
  };

  // 处理标记完成或取消完成
  const handleToggleComplete = async () => {
    if (!enrollmentId || !lesson.id || !courseId) {
      toast.error('无法执行此操作');
      return;
    }
    
    setIsCompletionLoading(true);
    
    try {
      if (localIsCompleted) {
        // 取消完成
        await courseService.unmarkLessonComplete(lesson.id);
        toast.success('已取消标记完成');
        setLocalIsCompleted(false);
      } else {
        // 标记完成
        await courseService.markLessonComplete(
          lesson.id,
          courseId,
          enrollmentId
        );
        toast.success('课时已标记为完成');
        setLocalIsCompleted(true);
        
        // 如果有onComplete回调，也调用它
        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('更新完成状态失败:', error);
      toast.error(localIsCompleted ? '取消标记失败' : '标记完成失败');
    } finally {
      setIsCompletionLoading(false);
    }
  };
  
  // 筛选资源
  const filteredResources = resources.filter(resource => {
    const searchLower = searchTerm.toLowerCase();
    return (
      resource.title.toLowerCase().includes(searchLower) ||
      resource.fileName.toLowerCase().includes(searchLower) ||
      (resource.description && resource.description.toLowerCase().includes(searchLower))
    );
  });
  
  // 渲染描述内容
  const renderDescription = () => {
    if (!lesson.content || !('description' in lesson.content) || !lesson.content.description) {
      return null;
    }

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium mb-1">关于这些资源</h3>
            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {lesson.content.description}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染搜索和筛选
  const renderSearch = () => {
    if (resources.length === 0) return null;
    
    return (
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="搜索资源..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    );
  };
  
  // 渲染加载状态
  const renderLoading = () => {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    );
  };
  
  // 渲染错误状态
  const renderError = () => {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-2">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  };
  
  // 渲染空状态
  const renderEmpty = () => {
    return (
      <div className="text-center py-10">
        <File className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-1">暂无可下载资源</h3>
        <p className="text-sm text-gray-500">
          教师尚未添加任何可下载资源。
        </p>
      </div>
    );
  };
  
  // 渲染资源列表
  const renderResourceList = () => {
    if (filteredResources.length === 0 && searchTerm) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500">没有找到匹配"{searchTerm}"的资源</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredResources.map(resource => (
          <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getFileIcon(resource.fileType)}
                  <div className="space-y-1">
                    <h4 className="font-medium">{resource.title}</h4>
                    {resource.description && (
                      <div className="text-sm text-gray-500 whitespace-pre-wrap">{resource.description}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center">
                        {resource.fileName}
                      </span>
                      <Badge variant="outline">{formatFileSize(resource.fileSize)}</Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">下载次数: {resource.downloadCount || 0}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>此资源已被下载 {resource.downloadCount || 0} 次</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
                <div>
                  <Button 
                    variant="outline"
                    className="gap-1"
                    onClick={() => handleDownload(resource)}
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // 渲染完成标记按钮
  const renderCompletionButton = () => {
    if (!courseId || !enrollmentId) return null;
    
    return (
      <div className="flex justify-center mt-8 pt-6 border-t border-ghibli-sand/30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                className={`transition-all ${localIsCompleted 
                  ? 'bg-ghibli-peach hover:bg-ghibli-coral text-ghibli-brown' 
                  : 'bg-ghibli-teal hover:bg-ghibli-deepTeal text-white'
                }`}
                onClick={handleToggleComplete}
                disabled={isCompletionLoading}
              >
                {localIsCompleted ? (
                  <>
                    取消完成标记
                    <X size={18} className="ml-2" />
                  </>
                ) : (
                  <>
                    标记为已完成
                    <Check size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-80 border-ghibli-sand bg-ghibli-parchment">
              <div className="text-sm">
                <h4 className="font-medium mb-2 text-ghibli-deepTeal">
                  {localIsCompleted ? '取消完成标记' : '完成课时'}
                </h4>
                <p className="text-ghibli-brown">
                  {localIsCompleted 
                    ? '取消此课时的完成标记，这将影响您的学习进度。' 
                    : '标记此课时为已完成后，会更新您的学习进度，并解锁下一节课程。'
                  }
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{lesson.title}</CardTitle>
          {localIsCompleted && (
            <CardDescription>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                已完成
              </Badge>
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {renderDescription()}
          {renderSearch()}
          
          {isLoading ? (
            renderLoading()
          ) : error ? (
            renderError()
          ) : resources.length === 0 ? (
            renderEmpty()
          ) : (
            renderResourceList()
          )}
          
          {renderCompletionButton()}
        </CardContent>
      </Card>
    </div>
  );
}

export default ResourceLessonView; 