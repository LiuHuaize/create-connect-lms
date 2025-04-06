import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VideoUploaderProps {
  onVideoUploaded: (filePath: string) => void;
  initialVideoPath?: string | null;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoUploaded, 
  initialVideoPath 
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoPath, setVideoPath] = useState<string | null>(initialVideoPath || null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    // 检查文件类型是否为视频
    if (!file.type.startsWith('video/')) {
      setError('请上传视频文件（MP4, WebM, MOV等格式）');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      if (!user) {
        throw new Error('请先登录');
      }

      // 创建唯一文件名，包含时间戳和原始文件扩展名
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 使用手动进度跟踪代替onUploadProgress
      const intervalId = setInterval(() => {
        setProgress(prev => {
          // 模拟上传进度，直到真正完成
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 300);

      // 上传文件到Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('course_videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(intervalId);

      if (uploadError) {
        throw uploadError;
      }

      // 上传成功，设置进度为100%
      setProgress(100);

      const { data: { publicUrl } } = supabase.storage
        .from('course_videos')
        .getPublicUrl(filePath);

      setVideoPath(publicUrl);
      onVideoUploaded(publicUrl);
      toast.success('视频上传成功');
    } catch (error: any) {
      setError(error.message || '上传失败，请重试');
      toast.error('视频上传失败');
      console.error('Video upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!videoPath) return;
    
    try {
      // 从存储中删除视频
      const fileName = videoPath.split('/').pop();
      if (fileName) {
        const { error } = await supabase.storage
          .from('course_videos')
          .remove([fileName]);
          
        if (error) throw error;
      }
      
      setVideoPath(null);
      onVideoUploaded('');
      toast.success('视频已删除');
    } catch (error) {
      console.error('Error removing video:', error);
      toast.error('删除视频失败');
    }
  };

  const renderVideoPreview = () => {
    if (!videoPath) return null;
    
    return (
      <div className="mt-4">
        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
          <video 
            src={videoPath} 
            controls 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="mt-2 flex justify-end">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleRemove}
            className="flex items-center gap-1"
          >
            <X size={16} />
            <span>删除视频</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {!videoPath && (
        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            id="video-upload"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload size={32} className={error ? 'text-red-500' : 'text-gray-400'} />
              <p className="text-sm font-medium">
                {error ? error : '点击上传视频文件'}
              </p>
              <p className="text-xs text-gray-500">支持MP4, WebM, MOV等格式</p>
            </div>
          </label>
        </div>
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

      {renderVideoPreview()}
    </div>
  );
};

export default VideoUploader;
