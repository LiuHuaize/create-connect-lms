import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
  
  // 添加进度加载状态
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  
  useEffect(() => {
    // 课程数据加载完成后，进度值准备就绪
    if (!loading && progress !== undefined) {
      setIsProgressLoading(false);
    }
  }, [loading, progress]);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (!courseData) {
    return <NotFoundCard />;
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
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
            className={`bg-white border-r border-gray-100 flex-shrink-0 transition-all duration-300 h-full flex flex-col ${
              sidebarCollapsed ? 'w-16' : 'w-80'
            }`}
          >
            {/* 侧边栏顶部控制栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              {!sidebarCollapsed && (
                <h3 className="font-medium text-gray-800">课程大纲</h3>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-gray-600 hover:text-blue-600 ml-auto"
                aria-label={sidebarCollapsed ? "展开大纲" : "收起大纲"}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
            </div>
            
            {/* 侧边栏内容区域（可滚动） */}
            <div className="flex-1 overflow-y-auto">
              {!sidebarCollapsed && (
                <CourseSidebar 
                  courseData={courseData}
                  selectedLesson={selectedLesson}
                  progress={progress}
                />
              )}
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 内容区域顶部控制栏 */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-gray-100 bg-white">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-blue-600 mr-2"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                课程大纲
              </Button>
            )}
            
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium text-gray-600">课程进度:</span>
              <div className="w-40 mr-2 relative">
                <Progress value={isProgressLoading ? 0 : progress} className="h-2" />
                {isProgressLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-2 w-2 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-blue-600 min-w-[30px]">
                {isProgressLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  `${progress}%`
                )}
              </span>
            </div>
          </div>
          
          {/* 内容区域（可滚动） */}
          <div className="flex-1 overflow-y-auto">
            <LessonContent
              selectedLesson={selectedLesson}
              selectedUnit={selectedUnit}
              courseData={courseData}
              enrollmentId={enrollmentId}
              navigate={navigate}
            />
          </div>
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
