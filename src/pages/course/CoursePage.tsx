import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
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
  const isMobile = useIsMobile();
  
  // 默认侧边栏状态设为展开
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { loading, courseData, progress, enrollmentId, findCurrentLesson } = useCourseData(courseId);
  const { selectedLesson, selectedUnit } = findCurrentLesson(lessonId);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (!courseData) {
    return <NotFoundCard />;
  }
  
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
            className={`bg-white border-r border-gray-100 overflow-y-auto transition-all duration-300 ease-in-out flex-shrink-0 ${
              sidebarCollapsed ? 'w-0' : 'w-72'
            }`}
          >
            <CourseSidebar 
              courseData={courseData}
              selectedLesson={selectedLesson}
              progress={progress}
            />
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          {!isMobile && (
            <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-600 hover:text-blue-600"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {sidebarCollapsed ? '显示课程大纲' : '隐藏课程大纲'}
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">课程进度:</span>
                <div className="w-36 mr-2">
                  <Progress value={progress} className="h-2" />
                </div>
                <span className="text-xs font-semibold text-blue-600">{progress}%</span>
              </div>
            </div>
          )}
          
          {isMobile && (
            <div className="md:hidden px-4 pt-4">
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
