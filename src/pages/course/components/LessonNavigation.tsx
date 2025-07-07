import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Trophy, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Course, CourseModule, Lesson } from '@/types/course';
import { useIsMobile } from '@/hooks/use-mobile';
import LessonCompletionButton from '@/components/course/lessons/LessonCompletionButton';
import { courseService } from '@/services/courseService';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';
import { toast } from 'sonner';

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
  const [showCelebration, setShowCelebration] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  
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

  // 使用课程完成状态Hook
  const { completionStatus } = useCourseCompletion({
    courseId: courseData?.id,
    autoLoad: true
  });

  // 检查课程进度
  useEffect(() => {
    if (courseData?.id && enrollmentId) {
      const allLessons = getAllLessons();
      const completedCount = allLessons.filter(lesson => completionStatus[lesson.id]).length;
      const progress = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
      setCourseProgress(progress);
    }
  }, [courseData?.id, enrollmentId, selectedLesson?.id, completionStatus]);

  // 获取所有课时
  const getAllLessons = () => {
    if (!courseData?.modules) return [];

    const modules = [...courseData.modules];
    modules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

    let allLessons: Lesson[] = [];
    modules.forEach(module => {
      if (module.lessons && module.lessons.length > 0) {
        const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index);
        allLessons = [...allLessons, ...sortedLessons];
      }
    });

    return allLessons;
  };

  // 检查是否是最后一课且课程已完成
  const isLastLessonAndCourseComplete = () => {
    if (!selectedLesson || !nextLesson) {
      // 这是最后一课
      return courseProgress >= 80; // 80%以上就算完成
    }
    return false;
  };

  // 处理课程完成
  const handleCourseComplete = () => {
    setShowCelebration(true);
    toast.success('🎉 恭喜！您已完成整个课程！', {
      duration: 3000,
    });

    // 3秒后跳转到主页
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  // 处理下一课按钮点击
  const handleNextLesson = () => {
    if (nextLesson) {
      navigate(`/course/${courseData?.id}/lesson/${nextLesson.id}`);
    } else if (isLastLessonAndCourseComplete()) {
      handleCourseComplete();
    }
  };

  // 庆祝组件
  const CelebrationModal = () => {
    if (!showCelebration) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-in zoom-in-95 duration-300" data-testid="celebration-modal">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Trophy className="w-10 h-10 text-white" data-testid="trophy-icon" />
            </div>
            <div className="flex justify-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse delay-100" />
              <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse delay-200" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 课程完成！
          </h2>
          <p className="text-gray-600 mb-6">
            恭喜您成功完成了《{courseData?.title}》课程！
            <br />
            即将跳转到主页...
          </p>

          <div className="flex space-x-3">
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Home className="w-4 h-4 mr-2" />
              返回主页
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/learning')}
              className="flex-1"
            >
              我的学习
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
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
          className="px-6 py-2 rounded-xl"
        />
      )}
      
      <Button
        variant="outline"
        size={isMobile ? "sm" : "default"}
        className={`flex items-center border-macaron-lavender text-macaron-darkGray hover:bg-macaron-cream/30 transition-all ${
          !nextLesson && isLastLessonAndCourseComplete()
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 hover:from-green-600 hover:to-emerald-700'
            : ''
        }`}
        onClick={handleNextLesson}
        disabled={!nextLesson && !isLastLessonAndCourseComplete()}
      >
        {!nextLesson && isLastLessonAndCourseComplete() ? (
          <>
            <Trophy size={isMobile ? 16 : 18} className="mr-2" />
            {isMobile ? '完成课程' : '完成课程'}
          </>
        ) : (
          <>
            {isMobile ? '下一课' : '下一课'}
            <ArrowRight size={isMobile ? 16 : 18} className="ml-2" />
          </>
        )}
      </Button>
    </div>

    <CelebrationModal />
  </>
  );
};

export default LessonNavigation;
