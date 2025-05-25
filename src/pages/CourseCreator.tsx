import React, { lazy } from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';
import { useCourseCreator } from '@/components/course/creator/course-creator/useCourseCreator';
import CourseHeader from '@/components/course/creator/course-creator/CourseHeader';
import CourseTabContent from '@/components/course/creator/course-creator/CourseTabContent';

const CourseOverview = lazy(() => import('@/components/course/creator/CourseOverview'));

interface CourseCreatorProps {
  onEditorFullscreenChange?: (isFullscreen: boolean) => void;
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ onEditorFullscreenChange }) => {
  const {
    course,
    setCourse,
    modules,
    setModules,
    currentLesson,
    setCurrentLesson,
    expandedModule,
    setExpandedModule,
    coverImageURL,
    setCoverImageURL,
    completionPercentage,
    isLoading,
    loadingDetails,
    moduleDataLoaded,
    handleSaveCourse,
    handleBackToSelection,

    canUndo,
    canRedo,
    handleUndo,
    handleRedo
  } = useCourseCreator();

  if (isLoading && !moduleDataLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin mr-3 text-gray-400" />
        <p className="text-gray-500">正在加载课程...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <CourseHeader 
        course={course}
        modules={modules}
        handleBackToSelection={handleBackToSelection}
        handleSaveCourse={handleSaveCourse}

        setCourse={setCourse}
        canUndo={canUndo}
        canRedo={canRedo}
        handleUndo={handleUndo}
        handleRedo={handleRedo}

      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-6 w-full justify-start">
              <TabsTrigger value="details">课程详情</TabsTrigger>
              <TabsTrigger value="content">内容</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
              <TabsTrigger value="students">学生统计</TabsTrigger>
            </TabsList>
            
            <CourseTabContent
              loadingDetails={loadingDetails}
              course={course}
              setCourse={setCourse}
              currentLesson={currentLesson}
              setCurrentLesson={setCurrentLesson}
              modules={modules}
              setModules={setModules}
              expandedModule={expandedModule}
              setExpandedModule={setExpandedModule}
              coverImageURL={coverImageURL}
              setCoverImageURL={setCoverImageURL}
              moduleDataLoaded={moduleDataLoaded}
              onEditorFullscreenChange={onEditorFullscreenChange}
              onSaveCourse={handleSaveCourse}
            />
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <React.Suspense fallback={
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">正在加载...</span>
            </div>
          }>
            <CourseOverview 
              course={course}
              modules={modules}
              completionPercentage={completionPercentage}
              coverImageURL={coverImageURL}
            />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
};

export default CourseCreator;
