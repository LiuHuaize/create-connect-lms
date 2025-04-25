import React from 'react';
import { VideoLessonContent as VideoLessonContentType } from '@/types/course';
import { Play } from 'lucide-react';

interface VideoLessonContentProps {
  content: VideoLessonContentType;
  videoFilePath?: string | null;
}

const VideoLessonContent: React.FC<VideoLessonContentProps> = ({ 
  content, 
  videoFilePath 
}) => {
  // 处理B站URL，确保添加as_wide=1参数
  const formatBilibiliUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    if (url.includes('as_wide=1')) {
      return url;
    } else if (url.includes('?')) {
      return `${url}&as_wide=1&high_quality=1`;
    } else {
      return `${url}?as_wide=1&high_quality=1`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
        {content.bilibiliUrl ? (
          <iframe 
            src={formatBilibiliUrl(content.bilibiliUrl)}
            allowFullScreen={true}
            className="w-full h-full"
            style={{ 
              width: '100%', 
              height: '100%', 
              aspectRatio: '16/9', 
              border: 'none',
              display: 'block'
            }}
            scrolling="no" 
            frameBorder="0"
            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
          />
        ) : videoFilePath ? (
          <video 
            controls 
            className="w-full h-full"
            src={videoFilePath}
          >
            您的浏览器不支持视频播放
          </video>
        ) : (
          <div className="text-center">
            <div className="p-4 rounded-full bg-white/20 backdrop-blur-md inline-block mb-4 cursor-pointer hover:bg-white/30 transition-all">
              <Play size={48} className="text-white" />
            </div>
            <p className="text-white font-medium">暂无视频内容</p>
          </div>
        )}
      </div>
      
      {/* 视频描述部分 */}
      {content.description && (
        <div className="mt-4 bg-ghibli-cream/20 border border-ghibli-sand/40 rounded-lg p-4">
          <h3 className="text-lg font-medium text-ghibli-deepTeal mb-2">视频说明</h3>
          <p className="text-ghibli-brown whitespace-pre-wrap">
            {content.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoLessonContent; 