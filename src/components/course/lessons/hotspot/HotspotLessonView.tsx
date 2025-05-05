import React, { useState, useEffect } from 'react';
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

const HotspotLessonView: React.FC<HotspotLessonViewProps> = ({ lesson, enrollmentId, isPreview = false }) => {
  const { courseId } = useParams();
  const content = lesson.content as HotspotLessonContent;
  const isMobile = useIsMobile();

  // 状态
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [viewedHotspots, setViewedHotspots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // 获取当前活跃的热点对象
  const activeHotspot = activeHotspotId ? content.hotspots.find(h => h.id === activeHotspotId) || null : null;

  // 计算完成进度
  useEffect(() => {
    if (content.hotspots.length > 0) {
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
  
  // 更新进度
  const updateProgress = (visited: string[]) => {
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
  };
  
  // 标记课程为已完成
  const markLessonAsComplete = async (visited: string[]) => {
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
  };

  // 处理热点点击
  const handleHotspotClick = (hotspot: Hotspot) => {
    // 如果点击了正在激活的热点，关闭它
    if (activeHotspotId === hotspot.id) {
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
  };

  // 关闭热点卡片
  const handleCardClose = () => {
    setActiveHotspotId(null);
  };

  // 标记课时为已完成
  const handleCompleteLesson = async () => {
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
  };

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
      
      {/* 热点图片 */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
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
            onClick={() => handleHotspotClick(hotspot)}
            size={isMobile ? 'sm' : 'md'}
          />
        ))}
      </div>
      
      {/* 热点内容卡片 */}
      {activeHotspot && (
        <HotspotCard 
          hotspot={activeHotspot}
          isVisible={!!activeHotspotId}
          onClose={handleCardClose}
          position={{ x: activeHotspot.x, y: activeHotspot.y }}
        />
      )}
      
      {/* 进度指示器和完成按钮 */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            已探索 {viewedHotspots.length} / {content.hotspots.length} 个热点
          </div>
          <div className="flex items-center space-x-1">
            {viewedHotspots.map(id => (
              <span 
                key={id} 
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
            {Array.from({ length: content.hotspots.length - viewedHotspots.length }).map((_, i) => (
              <span 
                key={`empty-${i}`} 
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"
              />
            ))}
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {courseId && enrollmentId && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleCompleteLesson}
              disabled={isLoading}
              variant={isCompleted ? "outline" : "default"}
              className={isCompleted ? "bg-gray-100 dark:bg-gray-800" : ""}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                  已完成
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  标记为已完成
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotspotLessonView; 