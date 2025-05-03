import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// 存储桶名称
const STORAGE_BUCKET = 'course-assets';

interface ResourceUploaderProps {
  moduleId: string;
  courseId: string;
  onResourceUploaded: (resource: {
    id: string;
    title: string;
    description: string;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
  }) => void;
}

export function ResourceUploader({ moduleId, courseId, onResourceUploaded }: ResourceUploaderProps) {
  // 文件上传状态
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // 资源信息
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 文件选择引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      // 默认使用文件名作为标题（如果标题为空）
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
      setError(null);
    }
  };

  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      // 默认使用文件名作为标题（如果标题为空）
      if (!title) {
        setTitle(droppedFile.name.split('.')[0]);
      }
      setError(null);
    }
  };

  // 移除已选文件
  const handleRemoveFile = () => {
    setFile(null);
  };

  // 上传文件
  const handleUpload = async () => {
    if (!file) {
      setError('请选择要上传的文件');
      return;
    }

    if (!title.trim()) {
      setError('请输入资源标题');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // 生成安全的文件名（避免中文字符等问题）
      const fileExtension = file.name.split('.').pop() || '';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const safeFileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // 生成文件路径
      const filePath = `courses/${courseId}/resources/${safeFileName}`;
      
      // 上传到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            setProgress(percentage);
          }
        });
      
      if (uploadError) {
        console.error('上传错误:', uploadError);
        throw new Error(`上传失败: ${uploadError.message}`);
      }
      
      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);
      
      // 创建资源记录
      const { data: resourceData, error: resourceError } = await supabase
        .from('course_resources')
        .insert([
          {
            module_id: moduleId,
            title: title,
            description: description,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type || fileExtension,
            file_size: file.size,
            order_index: 0, // 默认为0，后续可以根据需要调整
          }
        ])
        .select()
        .single();
      
      if (resourceError) {
        console.error('创建资源记录失败:', resourceError);
        throw new Error(`创建资源记录失败: ${resourceError.message}`);
      }
      
      // 通知父组件
      if (resourceData) {
        onResourceUploaded(resourceData);
      }
      
      // 清空表单
      setFile(null);
      setTitle('');
      setDescription('');
      setProgress(0);
      
    } catch (err) {
      console.error('上传过程中出错:', err);
      setError(err instanceof Error ? err.message : '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 渲染文件预览
  const renderFilePreview = () => {
    if (!file) return null;
    
    return (
      <Card className="mt-4 overflow-hidden">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="text-blue-500 h-8 w-8" />
              <div className="space-y-1">
                <p className="text-sm font-medium line-clamp-1">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="resource-title">资源标题</Label>
        <Input
          id="resource-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入资源标题"
          disabled={uploading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="resource-description">资源描述</Label>
        <Textarea
          id="resource-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="输入资源描述（可选）"
          disabled={uploading}
          rows={3}
        />
      </div>
      
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center 
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} 
            transition-colors cursor-pointer`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload size={32} className={error ? 'text-red-500' : 'text-gray-400'} />
            <p className="text-sm font-medium">
              {error ? error : '点击或拖拽文件到此处上传'}
            </p>
            <p className="text-xs text-gray-500">
              支持PDF, Word, Excel, 图片等各种格式
            </p>
          </div>
        </div>
      ) : (
        renderFilePreview()
      )}
      
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">上传中...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} max={100} className="h-2 bg-gray-100" />
        </div>
      )}
      
      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading || !title.trim()}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              上传中...
            </>
          ) : (
            '上传资源'
          )}
        </Button>
      </div>
    </div>
  );
}

export default ResourceUploader; 