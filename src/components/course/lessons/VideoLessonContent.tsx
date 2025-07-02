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
    <div className="space-y-6 mx-auto max-w-4xl">
      {/* 视频描述部分 - 移到上方 */}
      {content.description && (
        <div className="bg-gradient-to-r from-ghibli-cream/30 via-ghibli-parchment/20 to-ghibli-cream/30 border border-ghibli-sand/50 rounded-xl p-6 shadow-sm backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-1 h-6 bg-gradient-to-b from-ghibli-teal to-ghibli-skyBlue rounded-full mt-1"></div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-ghibli-deepTeal mb-2 flex items-center gap-2">
                <Play size={18} className="text-ghibli-teal" />
                视频介绍
              </h3>
              <p className="text-ghibli-brown leading-relaxed whitespace-pre-wrap text-base">
                {content.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 视频播放器 */}
      <div className="aspect-video bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 rounded-xl flex items-center justify-center shadow-xl overflow-hidden border border-gray-700/50">
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
              display: 'block',
              margin: '0 auto'
            }}
            scrolling="no"
            frameBorder="0"
            sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"
          />
        ) : videoFilePath ? (
          <video
            controls
            className="w-full h-full object-contain rounded-lg"
            src={videoFilePath}
            style={{
              margin: '0 auto',
              maxHeight: '100%',
              maxWidth: '100%'
            }}
          >
            您的浏览器不支持视频播放
          </video>
        ) : (
          <div className="text-center">
            <div className="p-6 rounded-full bg-white/10 backdrop-blur-md inline-block mb-4 cursor-pointer hover:bg-white/20 transition-all duration-300 border border-white/20">
              <Play size={56} className="text-white drop-shadow-lg" />
            </div>
            <p className="text-white font-medium text-lg drop-shadow-md">暂无视频内容</p>
            <p className="text-white/70 text-sm mt-2">请联系老师上传视频</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoLessonContent; 