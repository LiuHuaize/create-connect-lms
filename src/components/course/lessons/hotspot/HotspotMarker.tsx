import React from 'react';
import { motion } from 'framer-motion';
import { PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HotspotMarkerProps {
  id: string;
  x: number;
  y: number;
  isActive: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  pulseColor?: string;
}

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
    <motion.div
      id={`hotspot-${id}`}
      className="absolute z-10 cursor-pointer flex items-center justify-center"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* 脉冲背景层 */}
      {isActive && (
        <motion.div
          className={cn(
            "absolute rounded-full bg-white/10 backdrop-blur-sm",
            sizeMap[size]
          )}
          animate={pulseAnimation}
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
        transition={{ duration: 0.3 }}
      >
        <PlusCircle size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} />
      </motion.div>
    </motion.div>
  );
};

export default HotspotMarker; 