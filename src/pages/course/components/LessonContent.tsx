
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Course, CourseLesson } from '@/types/course';
import { courseService } from '@/services/courseService';

interface LessonContentProps {
  selectedLesson: CourseLesson | undefined;
  selectedUnit: any;
  courseData: Course & { modules?: any[] };
  enrollmentId: string | undefined;
  navigate: ReturnType<typeof useNavigate>;
}

const LessonContent: React.FC<LessonContentProps> = ({
  selectedLesson,
  selectedUnit,
  courseData,
  enrollmentId,
  navigate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);
  const [prevLesson, setPrevLesson] = useState<CourseLesson | undefined>(undefined);
  const [nextLesson, setNextLesson] = useState<CourseLesson | undefined>(undefined);

  useEffect(() => {
    if (!courseData || !selectedLesson) return;

    const currentModule = courseData.modules?.find(module =>
      module.lessons?.some(lesson => lesson.id === selectedLesson.id)
    );

    if (!currentModule) return;

    const lessonIndex = currentModule.lessons?.findIndex(lesson => lesson.id === selectedLesson.id);

    if (lessonIndex === undefined || lessonIndex === -1) return;

    // 上一课
    if (lessonIndex > 0 && currentModule.lessons) {
      setPrevLesson(currentModule.lessons[lessonIndex - 1] as CourseLesson);
    } else {
      // 如果是模块的第一课，尝试找到上一个模块的最后一课
      const currentModuleIndex = courseData.modules?.findIndex(module => module.id === currentModule.id);
      if (currentModuleIndex && currentModuleIndex > 0 && courseData.modules) {
        const prevModule = courseData.modules[currentModuleIndex - 1];
        if (prevModule.lessons && prevModule.lessons.length > 0) {
          setPrevLesson(prevModule.lessons[prevModule.lessons.length - 1] as CourseLesson);
        } else {
          setPrevLesson(undefined);
        }
      } else {
        setPrevLesson(undefined);
      }
    }

    // 下一课
    if (lessonIndex < currentModule.lessons!.length - 1 && currentModule.lessons) {
      setNextLesson(currentModule.lessons[lessonIndex + 1] as CourseLesson);
    } else {
      // 如果是模块的最后一课，尝试找到下一个模块的第一课
      const currentModuleIndex = courseData.modules?.findIndex(module => module.id === currentModule.id);
      if (currentModuleIndex !== undefined && currentModuleIndex < courseData.modules!.length - 1 && courseData.modules) {
        const nextModule = courseData.modules[currentModuleIndex + 1];
        if (nextModule.lessons && nextModule.lessons.length > 0) {
          setNextLesson(nextModule.lessons[0] as CourseLesson);
        } else {
          setNextLesson(undefined);
        }
      } else {
        setNextLesson(undefined);
      }
    }
  }, [courseData, selectedLesson]);

  const handleMarkComplete = async () => {
    if (!enrollmentId || !selectedLesson?.id) return;

    setIsSubmitting(true);
    setCompletionSuccess(false);

    try {
      await courseService.markLessonComplete(enrollmentId, selectedLesson.id);
      setCompletionSuccess(true);
      // Optionally, refresh course data or update UI immediately
    } catch (error) {
      console.error("Failed to mark lesson as complete:", error);
      // Handle error (e.g., show a toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    if (prevLesson) {
      navigate(`/course/${courseData.id}/lesson/${prevLesson.id}`);
    }
  };

  const handleNext = () => {
    if (nextLesson) {
      navigate(`/course/${courseData.id}/lesson/${nextLesson.id}`);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {selectedLesson ? (
        <div className="animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{selectedLesson.title}</h1>
            
            {isSubmitting && (
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                记录学习进度中...
              </div>
            )}
            
            {completionSuccess && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
                学习进度已更新！
              </div>
            )}
            
            <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
              {selectedLesson.type === 'video' && selectedLesson.video_url && (
                <div className="aspect-video bg-gray-100 rounded-lg mb-6 overflow-hidden">
                  <iframe 
                    className="w-full h-full" 
                    src={selectedLesson.video_url} 
                    title={selectedLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              {selectedLesson.content && (
                <div 
                  className="prose prose-blue max-w-none" 
                  dangerouslySetInnerHTML={{ __html: typeof selectedLesson.content === 'string' 
                    ? selectedLesson.content 
                    : JSON.stringify(selectedLesson.content) 
                  }}
                />
              )}
            </div>
            
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={!prevLesson}
                className="px-4"
              >
                上一课
              </Button>
              
              <Button
                onClick={handleMarkComplete}
                disabled={completionSuccess || isSubmitting}
                className="px-6 bg-blue-600 hover:bg-blue-700"
              >
                标记为已完成
              </Button>
              
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={!nextLesson}
                className="px-4"
              >
                下一课
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={36} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">开始学习 {courseData.title}</h2>
          <p className="text-gray-500 mb-6 max-w-md">选择左侧的课程开始学习，或者从第一节课开始</p>
          {courseData.modules && courseData.modules.length > 0 && courseData.modules[0].lessons && courseData.modules[0].lessons.length > 0 && (
            <Button 
              onClick={() => navigate(`/course/${courseData.id}/lesson/${courseData.modules[0].lessons[0].id}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              开始第一课
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonContent;
