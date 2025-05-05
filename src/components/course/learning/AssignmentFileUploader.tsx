import React, { useState, useRef } from 'react';
import { Upload, File, X, Loader2, Paperclip, Award, ThumbsUp, CloudUpload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AssignmentFileSubmission } from '@/types/course';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';

// 存储桶名称
const STORAGE_BUCKET = 'assignment-submissions';

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

interface AssignmentFileUploaderProps {
  lessonId: string;
  studentId: string;
  onFileUploaded: (file: AssignmentFileSubmission) => void;
  onFileDeleted?: (fileId: string) => void;
  files?: AssignmentFileSubmission[];
  disabled?: boolean;
}

export function AssignmentFileUploader({
  lessonId,
  studentId,
  onFileUploaded,
  onFileDeleted,
  files = [],
  disabled = false
}: AssignmentFileUploaderProps) {
  // 文件上传状态
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // 文件选择引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      handleUpload(selectedFile);
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
    
    if (disabled) return;
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      handleUpload(droppedFile);
    }
  };

  // 移除已选文件
  const handleRemoveFile = () => {
    setFile(null);
  };

  // 上传文件
  const handleUpload = async (selectedFile: File) => {
    if (!selectedFile) {
      setError('请选择要上传的文件');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccessMessage(null);

    try {
      // 生成安全的文件名（避免中文字符等问题）
      const fileExtension = selectedFile.name.split('.').pop() || '';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const safeFileName = `${timestamp}_${randomString}.${fileExtension}`;
      
      // 生成文件路径
      const filePath = `assignments/${lessonId}/${studentId}/${safeFileName}`;
      
      // 上传到Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile, {
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
      
      // 创建文件提交对象
      const fileSubmission: AssignmentFileSubmission = {
        id: uuidv4(),
        fileName: selectedFile.name,
        fileType: selectedFile.type || fileExtension,
        fileSize: selectedFile.size,
        filePath: filePath,
        uploadedAt: new Date().toISOString()
      };
      
      // 通知父组件文件已上传
      onFileUploaded(fileSubmission);
      
      // 设置成功消息
      setSuccessMessage(`太棒了！文件 ${selectedFile.name} 上传成功！`);

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // 重置状态
      setFile(null);
      setUploading(false);
      setProgress(0);
      
    } catch (err) {
      console.error('上传过程中出错:', err);
      setError(err instanceof Error ? err.message : '上传过程中出错');
      setUploading(false);
    }
  };
  
  // 删除已上传的文件
  const handleDeleteFile = async (fileSubmission: AssignmentFileSubmission) => {
    try {
      // 从Supabase Storage中删除文件
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileSubmission.filePath]);
      
      if (error) {
        console.error('删除文件错误:', error);
        throw new Error(`删除文件失败: ${error.message}`);
      }
      
      // 通知父组件文件已删除
      if (onFileDeleted) {
        onFileDeleted(fileSubmission.id);
      }

      // 设置成功消息
      setSuccessMessage('文件已成功删除！');

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('删除文件过程中出错:', err);
      setError(err instanceof Error ? err.message : '删除文件过程中出错');
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    return '📎';
  };

  // 渲染上传区域
  const renderUploadArea = () => {
    if (disabled) {
      return (
        <div className="border-2 border-dashed rounded-lg p-6 text-center border-gray-200 bg-gray-50">
          <div className="flex flex-col items-center justify-center gap-2">
            <Paperclip size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-400">
              本作业不允许文件上传
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${uploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragOver={handleDrag}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading || disabled}
        />
        
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center gap-4">
          <motion.div 
            className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CloudUpload size={40} className="text-gray-500" />
          </motion.div>
          
          <div>
            <h3 className="text-lg font-bold mb-1 text-gray-700">拖放文件到这里上传</h3>
            <p className="text-sm text-gray-600 mb-3">
              或者点击下面的按钮选择文件
            </p>
            
            <Button
              type="button"
              variant="outline"
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || disabled}
            >
              <Upload className="mr-2 h-4 w-4" />
              选择文件
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            支持的文件类型: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG
          </p>
        </motion.div>
      </motion.div>
    );
  };

  // 渲染文件列表
  const renderFileList = () => {
    if (files.length === 0) return null;
    
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 space-y-3"
      >
        <h3 className="font-bold flex items-center gap-2 text-gray-700">
          <Award size={18} />
          已上传的文件
        </h3>
        
        <div className="space-y-3">
          {files.map((fileSubmission) => (
            <motion.div 
              key={fileSubmission.id}
              variants={itemVariants}
              className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{getFileIcon(fileSubmission.fileType)}</div>
                <div>
                  <p className="font-medium text-gray-800">{fileSubmission.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(fileSubmission.fileSize)}
                    </Badge>
                    <span>·</span>
                    <span>
                      {new Date(fileSubmission.uploadedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDeleteFile(fileSubmission)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  // 渲染上传进度
  const renderUploadProgress = () => {
    if (!uploading) return null;
    
    return (
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>上传中...</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} max={100} className="h-2" />
      </div>
    );
  };

  // 渲染成功消息
  const renderSuccessMessage = () => {
    if (!successMessage) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg flex items-center gap-2 text-green-700"
      >
        <ThumbsUp className="h-5 w-5 text-green-500" />
        <p>{successMessage}</p>
      </motion.div>
    );
  };

  // 渲染错误消息
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700"
      >
        {error}
      </motion.div>
    );
  };

  return (
    <div className="w-full">
      {renderUploadArea()}
      {renderUploadProgress()}
      {renderSuccessMessage()}
      {renderErrorMessage()}
      {renderFileList()}
    </div>
  );
} 