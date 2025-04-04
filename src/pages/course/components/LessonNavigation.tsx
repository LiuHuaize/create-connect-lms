
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
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

  const getAdjacentLesson = (direction: 'prev' | 'next') => {
    if (!courseData?.modules || !selectedLesson) return null;
    
    const modules = courseData.modules;
    let targetLesson = null;
    
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const lessons = module.lessons || [];
      
      for (let j = 0; j < lessons.length; j++) {
        if (lessons[j].id === selectedLesson.id) {
          if (direction === 'prev') {
            if (j > 0) {
              targetLesson = lessons[j - 1];
            } else if (i > 0) {
              const prevModule = modules[i - 1];
              const prevLessons = prevModule.lessons || [];
              if (prevLessons.length > 0) {
                targetLesson = prevLessons[prevLessons.length - 1];
              }
            }
          } else { // next
            if (j < lessons.length - 1) {
              targetLesson = lessons[j + 1];
            } else if (i < modules.length - 1) {
              const nextModule = modules[i + 1];
              const nextLessons = nextModule.lessons || [];
              if (nextLessons.length > 0) {
                targetLesson = nextLessons[0];
              }
            }
          }
          break;
        }
      }
      if (targetLesson) break;
    }
    
    return targetLesson;
  };
  
  const prevLesson = getAdjacentLesson('prev');
  const nextLesson = getAdjacentLesson('next');

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
            className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
            size={isMobile ? "sm" : "default"}
            onClick={async () => {
              try {
                if (!enrollmentId || !selectedLesson || !courseData.id) {
                  toast.error('无法标记课时完成');
                  return;
                }
                
                await courseService.markLessonComplete(
                  selectedLesson.id,
                  courseData.id,
                  enrollmentId
                );
                
                toast.success('课时已完成');
                
                // 如果有下一课时，自动导航到下一课时
                if (nextLesson) {
                  navigate(`/course/${courseData.id}/lesson/${nextLesson.id}`);
                }
              } catch (error) {
                console.error('更新进度失败:', error);
                toast.error('标记完成失败');
              }
            }}
          >
            {isMobile ? <Check size={16} /> : '标记为已完成'} 
            {!isMobile && <Check size={18} className="ml-2" />}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="text-sm">
            <h4 className="font-medium mb-2">完成课时</h4>
            <p>标记此课时为已完成后，会更新您的学习进度，并解锁下一节课程。</p>
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
