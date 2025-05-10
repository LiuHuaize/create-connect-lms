import React, { useState } from 'react';
import { Download, Trash2, File, FileText, FileImage, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

// 存储桶名称
const STORAGE_BUCKET = 'course-assets';

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

interface ResourceListProps {
  resources: Resource[];
  onResourceDeleted: (resourceId: string) => void;
  onResourceDownloaded: (resourceId: string) => void;
}

export function ResourceList({ resources, onResourceDeleted, onResourceDownloaded }: ResourceListProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  
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
  const handleDownload = async (resource: Resource) => {
    try {
      // 获取文件URL
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(resource.file_path);
      
      // 打开下载链接
      window.open(data.publicUrl, '_blank');
      
      // 增加下载计数
      const { error } = await supabase
        .from('course_resources')
        .update({
          download_count: (resource.download_count || 0) + 1
        })
        .eq('id', resource.id);
      
      if (error) {
        console.error('更新下载计数失败:', error);
      } else {
        // 通知父组件
        onResourceDownloaded(resource.id);
      }
    } catch (err) {
      console.error('下载失败:', err);
    }
  };
  
  // 准备删除资源
  const confirmDelete = (resource: Resource) => {
    setResourceToDelete(resource);
  };
  
  // 关闭删除对话框
  const cancelDelete = () => {
    setResourceToDelete(null);
  };
  
  // 删除资源
  const deleteResource = async () => {
    if (!resourceToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }
      
      // 调用 RPC 函数删除资源
      const { data, error } = await supabase.rpc('delete_resource', {
        resource_id: resourceToDelete.id,
        user_id: user.id
      });
      
      if (error) {
        throw new Error(`删除资源失败: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('删除失败：可能没有权限或资源不存在');
      }
      
      // 然后从存储中删除文件
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([resourceToDelete.file_path]);
      
      if (storageError) {
        console.error('从存储中删除文件失败:', storageError);
        // 即使存储删除失败，我们也继续，因为数据库记录已被删除
      }
      
      // 通知父组件
      onResourceDeleted(resourceToDelete.id);
    } catch (err) {
      console.error('删除资源时出错:', err);
    } finally {
      setIsDeleting(false);
      setResourceToDelete(null);
    }
  };
  
  // 如果没有资源，显示空状态
  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无资源，请上传资源文件。</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        {resources.map(resource => (
          <Card key={resource.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getFileIcon(resource.file_type)}
                  <div className="space-y-1">
                    <h4 className="font-medium">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-sm text-gray-500">{resource.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{resource.file_name}</span>
                      <span>{formatFileSize(resource.file_size)}</span>
                      <span>下载: {resource.download_count || 0}次</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleDownload(resource)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => confirmDelete(resource)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <AlertDialog open={!!resourceToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除资源 "{resourceToDelete?.title}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteResource}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default ResourceList; 