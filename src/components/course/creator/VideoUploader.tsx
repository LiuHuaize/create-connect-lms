import React from 'react';
import ResumableVideoUploader from './ResumableVideoUploader';

interface VideoUploaderProps {
  onVideoUploaded: (filePath: string) => void;
  initialVideoPath?: string | null;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  onVideoUploaded, 
  initialVideoPath 
}) => {
  // 直接使用可恢复上传器
  return (
    <ResumableVideoUploader 
      onVideoUploaded={onVideoUploaded}
      initialVideoPath={initialVideoPath}
    />
  );
};

export default VideoUploader;
