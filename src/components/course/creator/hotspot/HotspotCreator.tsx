import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, X, Move, Settings, Edit, Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Hotspot } from '@/types/course';
import { cn } from '@/lib/utils';

export interface HotspotCreatorProps {
  backgroundImage: string;
  hotspots: Hotspot[];
  onUpdateHotspots: (hotspots: Hotspot[]) => void;
  onEditHotspot: (hotspot: Hotspot) => void;
}

const HotspotCreator: React.FC<HotspotCreatorProps> = ({
  backgroundImage,
  hotspots,
  onUpdateHotspots,
  onEditHotspot
}) => {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理图片点击添加新热点
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 防止事件冒泡
    e.stopPropagation();
    
    // 如果正在拖动，不添加新热点
    if (isDragging) return;

    // 如果已选择某个热点，不添加新热点
    if (selectedHotspotId) {
      setSelectedHotspotId(null);
      return;
    }

    // 获取点击位置相对于图片的百分比
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 创建新热点
    const newHotspot: Hotspot = {
      id: `hotspot-${Date.now()}`,
      x,
      y,
      title: `热点 ${hotspots.length + 1}`,
      description: '请添加描述文本'
    };

    // 添加到热点列表
    onUpdateHotspots([...hotspots, newHotspot]);
    
    // 选中新热点并打开编辑
    setSelectedHotspotId(newHotspot.id);
    onEditHotspot(newHotspot);
  };

  // 处理热点拖动开始
  const handleDragStart = (e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    setDraggingHotspotId(hotspotId);
    setIsDragging(true);
  };

  // 处理热点拖动
  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging || !draggingHotspotId || !containerRef.current) return;

    e.preventDefault();
    
    // 获取鼠标位置相对于图片的百分比
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 确保坐标在合理范围内
    const boundedX = Math.max(0, Math.min(100, x));
    const boundedY = Math.max(0, Math.min(100, y));

    // 更新热点位置
    const updatedHotspots = hotspots.map(hotspot => 
      hotspot.id === draggingHotspotId 
        ? { ...hotspot, x: boundedX, y: boundedY } 
        : hotspot
    );
    
    onUpdateHotspots(updatedHotspots);
  };

  // 处理热点拖动结束
  const handleDragEnd = () => {
    setDraggingHotspotId(null);
    setIsDragging(false);
  };

  // 处理热点点击
  const handleHotspotClick = (e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    
    // 如果正在拖动，不处理点击
    if (isDragging) return;
    
    if (selectedHotspotId === hotspotId) {
      setSelectedHotspotId(null);
    } else {
      setSelectedHotspotId(hotspotId);
      
      // 找到选中的热点并打开编辑
      const hotspot = hotspots.find(h => h.id === hotspotId);
      if (hotspot) {
        onEditHotspot(hotspot);
      }
    }
  };

  // 处理热点删除
  const handleDeleteHotspot = (e: React.MouseEvent, hotspotId: string) => {
    e.stopPropagation();
    
    const updatedHotspots = hotspots.filter(h => h.id !== hotspotId);
    onUpdateHotspots(updatedHotspots);
    
    if (selectedHotspotId === hotspotId) {
      setSelectedHotspotId(null);
    }
  };

  // 监听拖动事件
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 防止默认行为和事件冒泡
        e.preventDefault();
        handleDrag(e as unknown as React.MouseEvent);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        // 防止默认行为和事件冒泡
        e.preventDefault();
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      
      // 添加一个类来防止文本选择
      document.body.classList.add('hotspot-dragging');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // 移除类
      document.body.classList.remove('hotspot-dragging');
    };
  }, [isDragging, draggingHotspotId]);

  return (
    <div className="hotspot-creator relative">
      <div className="mb-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <PlusCircle className="h-4 w-4 mr-1 text-primary" />
        点击图片添加热点，拖动调整位置
      </div>
      
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-border cursor-crosshair"
        onClick={handleImageClick}
      >
        {/* 背景图片 */}
        <img
          src={backgroundImage}
          alt="背景图片"
          className="w-full h-auto object-contain"
        />
        
        {/* 热点标记 */}
        {hotspots.map(hotspot => (
          <div
            key={hotspot.id}
            className={cn(
              "absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10",
              isDragging && draggingHotspotId === hotspot.id ? "z-20" : ""
            )}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={(e) => handleHotspotClick(e, hotspot.id)}
            onMouseDown={(e) => handleDragStart(e, hotspot.id)}
          >
            <div className={cn(
              "flex items-center justify-center rounded-full w-10 h-10",
              selectedHotspotId === hotspot.id 
                ? "bg-primary text-white" 
                : "bg-white/80 backdrop-blur-sm text-primary border border-primary/30"
            )}>
              {isDragging && draggingHotspotId === hotspot.id ? (
                <Move className="h-5 w-5" />
              ) : (
                <PlusCircle className="h-5 w-5" />
              )}
            </div>
            
            {/* 热点工具栏 */}
            {selectedHotspotId === hotspot.id && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1 bg-white dark:bg-gray-800 shadow-md rounded-full p-1 border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => handleDeleteHotspot(e, hotspot.id)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
            
            {/* 热点编号 */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-0.5 text-xs rounded-full shadow-sm border border-border">
              {hotspots.findIndex(h => h.id === hotspot.id) + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotspotCreator; 