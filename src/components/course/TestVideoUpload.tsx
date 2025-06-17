import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { handleBlockNoteFileUpload, uploadVideoToSupabase } from '@/services/fileUploadService';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ResumableVideoUploader from './creator/ResumableVideoUploader';

const TestVideoUpload: React.FC = () => {
  const { user } = useAuth();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // 创建一个BlockNote编辑器实例
  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: "测试视频上传功能。点击下方按钮上传视频，或直接使用编辑器的上传功能。"
      },
      {
        type: "video",
        props: {
          url: "",
          caption: "测试视频",
          showPreview: true
        }
      }
    ],
    uploadFile: handleBlockNoteFileUpload
  });

  // 直接使用Supabase API测试上传
  const handleDirectUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      setDebugInfo(null);

      console.log('开始直接上传测试...');
      console.log('用户信息:', user);
      console.log('文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // 检查用户认证状态
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('当前会话:', session);
      if (sessionError) {
        console.error('会话错误:', sessionError);
      }

      // 生成文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'anonymous'}_${Date.now()}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      console.log('上传路径:', filePath);

      // 尝试上传
      const { data, error: uploadError } = await supabase.storage
        .from('course_videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      setDebugInfo({
        user: user,
        session: session,
        filePath: filePath,
        uploadData: data,
        uploadError: uploadError
      });

      if (uploadError) {
        console.error('上传错误:', uploadError);
        throw uploadError;
      }

      console.log('上传成功:', data);

      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('course_videos')
        .getPublicUrl(filePath);

      console.log('公共URL:', publicUrl);
      setVideoUrl(publicUrl);
      toast.success('直接上传成功！');

    } catch (err: any) {
      console.error('直接上传失败:', err);
      setError(`直接上传失败: ${err.message || err.toString()}`);
      toast.error('直接上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('video/')) {
      setError('请上传视频文件');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      console.log('使用文件上传服务...');
      // 使用我们的文件上传服务
      const url = await uploadVideoToSupabase(file);
      setVideoUrl(url);
      
      // 向编辑器添加视频块
      editor.insertBlocks([
        {
          type: "video",
          props: {
            url: url,
            caption: `上传的视频: ${file.name}`,
            showPreview: true
          }
        }
      ], editor.getTextCursorPosition().block, 'after');
      
      toast.success('服务上传成功！');
    } catch (err: any) {
      console.error('服务上传失败:', err);
      setError(`服务上传失败: ${err.message || err.toString()}`);
      toast.error('服务上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold mb-4">视频上传测试</h1>
      
      {/* 用户信息 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">用户信息</h3>
        <pre className="text-sm">{JSON.stringify({ user: user }, null, 2)}</pre>
      </div>

      <div className="flex flex-col gap-6">
        {/* 新的可恢复上传器测试 */}
        <div className="border rounded-lg p-4 bg-green-50">
          <h2 className="font-semibold mb-2 text-green-800">🚀 可恢复上传器 (推荐)</h2>
          <p className="text-sm text-gray-600 mb-4">
            使用TUS协议，支持断点续传，适合大文件上传。网络中断后可自动恢复。
          </p>
          <ResumableVideoUploader
            onVideoUploaded={(url) => {
              setVideoUrl(url);
              toast.success('可恢复上传成功！');
            }}
          />
        </div>

        {/* 直接上传测试 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">直接Supabase上传测试 (旧方式)</h2>
          <p className="text-sm text-gray-500 mb-2">
            ⚠️ 大文件可能会失败，仅适合小文件测试
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDirectUpload(file);
            }}
            className="hidden"
            id="direct-upload"
            disabled={isUploading}
          />
          <label htmlFor="direct-upload">
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>{isUploading ? '直接上传中...' : '直接上传测试'}</span>
            </Button>
          </label>
        </div>

        {/* 服务上传测试 */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">文件服务上传测试 (旧方式)</h2>
          <p className="text-sm text-gray-500 mb-2">
            ⚠️ 大文件可能会失败，仅适合小文件测试
          </p>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="service-upload"
            disabled={isUploading}
          />
          <label htmlFor="service-upload">
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>{isUploading ? '服务上传中...' : '服务上传测试'}</span>
            </Button>
          </label>
        </div>
        
        {/* 错误信息 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">错误信息</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 调试信息 */}
        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">调试信息</h3>
            <pre className="text-xs text-yellow-700 overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
        
        {/* 视频预览 */}
        {videoUrl && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">上传成功！</h3>
            <p className="text-sm text-gray-500 mb-2">URL: {videoUrl}</p>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video 
                controls 
                src={videoUrl} 
                className="w-full h-full"
              />
            </div>
          </div>
        )}
        
        {/* BlockNote编辑器测试 */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">BlockNote编辑器测试</h2>
          <p className="text-sm text-gray-500 mb-4">
            使用BlockNote编辑器的视频上传功能，点击工具栏中的视频按钮或使用/命令添加视频。
          </p>
          <div className="border rounded-lg">
            <BlockNoteView editor={editor} theme="light" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVideoUpload; 