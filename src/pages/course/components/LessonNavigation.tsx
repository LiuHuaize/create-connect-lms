import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useIsMobile } from '@/hooks/use-mobile';
import { courseService } from '@/services/courseService';

interface LessonNavigationProps {
  courseData: Course & { modules?: CourseModule[] };
  selectedLesson: Lesson | null;
  enrollmentId: string | null;
}

const LessonNavigation: React.FC<LessonNavigationProps> = ({
  courseData,
  selectedLesson,
  enrollmentId
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 获取课时的完成状态
  useEffect(() => {
    if (courseData?.id && selectedLesson?.id) {
      courseService.getLessonCompletionStatus(courseData.id)
        .then(status => {
          setIsCompleted(!!status[selectedLesson.id]);
        })
        .catch(error => {
          console.error('获取课时完成状态失败:', error);
        });
    }
  }, [courseData?.id, selectedLesson?.id]);

  // 找到前一个和后一个课时
  const findNeighborLessons = () => {
    if (!courseData?.modules || !selectedLesson) return { prevLesson: null, nextLesson: null };
    
    // 获取所有模块和课时信息
    const modules = [...courseData.modules];
    
    // 按模块序号排序
    modules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    
    // 创建有序的课时列表
    let allLessons: { lesson: Lesson, moduleIndex: number }[] = [];
    
    modules.forEach((module, moduleIndex) => {
      if (!module.lessons || module.lessons.length === 0) return;
      
      // 按课时序号排序课时
      const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index);
      
      // 添加到全局列表
      sortedLessons.forEach(lesson => {
        allLessons.push({
          lesson, 
          moduleIndex
        });
      });
    });
    
    // 查找当前课时的索引
    const currentIndex = allLessons.findIndex(item => item.lesson.id === selectedLesson.id);
    if (currentIndex === -1) return { prevLesson: null, nextLesson: null };
    
    // 获取前一个和后一个课时
    const prevItem = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextItem = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    
    return { 
      prevLesson: prevItem ? prevItem.lesson : null, 
      nextLesson: nextItem ? nextItem.lesson : null 
    };
  };
  
  const { prevLesson, nextLesson } = findNeighborLessons();
  
  // 处理标记完成或取消完成
  const handleToggleComplete = async () => {
    if (!enrollmentId || !selectedLesson || !courseData.id) {
      toast.error('无法执行此操作');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isCompleted) {
        // 取消完成
        await courseService.unmarkLessonComplete(selectedLesson.id);
        toast.success('已取消标记完成');
        setIsCompleted(false);
      } else {
        // 标记完成
        await courseService.markLessonComplete(
          selectedLesson.id,
          courseData.id,
          enrollmentId
        );
        toast.success('课时已标记为完成');
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('更新完成状态失败:', error);
      toast.error(isCompleted ? '取消标记失败' : '标记完成失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
      <Button 
        variant="outline" 
        size={isMobile ? "sm" : "lg"} 
        className="flex items-center shadow-sm hover:shadow-md transition-all"
        onClick={() => prevLesson && navigate(`/course/${courseData?.id}/lesson/${prevLesson.id}`)}
        disabled={!prevLesson}
      >
        <ArrowLeft size={isMobile ? 16 : 18} className="mr-2" /> 
        {isMobile ? '上一课' : '上一课'}
      </Button>
      
      <HoverCard>
        <HoverCardTrigger asChild>
          <Button 
            className={`shadow-md hover:shadow-lg transition-all ${isCompleted 
              ? 'bg-amber-500 hover:bg-amber-600' 
              : 'bg-green-600 hover:bg-green-700'
            }`}
            size={isMobile ? "sm" : "default"}
            onClick={handleToggleComplete}
            disabled={isLoading}
          >
            {isMobile ? (
              isCompleted ? <X size={16} /> : <Check size={16} />
            ) : (
              isCompleted ? '取消完成标记' : '标记为已完成'
            )}
            {!isMobile && (
              isCompleted ? <X size={18} className="ml-2" /> : <Check size={18} className="ml-2" />
            )}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="text-sm">
            <h4 className="font-medium mb-2">
              {isCompleted ? '取消完成标记' : '完成课时'}
            </h4>
            <p>
              {isCompleted 
                ? '取消此课时的完成标记，这将影响您的学习进度。' 
                : '标记此课时为已完成后，会更新您的学习进度，并解锁下一节课程。'
              }
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      
      <Button 
        variant="outline" 
        size={isMobile ? "sm" : "lg"} 
        className="flex items-center shadow-sm hover:shadow-md transition-all"
        onClick={() => nextLesson && navigate(`/course/${courseData?.id}/lesson/${nextLesson.id}`)}
        disabled={!nextLesson}
      >
        {isMobile ? '下一课' : '下一课'} 
        <ArrowRight size={isMobile ? 16 : 18} className="ml-2" />
      </Button>
    </div>
  );
};

export default LessonNavigation;
