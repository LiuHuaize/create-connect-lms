import React, { useState, useEffect } from 'react';

interface WalkingAnimationProps {
  avatar: string;
  name: string;
  speed?: number; // 移动速度 (1-10)
  bounceHeight?: number; // 弹跳高度 (1-10)
}

// 自定义Hook：创建动画帧计数器
const useFrameAnimation = (frames: number, fps = 24) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % frames);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [frames, fps]);

  return currentFrame;
};

const WalkingAnimation: React.FC<WalkingAnimationProps> = ({
  avatar,
  name,
  speed = 5,
  bounceHeight = 5
}) => {
  // 控制动画速度和状态
  const walkFrame = useFrameAnimation(8, speed * 3);
  const floatFrame = useFrameAnimation(30, 10);
  
  return (
    <div className="relative h-24 overflow-hidden rounded-lg bg-gray-50 mb-6">
      {/* 简化的背景 */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-100"></div>
      
      {/* 角色走动 */}
      <div 
        className="absolute bottom-4 left-0 transition-transform duration-300 ease-linear z-10"
        style={{ 
          transform: `translateX(${walkFrame * speed}%)`,
        }}
      >
        <div className="relative">
          <img 
            src={avatar} 
            alt={name} 
            className="h-14 w-14 rounded-full border border-white shadow-sm object-cover"
            style={{ 
              transform: `translateY(${Math.sin(floatFrame / 5) * bounceHeight}px)`,
            }}
          />
          <div className="absolute -bottom-4 left-0 right-0 text-center text-xs font-medium text-gray-600">
            {name}
          </div>
        </div>
      </div>
      
      {/* 简化的背景元素 */}
      <div className="absolute top-4 right-10 w-6 h-6 rounded-full bg-yellow-100"></div>
      <div className="absolute top-6 left-1/4 w-12 h-3 rounded-full bg-gray-100"></div>
      <div className="absolute top-3 left-2/3 w-10 h-2 rounded-full bg-gray-100"></div>
    </div>
  );
};

export default WalkingAnimation; 