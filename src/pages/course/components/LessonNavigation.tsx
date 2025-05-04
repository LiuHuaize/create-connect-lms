import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCourseData } from '../hooks/useCourseData';
import LessonCompletionButton from '@/components/course/lessons/LessonCompletionButton';

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
  
  // 获取刷新课程数据的方法
  const { refreshCourseData } = useCourseData(courseData?.id);

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
        // 直接添加所有顶层课时
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

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-macaron-lavender/30">
      <Button 
        variant="outline" 
        size={isMobile ? "sm" : "default"} 
        className="flex items-center border-macaron-lavender text-macaron-darkGray hover:bg-macaron-cream/30 transition-all"
        onClick={() => prevLesson && navigate(`/course/${courseData?.id}/lesson/${prevLesson.id}`)}
        disabled={!prevLesson}
      >
        <ArrowLeft size={isMobile ? 16 : 18} className="mr-2" /> 
        {isMobile ? '上一课' : '上一课'}
      </Button>
      
      {selectedLesson && courseData?.id && (
        <LessonCompletionButton
          lessonId={selectedLesson.id}
          courseId={courseData.id}
          enrollmentId={enrollmentId}
          refreshCourseData={refreshCourseData}
          className="px-6 py-2 rounded-xl"
        />
      )}
      
      <Button 
        variant="outline" 
        size={isMobile ? "sm" : "default"} 
        className="flex items-center border-macaron-lavender text-macaron-darkGray hover:bg-macaron-cream/30 transition-all"
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
