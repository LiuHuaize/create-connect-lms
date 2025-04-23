import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';

interface CardTemplateUploaderProps {
  onUpload: (file: File) => Promise<void>;
  previewUrl?: string;
  isUploading: boolean;
}

export function CardTemplateUploader({
  onUpload,
  previewUrl,
  isUploading
}: CardTemplateUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(file);
      } else {
        alert('请上传图片文件');
      }
    }
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onUpload(file);
      } else {
        alert('请上传图片文件');
      }
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 预览区域 */}
      {previewUrl ? (
        <div className="relative w-full max-w-md border border-gray-200 rounded-lg overflow-hidden">
          <img 
            src={previewUrl} 
            alt="模板预览" 
            className="w-full h-auto object-contain"
          />
          <label 
            htmlFor="templateUpload"
            className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full cursor-pointer hover:bg-black/70"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <input
              id="templateUpload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        </div>
      ) : (
        // 上传区域
        <div 
          className={`w-full max-w-md h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p className="mt-2 text-sm text-gray-600">拖放图片到此处或点击上传</p>
          <p className="text-xs text-gray-500 mt-1">支持 JPG, PNG, GIF 格式</p>
          <label htmlFor="templateUpload" className="mt-4">
            <input
              id="templateUpload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '选择图片'}
            </Button>
          </label>
        </div>
      )}
    </div>
  );
} 