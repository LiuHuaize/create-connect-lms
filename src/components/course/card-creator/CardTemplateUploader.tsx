import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Spinner } from '../../ui/spinner'; 

interface CardTemplateUploaderProps {
  onUpload: (file: File) => Promise<void>;
  previewUrl?: string;
  isUploading: boolean;
}

/**
 * 卡片模板上传组件
 * 允许教师直接上传图片文件作为卡片模板
 * 支持拖放和点击上传功能
 */
export function CardTemplateUploader({ onUpload, previewUrl, isUploading }: CardTemplateUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  
  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };
  
  // 处理拖拽
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // 处理拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };
  
  // 触发文件选择对话框
  const handleButtonClick = () => {
    const fileInput = document.getElementById('template-upload') as HTMLInputElement;
    fileInput?.click();
  };
  
  return (
    <div className="card-template-uploader">
      {/* 预览区域 */}
      {previewUrl ? (
        <div className="relative w-full aspect-video mb-3 bg-gray-100 rounded-md overflow-hidden">
          <img
            src={previewUrl}
            alt="模板预览"
            className="object-contain w-full h-full"
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2"
            onClick={handleButtonClick}
            disabled={isUploading}
          >
            更换
          </Button>
        </div>
      ) : (
        // 拖放上传区域
        <div 
          className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center h-36">
              <Spinner size="lg" />
              <p className="mt-3 text-sm text-gray-500">上传中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-36">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-gray-400 mb-3"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <p className="text-sm font-medium">拖放图片或点击上传</p>
              <p className="mt-1 text-xs text-gray-500">支持 JPG, PNG, GIF 格式</p>
            </div>
          )}
        </div>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        id="template-upload"
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
      />
    </div>
  );
} 