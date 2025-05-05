import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Hotspot } from '@/types/course';

export interface HotspotCardProps {
  hotspot: Hotspot;
  isVisible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const HotspotCard: React.FC<HotspotCardProps> = ({
  hotspot,
  isVisible,
  onClose,
  position
}) => {
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // 当热点改变时重置音频状态
  useEffect(() => {
    setIsAudioPlaying(false);
    setAudioProgress(0);
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.pause();
    }
  }, [hotspot]);

  // 处理音频播放/暂停
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  // 音频加载元数据事件
  const handleAudioMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  // 音频时间更新事件
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioDuration) * 100;
      setAudioProgress(progress);
    }
  };

  // 音频播放结束事件
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
    setAudioProgress(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // 格式化时间（秒转为 mm:ss 格式）
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 调整卡片位置，防止溢出屏幕
  const getCardPosition = () => {
    // 计算更合理的卡片位置
    // 1. 优先显示在热点右侧
    // 2. 根据位置自动调整到合适的方向，防止超出边界
    // 3. 使用固定的偏移量，避免位置变动
    
    // 基础定位：默认在热点右侧，偏移30px
    let posX = position.x; 
    let posY = position.y;
    let translateX = '0%';
    let translateY = '-50%';
    
    // 四个方向的偏移策略
    const directions = {
      right: { x: posX, y: posY, translateX: '20px', translateY: '-50%', origin: 'left center' },
      left: { x: posX, y: posY, translateX: 'calc(-100% - 20px)', translateY: '-50%', origin: 'right center' },
      bottom: { x: posX, y: posY, translateX: '-50%', translateY: '20px', origin: 'center top' },
      top: { x: posX, y: posY, translateX: '-50%', translateY: 'calc(-100% - 20px)', origin: 'center bottom' }
    };
    
    // 默认使用右侧方向
    let direction = 'right';
    
    // 根据热点在屏幕中的位置判断最佳显示方向
    // 如果热点靠近右边缘，则将卡片显示在左侧
    if (position.x > 65) {
      direction = 'left';
    }
    // 如果热点在下半部分，考虑显示在上方
    else if (position.y > 70) {
      direction = 'top';
    }
    // 如果热点在上半部分且接近顶部，考虑显示在下方
    else if (position.y < 30) {
      direction = 'bottom';
    }
    
    const selectedDirection = directions[direction];
    
    return {
      left: `${selectedDirection.x}%`,
      top: `${selectedDirection.y}%`,
      transform: `translate(${selectedDirection.translateX}, ${selectedDirection.translateY})`,
      transformOrigin: selectedDirection.origin
    };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cardRef}
          className="absolute z-20 min-w-[280px] max-w-[320px]"
          style={getCardPosition()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden border border-border">
            {/* 卡片头部 */}
            <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 flex items-center justify-between">
              <h3 className="font-medium text-lg text-primary dark:text-primary-foreground">
                {hotspot.title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClose}
              >
                <X size={16} />
              </Button>
            </div>
            
            {/* 卡片内容 */}
            <div className="p-4">
              {/* 图片（如果有） */}
              {hotspot.imageUrl && (
                <div className="mb-3 rounded-md overflow-hidden">
                  <img
                    src={hotspot.imageUrl}
                    alt={hotspot.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              )}
              
              {/* 描述文本 */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {hotspot.description}
              </p>
              
              {/* 音频播放器（如果有音频） */}
              {hotspot.audioUrl && (
                <div className="mt-3">
                  <audio
                    ref={audioRef}
                    src={hotspot.audioUrl}
                    onLoadedMetadata={handleAudioMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={toggleAudio}
                      variant="outline"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        isAudioPlaying ? "bg-primary text-white" : ""
                      )}
                    >
                      {isAudioPlaying ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </Button>
                    
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                      {audioProgress > 0
                        ? formatTime((audioProgress / 100) * audioDuration)
                        : formatTime(audioDuration)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HotspotCard; 