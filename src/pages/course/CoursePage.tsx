
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, PanelLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';

// Import components
import CourseHeader from './components/CourseHeader';
import CourseSidebar from './components/CourseSidebar';
import MobileDrawer from './components/MobileDrawer';
import LessonContent from './components/LessonContent';
import CourseAssistantChat from './components/CourseAssistantChat';
import LoadingSkeleton from './components/LoadingSkeleton';
import NotFoundCard from './components/NotFoundCard';
import { useCourseData } from './hooks/useCourseData';

const CoursePage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const isMobile = useIsMobile();
  
  const { loading, courseData, progress, enrollmentId, findCurrentLesson } = useCourseData(courseId);
  const { selectedLesson, selectedUnit } = findCurrentLesson(lessonId);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (!courseData) {
    return <NotFoundCard />;
  }
  
  const toggleNav = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <CourseHeader 
        courseData={courseData} 
        isMobile={isMobile} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      {isMobile && (
        <MobileDrawer
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          courseData={courseData}
          selectedLesson={selectedLesson}
          progress={progress}
        />
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <div 
            className={`bg-white border-r border-gray-100 overflow-y-auto hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out ${
              isNavCollapsed ? 'w-16' : 'w-72'
            }`}
          >
            {isNavCollapsed ? (
              <div className="p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleNav}
                  className="w-full h-10 flex items-center justify-center"
                  title="展开课程大纲"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
                
                <div className="mt-4 space-y-4">
                  {courseData?.modules?.map((module, index) => (
                    <div 
                      key={module.id} 
                      className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto"
                      title={module.title}
                    >
                      <span className="text-blue-600 text-xs font-medium">{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleNav}
                  className="absolute right-2 top-2 h-8 w-8"
                  title="收起课程大纲"
                >
                  <PanelLeft className="h-4 w-4 rotate-180" />
                </Button>
                <CourseSidebar 
                  courseData={courseData}
                  selectedLesson={selectedLesson}
                  progress={progress}
                />
              </div>
            )}
          </div>
        )}
        
        <div className="flex-1 overflow-auto relative">
          {isMobile && (
            <div className="md:hidden mb-4 px-4 pt-4">
              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-700">课程进度</span>
                  <span className="text-xs font-medium text-blue-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2 text-sm"
                onClick={() => setSidebarOpen(true)}
              >
                <BookOpen size={14} /> 查看课程大纲
              </Button>
            </div>
          )}
          
          <LessonContent
            selectedLesson={selectedLesson}
            selectedUnit={selectedUnit}
            courseData={courseData}
            enrollmentId={enrollmentId}
            navigate={navigate}
          />
        </div>
      </div>
      
      <CourseAssistantChat
        isChatOpen={isChatOpen}
        setIsChatOpen={setIsChatOpen}
      />
    </div>
  );
};

export default CoursePage;
