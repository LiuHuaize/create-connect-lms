import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, RefreshCw, Pause, Play } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Upload as TusUpload } from 'tus-js-client';

interface ResumableVideoUploaderProps {
  onVideoUploaded: (filePath: string) => void;
  initialVideoPath?: string | null;
}

const ResumableVideoUploader: React.FC<ResumableVideoUploaderProps> = ({ 
  onVideoUploaded, 
  initialVideoPath 
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoPath, setVideoPath] = useState<string | null>(initialVideoPath || null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const tusUploadRef = useRef<TusUpload | null>(null);
  const uploadStartTimeRef = useRef<number>(0);

  // 获取Supabase项目配置
  const getSupabaseConfig = () => {
    // 从环境变量获取项目URL
    const url = import.meta.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
    if (!url) {
      throw new Error('Supabase URL未配置');
    }
    const projectId = url.replace('https://', '').replace('.supabase.co', '');
    return { projectId, url };
  };

  // 开始可恢复上传
  const startResumableUpload = async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);
      setPaused(false);
      
      // 记录上传开始时间
      uploadStartTimeRef.current = Date.now();

      // 获取用户会话
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('用户未认证');
      }

      // 生成文件路径
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { projectId } = getSupabaseConfig();
      const uploadEndpoint = `https://${projectId}.supabase.co/storage/v1/upload/resumable`;

      console.log('开始TUS可恢复上传:', {
        fileName,
        filePath,
        fileSize: file.size,
        endpoint: uploadEndpoint
      });

      // 创建TUS上传实例
      const upload = new TusUpload(file, {
        endpoint: uploadEndpoint,
        retryDelays: [0, 3000, 5000, 10000, 20000], // 重试延迟
        headers: {
          authorization: `Bearer ${session.access_token}`,
          'x-upsert': 'true', // 允许覆盖现有文件
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true, // 成功后移除指纹，允许重新上传同一文件
        metadata: {
          bucketName: 'course_videos',
          objectName: filePath,
          contentType: file.type,
          cacheControl: '3600',
        },
        chunkSize: 25 * 1024 * 1024, // 25MB块大小，平衡效率和稳定性
        onError: (error) => {
          console.error('TUS上传错误:', error);
          setError(`上传失败: ${error.message}`);
          setUploading(false);
          toast.error('视频上传失败');
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          setProgress(percentage);
          
          // 计算真正的上传速度和剩余时间
          const currentTime = Date.now();
          const elapsedTimeMs = currentTime - uploadStartTimeRef.current;
          const elapsedTimeSeconds = Math.max(elapsedTimeMs / 1000, 1); // 避免除零，最少1秒
          
          // 速度：字节/秒，转换为MB/s
          const speedBytesPerSecond = bytesUploaded / elapsedTimeSeconds;
          const speedMBPerSecond = speedBytesPerSecond / (1024 * 1024);
          
          // 剩余时间：剩余字节数 / 当前速度
          const remainingBytes = bytesTotal - bytesUploaded;
          const remainingTimeSeconds = speedBytesPerSecond > 0 ? remainingBytes / speedBytesPerSecond : 0;
          
          setUploadSpeed(`${speedMBPerSecond.toFixed(1)} MB/s`);
          
          // 格式化剩余时间显示
          if (remainingTimeSeconds < 60) {
            setTimeRemaining(`${Math.round(remainingTimeSeconds)}秒`);
          } else if (remainingTimeSeconds < 3600) {
            const minutes = Math.floor(remainingTimeSeconds / 60);
            const seconds = Math.round(remainingTimeSeconds % 60);
            setTimeRemaining(`${minutes}分${seconds}秒`);
          } else {
            const hours = Math.floor(remainingTimeSeconds / 3600);
            const minutes = Math.floor((remainingTimeSeconds % 3600) / 60);
            setTimeRemaining(`${hours}小时${minutes}分钟`);
          }
          
          console.log(`上传进度: ${percentage}% (${(bytesUploaded / 1024 / 1024).toFixed(1)}MB/${(bytesTotal / 1024 / 1024).toFixed(1)}MB) 速度: ${speedMBPerSecond.toFixed(1)}MB/s`);
        },
        onSuccess: () => {
          console.log('TUS上传成功');
          setProgress(100);
          
          // 获取公共URL
          const { data: { publicUrl } } = supabase.storage
            .from('course_videos')
            .getPublicUrl(filePath);
          
          setVideoPath(publicUrl);
          onVideoUploaded(publicUrl);
          setUploading(false);
          toast.success('视频上传成功！');
        },
      });

      tusUploadRef.current = upload;

      // 检查之前的上传并恢复
      const previousUploads = await upload.findPreviousUploads();
      if (previousUploads.length) {
        console.log('发现之前的上传，正在恢复...');
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }

      // 开始上传
      upload.start();

    } catch (error: any) {
      console.error('启动上传失败:', error);
      setError(error.message || '启动上传失败');
      setUploading(false);
      toast.error('启动上传失败');
    }
  };

  // 暂停上传
  const pauseUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      setPaused(true);
      setUploading(false);
      toast.info('上传已暂停');
    }
  };

  // 恢复上传
  const resumeUpload = async () => {
    if (tusUploadRef.current) {
      setPaused(false);
      setUploading(true);
      
      // 重新记录开始时间（为了准确计算恢复后的速度）
      uploadStartTimeRef.current = Date.now();
      
      // 查找之前的上传并恢复
      const previousUploads = await tusUploadRef.current.findPreviousUploads();
      if (previousUploads.length) {
        tusUploadRef.current.resumeFromPreviousUpload(previousUploads[0]);
      }
      
      tusUploadRef.current.start();
      toast.info('上传已恢复');
    }
  };

  // 取消上传
  const cancelUpload = () => {
    if (tusUploadRef.current) {
      tusUploadRef.current.abort();
      tusUploadRef.current = null;
    }
    setUploading(false);
    setPaused(false);
    setProgress(0);
    setUploadSpeed('');
    setTimeRemaining('');
    uploadStartTimeRef.current = 0;
    setError('上传已取消');
    toast.info('上传已取消');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    
    // 检查文件类型
    if (!file.type.startsWith('video/')) {
      setError('请上传视频文件（MP4, WebM, MOV等格式）');
      return;
    }

    // 检查文件大小 (最大2GB)
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > maxSize) {
      setError(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），请上传小于2GB的视频`);
      return;
    }

    await startResumableUpload(file);
  };

  const handleRemove = async () => {
    if (!videoPath) return;
    
    try {
      // 从URL中提取文件路径
      const url = new URL(videoPath);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `videos/${fileName}`;
      
      console.log('删除视频文件:', filePath);
      
      const { error } = await supabase.storage
        .from('course_videos')
        .remove([filePath]);
        
      if (error) {
        console.error('删除文件错误:', error);
        throw error;
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
        <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mx-auto max-w-3xl">
          <video 
            src={videoPath} 
            controls 
            className="w-full h-full object-contain"
            preload="metadata"
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
        <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        } transition-colors cursor-pointer`}>
          <input
            type="file"
            accept="video/*"
            className="hidden"
            id="video-upload"
            onChange={handleFileChange}
            disabled={uploading || paused}
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload size={32} className={error ? 'text-red-500' : 'text-gray-400'} />
              <p className="text-sm font-medium">
                {error ? error : '点击上传视频文件'}
              </p>
              <p className="text-xs text-gray-500">
                支持MP4, WebM, MOV等格式，最大2GB，支持断点续传（25MB块上传）
              </p>
            </div>
          </label>
        </div>
      )}
      
      {(uploading || paused) && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {paused ? '上传已暂停' : '上传中...'}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} max={100} className="h-2 bg-gray-100" />
          
          {/* 上传统计信息 */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>速度: {uploadSpeed}</span>
            <span>剩余: {timeRemaining}</span>
          </div>
          
          {/* 控制按钮 */}
          <div className="flex justify-center gap-2">
            {uploading && !paused && (
              <Button
                variant="outline"
                size="sm"
                onClick={pauseUpload}
                className="flex items-center gap-1"
              >
                <Pause size={16} />
                暂停
              </Button>
            )}
            
            {paused && (
              <Button
                variant="outline"
                size="sm"
                onClick={resumeUpload}
                className="flex items-center gap-1"
              >
                <Play size={16} />
                继续
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={cancelUpload}
              className="flex items-center gap-1"
            >
              <X size={16} />
              取消
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            使用断点续传技术，网络中断后可自动恢复上传
          </p>
        </div>
      )}

      {renderVideoPreview()}
    </div>
  );
};

export default ResumableVideoUploader; 