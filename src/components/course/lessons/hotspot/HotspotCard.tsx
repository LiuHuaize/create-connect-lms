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

/**
 * HotspotCard组件 - 显示热点详情的卡片
 * 
 * 修复：解决当鼠标悬停在左侧导航菜单上时卡片闪烁的问题
 * 1. 确保卡片使用fixed定位，完全基于视口
 * 2. 使用高z-index确保其显示在最上层
 * 3. 阻止卡片内部事件传播到外部元素
 * 4. 使用useMemo确保props变化不会导致不必要的重渲染
 */
const HotspotCard: React.FC<HotspotCardProps> = React.memo(({
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
  
  // 阻止点击事件冒泡，避免触发外部事件
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* 半透明背景遮罩 */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 卡片内容 */}
          <motion.div
            ref={cardRef}
            className="fixed inset-0 flex items-center justify-center z-[101]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              pointerEvents: "none" // 允许点击穿透到遮罩层
            }}
          >
            <motion.div 
              className="w-[90%] max-w-[500px] max-h-[80vh]"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={handleCardClick}
              style={{
                pointerEvents: "auto" // 恢复卡片自身的点击事件
              }}
            >
              <div className="bg-white dark:bg-card rounded-xl shadow-lg overflow-hidden border border-border">
                {/* 卡片头部 */}
                <div className="bg-primary/10 dark:bg-primary/20 px-4 py-3 flex items-center justify-between sticky top-0 z-[1]">
                  <h3 className="font-medium text-lg text-primary dark:text-primary-foreground">
                    {hotspot.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                  >
                    <X size={16} />
                  </Button>
                </div>
                
                {/* 卡片内容区域（可滚动） */}
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {/* 图片（如果有） */}
                  {hotspot.imageUrl && (
                    <div className="mb-3 rounded-md overflow-hidden">
                      <img
                        src={hotspot.imageUrl}
                        alt={hotspot.title}
                        className="w-full h-auto object-contain max-h-[40vh]"
                      />
                    </div>
                  )}
                  
                  {/* 描述文本 */}
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-3 break-words">
                    {hotspot.description}
                  </div>
                  
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAudio();
                          }}
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default HotspotCard; 