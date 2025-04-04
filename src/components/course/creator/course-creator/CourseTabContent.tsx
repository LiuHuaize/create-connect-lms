
import React, { Suspense } from 'react';
import { TabsContent } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { Course, CourseModule, Lesson } from '@/types/course';
import { Button } from '@/components/ui/button';

// Lazy loaded components
const LessonEditor = React.lazy(() => import('@/components/course/LessonEditor'));
const CourseDetailsForm = React.lazy(() => import('@/components/course/creator/CourseDetailsForm'));
const CourseImageUploader = React.lazy(() => import('@/components/course/creator/CourseImageUploader'));
const ModuleList = React.lazy(() => import('@/components/course/creator/ModuleList'));
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
}) => {
  const updateLesson = (moduleId: string, lessonId: string, updatedLesson: Lesson | null) => {
    if (!updatedLesson) {
      setCurrentLesson(null);
      return;
    }
    
    setModules(modules.map(module => 
      module.id === moduleId 
        ? { 
            ...module, 
            lessons: module.lessons.map(lesson => 
              lesson.id === lessonId ? updatedLesson : lesson
            ) 
          } 
        : module
    ));
    setCurrentLesson(null);
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
              onSave={(updatedLesson) => {
                const moduleId = modules.find(m => 
                  m.lessons.some(l => l.id === currentLesson.id)
                )?.id;
                
                if (moduleId) {
                  updateLesson(moduleId, currentLesson.id, updatedLesson);
                }
              }}
              onEditorFullscreenChange={onEditorFullscreenChange}
            />
          </div>
        ) : (
          <ModuleList 
            modules={modules}
            setModules={setModules}
            setCurrentLesson={setCurrentLesson}
            expandedModule={expandedModule}
            setExpandedModule={setExpandedModule}
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
