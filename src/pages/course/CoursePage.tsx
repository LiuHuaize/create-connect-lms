import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, ChevronLeft, ChevronRight, Loader2, MessageSquare, X, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from "@/components/ui/button";
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { enrollCourse } from '@/hooks/useCoursesData';
import { toast } from 'sonner';

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
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
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

  // 自动注册状态
  const [autoEnrollAttempted, setAutoEnrollAttempted] = useState(false);
  const [isAutoEnrolling, setIsAutoEnrolling] = useState(false);

  // AI评分结果展示状态
  const [showGradingResult, setShowGradingResult] = useState(false);

  // 自动注册逻辑 - 修复：确保从详情页跳转过来的用户能正确识别注册状态
  useEffect(() => {
    const attemptAutoEnroll = async () => {
      // 检查是否需要自动注册
      if (
        !autoEnrollAttempted &&
        !loading &&
        courseData &&
        user?.id &&
        !enrollmentId &&
        courseData.status === 'published' &&
        courseData.author_id !== user.id // 不是课程创建者
      ) {
        setAutoEnrollAttempted(true);
        setIsAutoEnrolling(true);

        try {
          console.log('🔄 自动注册课程:', courseId);
          const result = await enrollCourse({ userId: user.id, courseId: courseId! });

          if (result.existingEnrollment) {
            console.log('✅ 用户已注册过此课程');
            // 不显示toast，因为用户可能是从详情页跳转过来的
          } else {
            console.log('✅ 自动注册成功');
            toast.success('已自动加入课程！', { duration: 2000 });
          }

          // 刷新课程数据以获取最新的注册信息
          await refreshCourseData();

          // 等待一小段时间确保数据更新完成
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          console.error('❌ 自动注册失败:', error);
          // 自动注册失败时不显示错误提示，让用户手动点击"获取最新内容"
        } finally {
          setIsAutoEnrolling(false);
        }
      }
    };

    attemptAutoEnroll();
  }, [loading, courseData, user?.id, enrollmentId, autoEnrollAttempted, courseId, refreshCourseData]);

  // 添加额外的注册状态检查 - 修复从详情页跳转后的状态同步问题
  useEffect(() => {
    // 当页面加载完成且用户已登录时，额外检查一次注册状态
    if (!loading && courseData && user?.id && !enrollmentId && !autoEnrollAttempted) {
      console.log('🔍 额外检查注册状态，可能是从详情页跳转过来的');
      // 强制刷新一次数据以确保状态同步
      refreshCourseData();
    }
  }, [loading, courseData, user?.id, enrollmentId, autoEnrollAttempted, refreshCourseData]);

  // 处理AI评分结果展示状态
  useEffect(() => {
    if (location.state?.showGradingResult) {
      setShowGradingResult(true);
      // 清除状态，避免刷新页面时重复显示
      navigate(location.pathname, { replace: true, state: {} });

      // 显示评分完成提示
      toast.success('AI评分已完成！请查看您的评分结果。', {
        duration: 5000,
      });
    }
  }, [location.state, navigate, location.pathname]);

  // 修复重复请求问题：移除强制清除缓存的逻辑
  // 让 useCourseData 的内置缓存机制处理数据获取
  // useEffect(() => {
  //   if (courseId) {
  //     // 清除可能的旧缓存，确保获取正确的课程数据
  //     queryClient.removeQueries({ queryKey: ['courseDetails'] });
  //     queryClient.removeQueries({ queryKey: ['enrollment'] });
  //   }
  // }, [courseId, queryClient]);
  
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
  
  if (loading || isAutoEnrolling) {
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
    <div className="flex flex-col h-screen bg-gray-100">
      <CourseHeader
        courseData={courseData}
        isMobile={isMobile}
        setSidebarOpen={setSidebarOpen}
        enrollmentId={enrollmentId}
        isAutoEnrolling={isAutoEnrolling}
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
            className={`fixed bottom-0 left-0 bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col z-20 shadow-sm`}
            style={{ 
              width: `${sidebarWidth}px`,
              top: `${headerHeight}px`,
              height: `calc(100vh - ${headerHeight}px)`,
              willChange: 'width', // 提示浏览器此元素的宽度会变化，提高性能
              isolation: 'isolate', // 创建新的堆叠上下文，隔离其hover效果
            }}
          >
            {/* 侧边栏顶部控制栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              {!sidebarCollapsed && (
                <h3 className="font-semibold text-gray-800">课程大纲</h3>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className={`text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${sidebarCollapsed ? 'mx-auto' : 'ml-auto'} rounded-full transition-all`}
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
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white shadow-sm">
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-700 hover:bg-gray-100 transition-all mr-2"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                课程大纲
              </Button>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              <span className="text-xs font-semibold text-gray-700">学习进度</span>
              <div className="w-48 mr-2 relative">
                <Progress 
                  value={isProgressLoading ? 0 : progress} 
                  className="h-2.5 bg-gray-200" 
                />
                {isProgressLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-2 w-2 animate-spin text-macaron-teal" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-white min-w-[45px] bg-gradient-to-r from-blue-500 to-blue-600 py-1.5 px-3 rounded-full shadow-sm">
                {isProgressLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin inline" />
                ) : (
                  `${progress}%`
                )}
              </span>
            </div>
          </div>
          
          {/* 内容区域（可滚动） */}
          <div className="flex-1 overflow-y-auto bg-white">
            <LessonContent
              selectedLesson={selectedLesson}
              selectedUnit={selectedUnit}
              courseData={courseData}
              enrollmentId={enrollmentId}
              navigate={navigate}
              showGradingResult={showGradingResult}
              onGradingResultShown={() => setShowGradingResult(false)}
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
