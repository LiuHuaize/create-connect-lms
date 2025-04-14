import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, MessageSquare, X, AlertCircle } from 'lucide-react';
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
  
  // 使用localStorage记住用户的侧边栏折叠状态偏好
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('course_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // 当折叠状态变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('course_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
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
  
  // 检查课程是否可用（课程状态为已发布）
  const isCourseAvailable = courseData.status === 'published';
  
  // 如果课程不可用，显示不可用信息
  if (!isCourseAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-6">
            <AlertCircle size={32} className="text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">课程暂不可用</h2>
          <p className="text-gray-600 mb-6">
            该课程目前已被教师取消发布，暂时无法访问。请等待课程重新发布后再来学习。
          </p>
          <Button 
            onClick={() => navigate('/learning')}
            className="bg-connect-blue hover:bg-blue-600 text-white"
          >
            返回我的学习
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
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
            className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 transition-all duration-300 ease-in-out h-full flex flex-col ${
              sidebarCollapsed ? 'w-16' : 'w-80'
            }`}
          >
            {/* 侧边栏顶部控制栏 */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              {!sidebarCollapsed && (
                <h3 className="font-medium text-slate-800 dark:text-slate-200">课程大纲</h3>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'} rounded-full transition-colors`}
                aria-label={sidebarCollapsed ? "展开大纲" : "收起大纲"}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
            </div>
            
            {/* 侧边栏内容区域（可滚动） */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {!sidebarCollapsed ? (
                <CourseSidebar 
                  courseData={courseData}
                  selectedLesson={selectedLesson}
                  progress={progress}
                />
              ) : (
                <CourseSidebar 
                  courseData={courseData}
                  selectedLesson={selectedLesson}
                  progress={progress}
                  collapsed={true}
                />
              )}
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 内容区域顶部控制栏 */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-2"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                课程大纲
              </Button>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">课程进度</span>
              <div className="w-48 mr-2 relative">
                <Progress 
                  value={isProgressLoading ? 0 : progress} 
                  className="h-2 bg-slate-200 dark:bg-slate-700" 
                />
                {isProgressLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-2 w-2 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 min-w-[40px] bg-blue-50 dark:bg-blue-900/30 py-1 px-2 rounded-full">
                {isProgressLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  `${progress}%`
                )}
              </span>
            </div>
            
            {/* 添加学习助手按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="ml-4 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {isChatOpen ? (
                <X className="h-4 w-4 mr-2" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              {isChatOpen ? "关闭助手" : "学习助手"}
            </Button>
          </div>
          
          {/* 内容区域（可滚动） */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 bg-white dark:bg-slate-800">
            <LessonContent
              selectedLesson={selectedLesson}
              selectedUnit={selectedUnit}
              courseData={courseData}
              enrollmentId={enrollmentId}
              navigate={navigate}
            />
          </div>
        </div>
        
        {/* 学习助手聊天抽屉 */}
        <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-lg transform transition-transform duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} z-20`}>
          <CourseAssistantChat
            isChatOpen={isChatOpen}
            setIsChatOpen={setIsChatOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
