import React, { Suspense } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useIncrementalSave } from '@/hooks/useIncrementalSave';

// Lazy loaded components
const LessonEditor = React.lazy(() => import('@/components/course/LessonEditor'));
const CourseDetailsForm = React.lazy(() => import('@/components/course/creator/CourseDetailsForm'));
const CourseImageUploader = React.lazy(() => import('@/components/course/creator/CourseImageUploader'));
const ModuleList = React.lazy(() => import('@/components/course/creator/module-list/ModuleList'));
const StudentStatistics = React.lazy(() => import('@/components/course/creator/StudentStatistics'));

interface CourseTabContentProps {
  loadingDetails: boolean;
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
  currentLesson: Lesson | null;
  setCurrentLesson: React.Dispatch<React.SetStateAction<Lesson | null>>;
  modules: CourseModule[];
  setModules: React.Dispatch<React.SetStateAction<CourseModule[]>>;
  expandedModule: string | null;
  setExpandedModule: React.Dispatch<React.SetStateAction<string | null>>;
  coverImageURL: string | null;
  setCoverImageURL: React.Dispatch<React.SetStateAction<string | null>>;
  moduleDataLoaded: boolean;
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
  onSaveCourse?: (updatedLesson?: Lesson) => Promise<string | undefined | void>;
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    <span className="ml-2 text-gray-500">正在加载...</span>
  </div>
);

const CourseTabContent: React.FC<CourseTabContentProps> = ({
  loadingDetails,
  course,
  setCourse,
  currentLesson,
  setCurrentLesson,
  modules,
  setModules,
  expandedModule,
  setExpandedModule,
  coverImageURL,
  setCoverImageURL,
  moduleDataLoaded,
  onEditorFullscreenChange,
  onSaveCourse,
}) => {
  const { saveLesson } = useIncrementalSave({ courseId: course.id });
  
  // 专门为框架课时提供的保存函数
  const handleSaveFrameLesson = async (updatedFrameLesson: Lesson): Promise<string | undefined | void> => {
    try {
      console.log('保存框架课时到数据库:', updatedFrameLesson);
      await saveLesson(updatedFrameLesson);
      
      // 同时更新本地状态
      const moduleId = modules.find(m => 
        m.lessons.some(l => l.id === updatedFrameLesson.id)
      )?.id;
      
      if (moduleId) {
        const updatedModules = modules.map(module => {
          if (module.id === moduleId) {
            const updatedLessons = module.lessons.map(lesson => 
              lesson.id === updatedFrameLesson.id ? { ...updatedFrameLesson } : lesson
            );
            return { ...module, lessons: updatedLessons };
          }
          return module;
        });
        setModules(updatedModules);
      }
      
      return 'success';
    } catch (error) {
      console.error('保存框架课时失败:', error);
      throw error;
    }
  };
  const updateLesson = async (moduleId: string, lessonId: string, updatedLesson: Lesson | null) => {
    if (!updatedLesson) {
      setCurrentLesson(null);
      return;
    }
    
    console.log(`CourseTabContent - 更新课时: ${lessonId}`, updatedLesson);
    console.log(`课时标题更新: 从 "${modules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId)?.title}" 到 "${updatedLesson.title}"`);
    
    // 更新本地状态
    const updatedModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = module.lessons.map(lesson => 
          lesson.id === lessonId ? { ...updatedLesson } : lesson
        );
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    
    setModules(updatedModules);
    
    // 使用增量保存，只保存这个课时
    await saveLesson(updatedLesson);
    
    setCurrentLesson(null);
  };
  
  // Add a new handler for content changes
  const handleLessonContentChange = (moduleId: string, lessonId: string, newContent: any) => {
    setModules(prevModules => 
      prevModules.map(module => {
        if (module.id === moduleId) {
          return {
            ...module,
            lessons: module.lessons.map(lesson => {
              if (lesson.id === lessonId) {
                return {
                  ...lesson,
                  content: newContent
                };
              }
              return lesson;
            })
          };
        }
        return module;
      })
    );
    // Also update the currentLesson state if it's the one being edited
    if (currentLesson && currentLesson.id === lessonId) {
      setCurrentLesson(prevLesson => (
        prevLesson ? { ...prevLesson, content: newContent } : null
      ));
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <TabsContent value="details" className="space-y-6">
        {loadingDetails ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-400" />
            <span className="text-gray-500">正在加载课程详情...</span>
          </div>
        ) : (
          <>
            <CourseDetailsForm course={course} setCourse={setCourse} />
            <CourseImageUploader 
              course={course}
              setCourse={setCourse}
              coverImageURL={coverImageURL}
              setCoverImageURL={setCoverImageURL}
            />
          </>
        )}
      </TabsContent>
      
      <TabsContent value="content" className="space-y-6">
        {!moduleDataLoaded ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin mr-2 text-gray-400" />
            <span className="text-gray-500">正在加载课程内容...</span>
          </div>
        ) : currentLesson ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold">编辑课程</h2>
              <Button variant="outline" size="sm" onClick={() => setCurrentLesson(null)}>
                返回课程结构
              </Button>
            </div>
            
            <LessonEditor 
              lesson={currentLesson}
              onSave={async (updatedLesson) => {
                const moduleId = modules.find(m => 
                  m.lessons.some(l => l.id === currentLesson.id)
                )?.id;
                
                if (moduleId) {
                  await updateLesson(moduleId, currentLesson.id, updatedLesson);
                }
              }}
              onContentChange={(newContent) => {
                const moduleId = modules.find(m => 
                  m.lessons.some(l => l.id === currentLesson.id)
                )?.id;
                if (moduleId) {
                  handleLessonContentChange(moduleId, currentLesson.id, newContent);
                }
              }}
              onEditorFullscreenChange={onEditorFullscreenChange}
              onCourseDataSaved={onSaveCourse}
              onSaveFrameLesson={handleSaveFrameLesson}
            />
          </div>
        ) : (
          <ModuleList 
            modules={modules}
            setModules={setModules}
            setCurrentLesson={setCurrentLesson}
            expandedModule={expandedModule}
            setExpandedModule={setExpandedModule}
            courseId={course.id}
          />
        )}
      </TabsContent>
      
      <TabsContent value="settings">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4">课程设置</h2>
          <p className="text-gray-500">课程设置选项将在后续版本中提供。</p>
        </div>
      </TabsContent>
      
      <TabsContent value="students">
        <StudentStatistics />
      </TabsContent>
    </Suspense>
  );
};

export default CourseTabContent;
