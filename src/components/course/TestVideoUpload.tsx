import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { handleBlockNoteFileUpload } from '@/services/fileUploadService';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

const TestVideoUpload: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // 使用我们的文件上传服务
      const url = await handleBlockNoteFileUpload(file);
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
      
    } catch (err) {
      console.error('上传失败:', err);
      setError('视频上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold mb-4">视频上传测试</h1>
      
      <div className="flex flex-col gap-4">
        <div className="border rounded-lg p-4 bg-gray-50">
          <h2 className="font-semibold mb-2">上传视频</h2>
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="video-upload"
            disabled={isUploading}
          />
          <label htmlFor="video-upload">
            <Button
              variant="outline"
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>{isUploading ? '上传中...' : '选择视频文件'}</span>
            </Button>
          </label>
          
          {error && (
            <p className="text-red-500 mt-2 text-sm">{error}</p>
          )}
          
          {videoUrl && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">上传成功！您可以在下方查看视频：</p>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  controls 
                  src={videoUrl} 
                  className="w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">BlockNote编辑器测试</h2>
          <p className="text-sm text-gray-500 mb-4">
            使用BlockNote编辑器的视频上传功能，点击工具栏中的视频按钮或使用/命令添加视频。
          </p>
          <div className="border rounded-lg">
            <BlockNoteView editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestVideoUpload; 