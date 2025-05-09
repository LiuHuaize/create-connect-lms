import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HotspotMarkerProps {
  id: string;
  x: number;
  y: number;
  isActive: boolean;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md' | 'lg';
  pulseColor?: string;
}

/**
 * HotspotMarker组件 - 显示热点标记
 * 
 * 修复：解决当鼠标悬停在左侧导航菜单时热点卡片闪烁的问题
 * 1. 使用React.memo包装组件，避免不必要的重新渲染
 * 2. 阻止事件冒泡，避免触发外部事件
 * 3. 优化hover状态管理，使悬停效果更加稳定
 * 4. 为元素添加固定z-index，避免层叠上下文问题
 */
const HotspotMarker: React.FC<HotspotMarkerProps> = ({
  id,
  x,
  y,
  isActive,
  onClick,
  size = 'md',
  pulseColor = 'rgba(255, 255, 255, 0.5)'
}) => {
  // 根据size确定热点大小
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  // 优化点击处理函数，阻止事件冒泡
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    onClick(e);
  }, [onClick]);

  // 阻止鼠标事件冒泡
  const handleMouseEvents = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // 脉冲动画
  const pulseAnimation = {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  return (
    <div
      id={`hotspot-${id}`}
      className="absolute z-10 cursor-pointer flex items-center justify-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        WebkitTapHighlightColor: 'transparent', // 防止在移动设备上出现点击闪烁
        zIndex: isActive ? 20 : 10, // 活跃的热点有更高的z-index
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEvents}
      onMouseLeave={handleMouseEvents}
      onMouseOver={handleMouseEvents}
      onMouseMove={handleMouseEvents}
    >
      {/* 脉冲背景层 */}
      {isActive && (
        <motion.div
          className={cn(
            "absolute rounded-full bg-white/10 backdrop-blur-sm",
            sizeMap[size]
          )}
          animate={pulseAnimation}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none' // 确保点击事件可以穿透到下面的元素
          }}
        />
      )}
      
      {/* 热点标记 */}
      <motion.div
        className={cn(
          "flex items-center justify-center rounded-full",
          isActive ? "bg-primary text-white" : "bg-white/80 backdrop-blur-sm text-primary",
          sizeMap[size]
        )}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          boxShadow: isActive 
            ? '0 0 0 3px rgba(255, 255, 255, 0.3), 0 4px 8px rgba(0, 0, 0, 0.2)' 
            : '0 2px 4px rgba(0, 0, 0, 0.2)' 
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ 
          duration: 0.2,
          // 确保动画不影响位置
          layout: false
        }}
        style={{
          position: 'relative',
          zIndex: 10,
          willChange: 'transform', // 提示浏览器该元素将发生变化，提高性能
          transformStyle: 'preserve-3d', // 启用3D变换以启用硬件加速
        }}
      >
        <PlusCircle size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
      </motion.div>
    </div>
  );
};

export default React.memo(HotspotMarker, (prevProps, nextProps) => {
  // 自定义比较函数，仅当关键属性变化时重新渲染
  return (
    prevProps.id === nextProps.id &&
    prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.size === nextProps.size
  );
}); 