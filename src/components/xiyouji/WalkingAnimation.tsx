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
  
  // 随机生成背景元素
  const [bgElements, setBgElements] = useState<{emoji: string; position: number; size: number}[]>([]);
  
  useEffect(() => {
    // 生成随机的背景元素
    const elements = [];
    const emojis = ['🌲', '🌳', '🌵', '🌿', '🍄', '🌺', '🌻', '⛰️', '🗻', '🌴'];
    
    for (let i = 0; i < 5; i++) {
      elements.push({
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        position: Math.random() * 100,
        size: Math.floor(Math.random() * 30) + 15
      });
    }
    
    setBgElements(elements);
  }, []);
  
  return (
    <div className="relative h-32 overflow-hidden rounded-lg bg-gradient-to-r from-green-100 to-blue-100 border border-blue-200">
      {/* 背景元素 */}
      {bgElements.map((element, index) => (
        <div 
          key={index}
          className="absolute bottom-1 text-4xl"
          style={{ 
            left: `${element.position}%`, 
            fontSize: `${element.size}px`,
            zIndex: 1,
            transform: `translateY(${Math.sin(floatFrame / 8 + index) * 3}px)`
          }}
        >
          {element.emoji}
        </div>
      ))}
      
      {/* 太阳 */}
      <div 
        className="absolute top-4 right-10 text-4xl"
        style={{ transform: `translateY(${Math.sin(floatFrame / 10) * 4}px)` }}
      >
        🌞
      </div>
      
      {/* 角色走动 */}
      <div 
        className="absolute bottom-2 left-0 transition-transform duration-300 ease-linear z-10"
        style={{ 
          transform: `translateX(${walkFrame * speed}%)`,
        }}
      >
        <div className="relative">
          <img 
            src={avatar} 
            alt={name} 
            className="h-20 w-20 rounded-full border-2 border-white shadow-lg object-cover"
            style={{ 
              transform: `translateY(${Math.sin(floatFrame / 5) * bounceHeight}px) 
                          ${walkFrame % 2 === 0 ? 'rotate(-5deg)' : 'rotate(5deg)'}`,
              transition: 'transform 0.3s ease'
            }}
          />
          <div className="absolute -bottom-5 left-0 right-0 text-center font-bold text-gray-800 text-shadow">
            {name}
          </div>
        </div>
      </div>
      
      {/* 地面 */}
      <div className="absolute bottom-0 right-0 left-0 h-4 bg-gradient-to-r from-green-300 to-green-400"></div>
      
      {/* 云朵 */}
      <div 
        className="absolute top-3 left-10 text-3xl"
        style={{ 
          transform: `translateX(${Math.sin(floatFrame / 20) * 10}px)`,
        }}
      >
        ☁️
      </div>
      <div 
        className="absolute top-10 left-40 text-2xl"
        style={{ 
          transform: `translateX(${Math.sin(floatFrame / 15 + 2) * 8}px)`,
        }}
      >
        ☁️
      </div>
    </div>
  );
};

export default WalkingAnimation; 