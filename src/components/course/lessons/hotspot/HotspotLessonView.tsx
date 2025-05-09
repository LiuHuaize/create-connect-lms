import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle, Loader2 } from 'lucide-react';
import { HotspotLessonContent, Hotspot, Lesson } from '@/types/course';
import HotspotMarker from './HotspotMarker';
import HotspotCard from './HotspotCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { courseService } from '@/services/courseService';
import { useIsMobile } from '@/hooks/useIsMobile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface HotspotLessonViewProps {
  lesson: Lesson;
  enrollmentId?: string;
  isPreview?: boolean;
}

/**
 * HotspotLessonView组件 - 显示热点课程内容
 * 
 * 修复：解决当鼠标悬停在左侧导航菜单时热点卡片闪烁的问题
 * 1. 使用useMemo缓存从content.hotspots中查找的热点，减少不必要的重新渲染
 * 2. 使用useRef维持activeHotspotId的稳定性，防止在布局变化时意外重置
 * 3. 使用useCallback优化事件处理函数，避免不必要的重新创建
 * 4. 优化热点卡片状态，确保其稳定显示
 */
const HotspotLessonView: React.FC<HotspotLessonViewProps> = ({ lesson, enrollmentId, isPreview = false }) => {
  const { courseId } = useParams();
  const content = useMemo(() => lesson.content as HotspotLessonContent, [lesson.content]);
  const isMobile = useIsMobile();

  // 状态
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const activeHotspotIdRef = useRef<string | null>(null); // 使用ref跟踪activeHotspotId，使其在重渲染时更稳定
  const [viewedHotspots, setViewedHotspots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // 同步activeHotspotId到ref
  useEffect(() => {
    activeHotspotIdRef.current = activeHotspotId;
  }, [activeHotspotId]);

  // 使用useMemo缓存当前活跃的热点对象，避免不必要的重新计算
  const activeHotspot = useMemo(() => {
    if (!activeHotspotId || !content.hotspots) return null;
    return content.hotspots.find(h => h.id === activeHotspotId) || null;
  }, [activeHotspotId, content.hotspots]);

  // 计算完成进度 - 使用useMemo优化
  useEffect(() => {
    if (content.hotspots && content.hotspots.length > 0) {
      const progressValue = (viewedHotspots.length / content.hotspots.length) * 100;
      setProgress(progressValue);
    }
  }, [viewedHotspots, content.hotspots]);

  // 检查课程完成状态
  useEffect(() => {
    if (courseId && enrollmentId && lesson.id) {
      // 检查课时是否已完成
      const checkCompletionStatus = async () => {
        try {
          const { data } = await supabase
            .from('lesson_completions')
            .select('*')
            .eq('course_id', courseId)
            .eq('lesson_id', lesson.id)
            .eq('enrollment_id', enrollmentId)
            .single();
          
          if (data) {
            setIsCompleted(true);
            
            // 如果有已查看的热点数据，恢复它
            if (data.data && data.data.viewedHotspots) {
              setViewedHotspots(data.data.viewedHotspots);
            }
          }
        } catch (error) {
          // 课时未完成或发生错误，继续正常流程
        }
      };
      
      checkCompletionStatus();
    }
  }, [courseId, enrollmentId, lesson.id]);

  // 初始化 - 加载已访问的热点
  useEffect(() => {
    // 如果是预览模式，不加载完成状态
    if (isPreview) return;
    
    // 从本地存储加载已访问热点
    const savedVisited = localStorage.getItem(`visited-hotspots-${lesson.id}`);
    if (savedVisited) {
      try {
        const parsed = JSON.parse(savedVisited);
        setViewedHotspots(parsed);
        updateProgress(parsed);
      } catch (e) {
        console.error('解析已访问热点数据失败', e);
      }
    }
  }, [lesson.id, isPreview]);
  
  // 更新进度 - 使用useCallback优化
  const updateProgress = useCallback((visited: string[]) => {
    if (!content.hotspots || content.hotspots.length === 0) {
      setProgress(100);
      return;
    }
    
    const progressValue = Math.round((visited.length / content.hotspots.length) * 100);
    setProgress(progressValue);
    
    // 当所有热点都已访问，且不是预览模式时，标记课程为已完成
    if (progressValue === 100 && !isPreview && courseId && enrollmentId) {
      markLessonAsComplete(visited);
    }
  }, [content.hotspots, isPreview, courseId, enrollmentId]);
  
  // 标记课程为已完成 - 使用useCallback优化
  const markLessonAsComplete = useCallback(async (visited: string[]) => {
    if (!courseId || !enrollmentId) return;
    
    try {
      // 将已访问热点保存到课程数据中
      const completionData = {
        visited_hotspots: visited,
        completed: true
      };
      
      await courseService.markLessonComplete(
        lesson.id,
        courseId,
        enrollmentId,
        100, // 100% 完成度
        completionData
      );
      
      console.log('热点课程标记为已完成', lesson.id);
      toast.success('课程已完成！');
    } catch (error) {
      console.error('标记课程完成时出错', error);
    }
  }, [courseId, enrollmentId, lesson.id]);

  // 处理热点点击 - 使用useCallback优化，并阻止事件冒泡
  const handleHotspotClick = useCallback((hotspot: Hotspot, e?: React.MouseEvent) => {
    // 阻止事件冒泡
    if (e) {
      e.stopPropagation();
    }
    
    // 添加防抖动，避免频繁切换
    const now = Date.now();
    const lastClick = (window as any).__lastHotspotClick || 0;
    if (now - lastClick < 300) {
      return; // 如果点击间隔小于300ms，忽略
    }
    (window as any).__lastHotspotClick = now;
    
    // 如果点击了正在激活的热点，关闭它
    if (activeHotspotIdRef.current === hotspot.id) {
      setActiveHotspotId(null);
    } else {
      // 否则激活点击的热点
      setActiveHotspotId(hotspot.id);
    }
    
    // 如果这个热点还没访问过，添加到已访问列表
    if (!viewedHotspots.includes(hotspot.id)) {
      const updatedViewed = [...viewedHotspots, hotspot.id];
      setViewedHotspots(updatedViewed);
      
      // 保存到本地存储
      localStorage.setItem(`visited-hotspots-${lesson.id}`, JSON.stringify(updatedViewed));
      
      // 更新进度
      updateProgress(updatedViewed);
    }
  }, [activeHotspotIdRef, lesson.id, updateProgress, viewedHotspots]);

  // 关闭热点卡片 - 使用useCallback优化
  const handleCardClose = useCallback(() => {
    setActiveHotspotId(null);
  }, []);

  // 标记课时为已完成
  const handleCompleteLesson = useCallback(async () => {
    if (!courseId || !enrollmentId || !lesson.id) {
      toast.error('无法标记完成状态。缺少必要的课程或注册信息。');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 如果已完成，则取消完成标记
      if (isCompleted) {
        await courseService.uncompleteLessonForUser(
          lesson.id,
          courseId,
          enrollmentId
        );
        setIsCompleted(false);
        toast.success('已取消完成标记');
      } else {
        // 否则标记为已完成
        await courseService.completeLessonForUser(
          lesson.id,
          courseId,
          enrollmentId,
          {
            viewedHotspots
          }
        );
        setIsCompleted(true);
        toast.success('课时已标记为完成');
      }
    } catch (error) {
      console.error('标记完成状态失败:', error);
      toast.error('操作失败。请稍后重试。');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, enrollmentId, lesson.id, isCompleted, viewedHotspots]);

  // 在布局变化时（例如窗口大小改变）保持热点位置的稳定性
  useEffect(() => {
    const handleResize = () => {
      // 当窗口大小改变时，不更新活跃热点状态，避免闪烁
      // 此处留空，仅作为事件监听器存在
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!content || !content.backgroundImage) {
    return <div className="p-4 text-center">无法加载热点课程内容。</div>;
  }

  return (
    <div className="w-full relative space-y-4">
      {/* 进度指示器 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">学习进度</h3>
          <Badge variant="outline">{progress}%</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* 介绍文字 */}
      {content.introduction && (
        <div className="mb-4 p-4 bg-muted rounded-md">
          {content.introduction}
        </div>
      )}
      
      {/* 热点图片容器 - 添加样式确保在布局变化时稳定性 */}
      <div 
        className="relative w-full" 
        style={{ 
          aspectRatio: '16/9',
          transform: 'translateZ(0)', // 启用硬件加速
          willChange: 'transform', // 提示浏览器该元素将发生变化
        }}
      >
        <img 
          src={content.backgroundImage} 
          alt={lesson.title}
          className="w-full h-full object-cover rounded-md"
        />
        
        {/* 热点标记 */}
        {content.hotspots && content.hotspots.map((hotspot) => (
          <HotspotMarker 
            key={hotspot.id}
            id={hotspot.id}
            x={hotspot.x}
            y={hotspot.y}
            isActive={activeHotspotId === hotspot.id || viewedHotspots.includes(hotspot.id)}
            onClick={(e) => handleHotspotClick(hotspot, e)}
            size={isMobile ? 'sm' : 'md'}
          />
        ))}
        
        {/* 热点内容卡片 */}
        {activeHotspot && (
          <HotspotCard
            hotspot={activeHotspot}
            isVisible={!!activeHotspot}
            onClose={handleCardClose}
            position={{ x: activeHotspot.x, y: activeHotspot.y }}
          />
        )}
      </div>
      
      {/* 完成按钮 */}
      {!isPreview && enrollmentId && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            disabled={isLoading}
            onClick={handleCompleteLesson}
            className={`px-6 min-w-[200px] ${
              isCompleted 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "border-primary text-primary hover:bg-primary/10"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="mr-2 animate-spin" />
                处理中...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle size={18} className="mr-2" />
                已完成
              </>
            ) : (
              "标记为已完成"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(HotspotLessonView); 