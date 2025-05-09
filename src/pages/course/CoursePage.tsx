import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, MessageSquare, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';

// Import components
import CourseHeader from './components/CourseHeader';
import CourseSidebar from './components/CourseSidebar';
import MobileDrawer from './components/MobileDrawer';
import LessonContent from './components/LessonContent';
import KhanmigoChat from '@/components/course/components/KhanmigoChat';
import LoadingSkeleton from './components/LoadingSkeleton';
import NotFoundCard from './components/NotFoundCard';
import { useCourseData } from './hooks/useCourseData';

/**
 * CoursePage组件 - 课程学习的主页面
 * 
 * 修复：解决当鼠标悬停在左侧导航菜单时热点卡片闪烁的问题
 * 1. 优化左侧侧边栏的展开/收起效果，避免对主内容区造成布局影响
 * 2. 使用固定宽度和绝对定位维持内容区域的稳定性
 * 3. 为侧边栏添加CSS隔离，确保其hover效果不会影响主内容区
 * 4. 保证主内容容器有一个固定的左侧padding，与侧边栏分离
 */
const CoursePage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  // 添加一个状态变量来存储header高度
  const [headerHeight, setHeaderHeight] = useState(60); // 默认60px
  
  // 使用localStorage记住用户的侧边栏折叠状态偏好
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('course_sidebar_collapsed');
    return savedState ? JSON.parse(savedState) : false;
  });
  
  // 当折叠状态变化时保存到localStorage
  useEffect(() => {
    localStorage.setItem('course_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  // 动态计算header高度
  useEffect(() => {
    if (!isMobile) {
      const headerElement = document.querySelector('header');
      if (headerElement) {
        // 监听窗口尺寸变化，重新计算header高度
        const updateHeaderHeight = () => {
          const height = headerElement.offsetHeight;
          setHeaderHeight(height || 60); // 如果无法获取，使用默认值60px
        };
        
        updateHeaderHeight(); // 初始计算
        window.addEventListener('resize', updateHeaderHeight);
        
        return () => {
          window.removeEventListener('resize', updateHeaderHeight);
        };
      }
    }
  }, [isMobile]);
  
  const { loading, courseData, progress, enrollmentId, findCurrentLesson, refreshCourseData } = useCourseData(courseId);
  const { selectedLesson, selectedUnit } = findCurrentLesson(lessonId);
  
  // 确保当lessonId变化时刷新课程数据，解决内容不更新问题
  useEffect(() => {
    if (lessonId) {
      refreshCourseData();
    }
  }, [lessonId, refreshCourseData]);
  
  // 添加进度加载状态
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  
  useEffect(() => {
    // 课程数据加载完成后，进度值准备就绪
    if (!loading && progress !== undefined) {
      setIsProgressLoading(false);
    }
  }, [loading, progress]);
  
  const [pageContent, setPageContent] = useState<string>('');

  useEffect(() => {
    // 当选中的课时更改时，尝试提取页面内容
    if (selectedLesson) {
      let content = '';
      
      // 根据课时类型提取内容
      if (selectedLesson.type === 'text' && selectedLesson.content) {
        // 文本课时 - 提取文本内容
        const textContent = selectedLesson.content as import('@/types/course').TextLessonContent;
        content = textContent.text || '';
      } else if (selectedLesson.type === 'quiz' && selectedLesson.content) {
        // 测验课时 - 提取所有题目
        const quizContent = selectedLesson.content as import('@/types/course').QuizLessonContent;
        if (quizContent.questions) {
          content = quizContent.questions.map((q) => 
            `问题: ${q.text} ${q.options ? q.options.map((o) => `选项: ${o.text}`).join(' ') : ''}`
          ).join('\n');
        }
      } else if (selectedLesson.type === 'video' && selectedLesson.content) {
        // 视频课时 - 提取视频描述
        const videoContent = selectedLesson.content as import('@/types/course').VideoLessonContent;
        content = videoContent.description || '';
      }
      
      // 添加课时标题
      const titleContent = `当前学习内容: ${selectedLesson.title}\n\n${content}`;
      setPageContent(titleContent);
    }
  }, [selectedLesson]);
  
  if (loading) {
    return <LoadingSkeleton />;
  }
  
  if (!courseData) {
    return <NotFoundCard />;
  }
  
  // 检查课程是否可用：课程已发布或当前用户是课程创建者
  const isCourseAvailable = courseData.status === 'published' || (user?.id && user.id === courseData.author_id);
  
  // 如果课程不可用，显示不可用信息
  if (!isCourseAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-macaron-cream">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md text-center">
          <div className="inline-flex items-center justify-center p-4 bg-amber-100 rounded-full mb-6">
            <AlertCircle size={32} className="text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-macaron-brown mb-3">课程暂不可用</h2>
          <p className="text-macaron-lightBrown mb-6">
            该课程目前已被教师取消发布，暂时无法访问。请等待课程重新发布后再来学习。
          </p>
          <Button 
            onClick={() => navigate('/learning')}
          >
            返回我的学习
          </Button>
        </div>
      </div>
    );
  }
  
  const sidebarWidth = sidebarCollapsed ? 64 : 320; // 16rem = 64px, 80rem = 320px
  
  return (
    <div className="flex flex-col h-screen bg-macaron-cream">
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
      
      {/* 使用相对定位的容器，确保内部的绝对定位元素能够正确定位 */}
      <div className="flex flex-1 overflow-hidden relative">
        {!isMobile && (
          <div 
            className={`fixed bottom-0 left-0 bg-macaron-cream border-r border-muted flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col z-20`}
            style={{ 
              width: `${sidebarWidth}px`,
              top: `${headerHeight}px`,
              height: `calc(100vh - ${headerHeight}px)`,
              willChange: 'width', // 提示浏览器此元素的宽度会变化，提高性能
              isolation: 'isolate', // 创建新的堆叠上下文，隔离其hover效果
            }}
          >
            {/* 侧边栏顶部控制栏 */}
            <div className="flex items-center justify-between p-4 border-b border-muted">
              {!sidebarCollapsed && (
                <h3 className="font-medium text-macaron-deepTeal">课程大纲</h3>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`text-primary hover:text-primary/80 ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'} rounded-full transition-colors`}
                      aria-label={sidebarCollapsed ? "展开大纲" : "收起大纲"}
                    >
                      {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* 侧边栏内容区域（可滚动） */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
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
        
        {/* 主内容区域 - 使用margin-left保持与侧边栏的间距，确保内容稳定性 */}
        <div 
          className="flex-1 flex flex-col overflow-hidden" 
          style={{ 
            marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
            transition: 'margin-left 0.3s ease-in-out',
            paddingLeft: '1px', // 增加极小的填充，防止内容紧贴边缘
            isolation: 'isolate', // 创建新的堆叠上下文，避免与侧边栏的z-index冲突
          }}
        >
          {/* 内容区域顶部控制栏 */}
          <div className="flex justify-between items-center px-6 py-3 border-b border-muted bg-white shadow-sm">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-macaron-teal hover:text-macaron-deepTeal transition-colors mr-2"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                课程大纲
              </Button>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-medium text-macaron-brown">课程进度</span>
              <div className="w-48 mr-2 relative">
                <Progress 
                  value={isProgressLoading ? 0 : progress} 
                  className="h-2 progress-kids" 
                />
                {isProgressLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-2 w-2 animate-spin text-macaron-teal" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-macaron-deepMint min-w-[40px] bg-macaron-mint/30 py-1 px-2 rounded-full">
                {isProgressLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  `${progress}%`
                )}
              </span>
            </div>
          </div>
          
          {/* 内容区域（可滚动） */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted bg-white">
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
      
      {/* 使用KhanmigoChat替代原来的FloatingAssistantChat */}
      <KhanmigoChat
        courseName={courseData.title}
        courseContent={pageContent}
      />
    </div>
  );
};

export default CoursePage;
