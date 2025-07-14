import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from 'sonner';
import { courseService } from '@/services/courseService';
import { useIsMobile } from '@/hooks/use-mobile';
import { appConfig } from '@/config/appConfig';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';

interface LessonCompletionButtonProps {
  lessonId: string;
  courseId: string;
  enrollmentId: string | null;
  refreshCourseData?: () => void;
  score?: number;
  additionalData?: any;
  onComplete?: () => void;
  className?: string;
  disabled?: boolean;
}

const LessonCompletionButton: React.FC<LessonCompletionButtonProps> = ({
  lessonId,
  courseId,
  enrollmentId,
  refreshCourseData,
  score = 100,
  additionalData,
  onComplete,
  className = '',
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  
  // 使用课程完成状态Hook
  const { 
    isLessonCompleted,
    updateCompletion
  } = useCourseCompletion({
    courseId: courseId || '',
    autoLoad: true
  });
  
  const isCompleted = isLessonCompleted(lessonId);
  
  
  // 处理标记完成或取消完成
  const handleToggleComplete = async () => {
    
    if (!lessonId || !courseId) {
      toast.error('课程信息不完整，无法执行此操作');
      return;
    }

    if (!enrollmentId) {
      toast.error('请先注册课程或刷新页面后再试');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isCompleted) {
        // 取消完成
        await courseService.unmarkLessonComplete(lessonId);
        toast.success('已取消标记完成');
        updateCompletion(lessonId, false);
      } else {
        // 标记完成
        await courseService.markLessonComplete(
          lessonId,
          courseId,
          enrollmentId,
          score,
          additionalData
        );
        toast.success('课时已标记为完成');
        updateCompletion(lessonId, true);
        
        // 调用完成回调
        if (onComplete) {
          onComplete();
        }
      }
      
      // 根据配置决定是否自动刷新
      if (appConfig.courseData.autoRefreshAfterCompletion && refreshCourseData) {
        if (appConfig.debug.logRefreshEvents) {
          console.log('LessonCompletionButton: 根据配置执行自动刷新');
        }
        // 延迟一点刷新，确保数据库触发器执行完成
        setTimeout(() => {
          refreshCourseData();
        }, 100);
      } else {
        if (appConfig.debug.logRefreshEvents) {
          console.log('LessonCompletionButton: 根据配置跳过自动刷新');
        }
      }
    } catch (error) {
      console.error('更新完成状态失败:', error);
      toast.error(isCompleted ? '取消标记失败' : '标记完成失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button 
          className={`transition-all shadow-md ${isCompleted 
            ? 'bg-macaron-pink hover:bg-macaron-deepPink text-white' 
            : 'bg-macaron-deepLavender hover:bg-macaron-deepLavender/90 text-white'
          } ${className}`}
          size={isMobile ? "sm" : "default"}
          onClick={handleToggleComplete}
          disabled={isLoading || disabled}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isMobile ? (
            isCompleted ? <X size={16} /> : <Check size={16} />
          ) : (
            isCompleted ? '取消完成标记' : '标记为已完成'
          )}
          {!isLoading && !isMobile && (
            isCompleted ? <X size={18} className="ml-2" /> : <Check size={18} className="ml-2" />
          )}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 border-macaron-lavender bg-white shadow-lg">
        <div className="text-sm">
          <h4 className="font-medium mb-2 text-macaron-deepLavender">
            {isCompleted ? '取消完成标记' : '完成课时'}
          </h4>
          <p className="text-macaron-darkGray">
            {isCompleted 
              ? '取消此课时的完成标记，这将影响您的学习进度。' 
              : '标记此课时为已完成后，会更新您的学习进度，并解锁下一节课程。'
            }
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default LessonCompletionButton; 