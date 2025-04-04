import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, BookOpen, Play, Check, MessageSquare, 
  Award, Video, FileText, HelpCircle, ArrowLeft, 
  ArrowRight, Menu, PanelLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { Course, CourseModule } from '@/types/course';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarProvider,
  SidebarHeader
} from '@/components/ui/sidebar';

const ContentTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'video':
      return <Video size={18} className="mr-2 text-blue-500" />;
    case 'quiz':
      return <HelpCircle size={18} className="mr-2 text-purple-500" />;
    case 'interactive':
      return <Play size={18} className="mr-2 text-green-500" />;
    case 'game':
      return <Play size={18} className="mr-2 text-orange-500" />;
    case 'activity':
      return <FileText size={18} className="mr-2 text-indigo-500" />;
    case 'text':
      return <BookOpen size={18} className="mr-2 text-gray-500" />;
    default:
      return <BookOpen size={18} className="mr-2 text-gray-500" />;
  }
};

const CoursePage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<(Course & { modules?: CourseModule[] }) | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        console.log('正在获取课程详情:', courseId);
        
        const { data: user } = await supabase.auth.getUser();
        if (user && user.user) {
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('id, progress')
            .eq('user_id', user.user.id)
            .eq('course_id', courseId)
            .maybeSingle();
            
          if (enrollments) {
            setEnrollmentId(enrollments.id);
            setProgress(enrollments.progress || 0);
          }
        }
        
        const courseDetails = await courseService.getCourseDetails(courseId);
        console.log('获取到的课程详情:', courseDetails);
        setCourseData(courseDetails);
      } catch (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);
  
  let selectedLesson = null;
  let selectedUnit = null;
  
  if (courseData?.modules && courseData.modules.length > 0) {
    if (lessonId) {
      for (const module of courseData.modules) {
        if (!module.lessons) continue;
        const lesson = module.lessons.find(l => l.id === lessonId);
        if (lesson) {
          selectedLesson = lesson;
          selectedUnit = module;
          break;
        }
      }
    }
    
    if (!selectedLesson) {
      for (const module of courseData.modules) {
        if (module.lessons && module.lessons.length > 0) {
          selectedLesson = module.lessons[0];
          selectedUnit = module;
          break;
        }
      }
    }
  }
  
  const renderLessonContent = () => {
    if (!selectedLesson) return null;
    
    switch (selectedLesson.type) {
      case 'text':
        return (
          <div className="prose max-w-none">
            {selectedLesson.content?.text ? (
              <div dangerouslySetInnerHTML={{ 
                __html: JSON.parse(selectedLesson.content.text).map((block: any) => {
                  if (block.type === 'paragraph') {
                    return `<p>${block.content.map((item: any) => item.text).join('')}</p>`;
                  }
                  return '';
                }).join('') 
              }} />
            ) : (
              <p>此课时暂无内容</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl flex items-center justify-center mb-6 shadow-lg overflow-hidden">
            {selectedLesson.video_file_path ? (
              <video 
                controls 
                className="w-full h-full"
                src={selectedLesson.video_file_path}
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <div className="text-center">
                <div className="p-4 rounded-full bg-white/20 backdrop-blur-md inline-block mb-4 cursor-pointer hover:bg-white/30 transition-all">
                  <Play size={48} className="text-white" />
                </div>
                <p className="text-white font-medium">暂无视频内容</p>
              </div>
            )}
          </div>
        );
      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <HelpCircle size={18} className="mr-2" /> 测验说明
              </h3>
              <p className="text-blue-700 text-sm">完成下面的题目来测试你的理解。每道题选择一个正确答案。</p>
            </div>
            
            <div className="space-y-6">
              <div className="quiz-container">
                <h4 className="font-medium text-lg mb-4">问题 1: 在数学中，5 + 3 = ?</h4>
                <div className="space-y-3">
                  {['7', '8', '9'].map((option, index) => (
                    <label key={index} className="quiz-option">
                      <input type="radio" name="q1" className="mr-3 h-4 w-4 accent-blue-500" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="quiz-container">
                <h4 className="font-medium text-lg mb-4">问题 2: 哪个形状有四个相等的边？</h4>
                <div className="space-y-3">
                  {['三角形', '圆形', '正方形'].map((option, index) => (
                    <label key={index} className="quiz-option">
                      <input type="radio" name="q2" className="mr-3 h-4 w-4 accent-blue-500" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button className="bg-blue-600 hover:bg-blue-700">
                提交答案
              </Button>
            </div>
          </div>
        );
      case 'interactive':
      case 'activity':
      case 'game':
        return (
          <div className="space-y-6">
            <div className="interactive-container">
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-700 mb-4">互动内容区域</h3>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  开始互动
                </Button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">学习目���</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>理解基本概念</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>应用所学知识解决简单问题</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-blue-500">
                        <Check size={16} />
                      </div>
                      <span>通过互动加深理解</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">说明</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    跟随指示完成互动练习。你可以随时暂停并返回。
                    如果遇到困难，可以点击右下角的帮助按钮获取提示。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return <p>未知课程类型</p>;
    }
  };
  
  const CourseSidebar = () => {
    return (
      <div className="w-full h-full bg-white overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">课程进度</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-4">
            {courseData?.modules && courseData.modules.map((module) => (
              <Card key={module.id} className="border border-gray-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
                  <CardTitle className="text-base font-medium text-gray-800">{module.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="p-0">
                  {module.lessons && module.lessons.length > 0 ? (
                    <ul className="divide-y divide-gray-100">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link
                            to={`/course/${courseData.id}/lesson/${lesson.id}`}
                            className={`flex items-center px-4 py-3 hover:bg-blue-50 transition-colors ${
                              selectedLesson && selectedLesson.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                            onClick={() => isMobile && setSidebarOpen(false)}
                          >
                            <div className="flex-shrink-0 mr-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                selectedLesson && selectedLesson.id === lesson.id ? 'border-blue-500 bg-blue-50 text-blue-500' : 'border-gray-200'
                              }`}>
                                {selectedLesson && selectedLesson.id === lesson.id && (
                                  <span className="text-xs">•</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center text-sm">
                                <ContentTypeIcon type={lesson.type} />
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      此模块暂无课时内容
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {(!courseData?.modules || courseData.modules.length === 0) && (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg text-sm">
                此课程暂无模块内容
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const MobileDrawer = () => {
    return (
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="border-b px-4 py-2">
            <DrawerTitle className="text-lg">课程大纲</DrawerTitle>
            <DrawerDescription className="text-sm">{courseData?.title}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto">
            <CourseSidebar />
          </div>
          <DrawerFooter className="pt-2 px-4 border-t">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  };
  
  const CourseNavigation = () => {
    const getAdjacentLesson = (direction: 'prev' | 'next') => {
      if (!courseData?.modules || !selectedLesson) return null;
      
      const modules = courseData.modules;
      let targetLesson = null;
      
      for (let i = 0; i < modules.length; i++) {
        const module = modules[i];
        const lessons = module.lessons || [];
        
        for (let j = 0; j < lessons.length; j++) {
          if (lessons[j].id === selectedLesson.id) {
            if (direction === 'prev') {
              if (j > 0) {
                targetLesson = lessons[j - 1];
              } else if (i > 0) {
                const prevModule = modules[i - 1];
                const prevLessons = prevModule.lessons || [];
                if (prevLessons.length > 0) {
                  targetLesson = prevLessons[prevLessons.length - 1];
                }
              }
            } else { // next
              if (j < lessons.length - 1) {
                targetLesson = lessons[j + 1];
              } else if (i < modules.length - 1) {
                const nextModule = modules[i + 1];
                const nextLessons = nextModule.lessons || [];
                if (nextLessons.length > 0) {
                  targetLesson = nextLessons[0];
                }
              }
            }
            break;
          }
        }
        if (targetLesson) break;
      }
      
      return targetLesson;
    };
    
    const prevLesson = getAdjacentLesson('prev');
    const nextLesson = getAdjacentLesson('next');
    
    return (
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "lg"} 
          className="flex items-center"
          onClick={() => prevLesson && navigate(`/course/${courseData?.id}/lesson/${prevLesson.id}`)}
          disabled={!prevLesson}
        >
          <ArrowLeft size={isMobile ? 16 : 18} className="mr-2" /> 
          {isMobile ? '上一课' : '上一课'}
        </Button>
        
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              size={isMobile ? "sm" : "default"}
              onClick={async () => {
                try {
                  if (!enrollmentId) {
                    toast.error('您尚未加入此课程');
                    return;
                  }
                  
                  toast.success('课时已完成');
                  
                } catch (error) {
                  console.error('更新进度失败:', error);
                  toast.error('标记完成失败');
                }
              }}
            >
              {isMobile ? <Check size={16} /> : '标记为已完成'} 
              {!isMobile && <Check size={18} className="ml-2" />}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="text-sm">
              <h4 className="font-medium mb-2">完成课时</h4>
              <p>标记此课时为已完成后，会更新您的学习进度，并解锁下一节课程。</p>
            </div>
          </HoverCardContent>
        </HoverCard>
        
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "lg"} 
          className="flex items-center"
          onClick={() => nextLesson && navigate(`/course/${courseData?.id}/lesson/${nextLesson.id}`)}
          disabled={!nextLesson}
        >
          {isMobile ? '下一课' : '下一课'} 
          <ArrowRight size={isMobile ? 16 : 18} className="ml-2" />
        </Button>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <Skeleton className="h-8 sm:h-12 w-3/4 mb-2 sm:mb-4" />
              <Skeleton className="h-4 sm:h-6 w-1/2 mb-4 sm:mb-8" />
              <Skeleton className="h-64 sm:h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!courseData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>课程未找到</CardTitle>
            <CardDescription>
              请返回课程列表选择有效课程
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link to="/learning">
              <Button>返回课程列表</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center">
          <div className="flex items-center flex-1">
            <Link to="/learning" className="mr-2 sm:mr-4 text-gray-500 hover:text-blue-600 transition-colors">
              <div className="flex items-center">
                <ChevronLeft size={18} />
                <span className="ml-1 text-sm font-medium hidden sm:inline">返回课程</span>
              </div>
            </Link>
            
            {isMobile && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </Button>
            )}
            
            <div className="truncate">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{courseData.title}</h1>
              <div className="flex items-center text-xs sm:text-sm text-gray-500 truncate">
                <BookOpen size={14} className="mr-1 flex-shrink-0 hidden xs:inline-block" /> 
                <span className="truncate">{courseData.short_description || ""}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {isMobile && <MobileDrawer />}
      
      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto hidden md:block flex-shrink-0">
            <CourseSidebar />
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          {selectedLesson && selectedUnit ? (
            <div className="container mx-auto px-4 py-4 sm:py-6">
              <div className="md:hidden mb-4">
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
              
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 py-4">
                  <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1">
                    <ContentTypeIcon type={selectedLesson.type} />
                    <span className="truncate">{selectedUnit.title} / {selectedLesson.title}</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">{selectedLesson.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="p-4 sm:p-6">
                  {renderLessonContent()}
                  
                  <CourseNavigation />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-6 text-center">
              <Card>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                      <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">暂无课时内容</h3>
                    <p className="text-gray-500 mb-4 text-sm sm:text-base">此课程暂未添加课时内容，请稍后再查看</p>
                    <Button
                      onClick={() => navigate('/learning')}
                    >
                      返回课程列表
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      
      <div className={`fixed bottom-6 right-6 transition-all duration-300 z-40 ${isChatOpen ? 'w-80 h-96' : 'w-auto h-auto'}`}>
        {isChatOpen ? (
          <Card className="flex flex-col h-full shadow-xl border border-gray-200 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <MessageSquare size={18} className="mr-2" />
                  <CardTitle className="text-base font-medium">课程助手</CardTitle>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-4 overflow-y-auto bg-gray-50">
              <div className="space-y-4">
                <div className="flex">
                  <div className="bg-purple-100 rounded-lg p-3 max-w-[80%]">
                    <p className="text-sm text-purple-800">
                      你好！我是你的学习助手。有什么问题我可以帮忙解答吗？
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-gray-200 p-3 bg-white">
              <div className="w-full">
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="输入你的问题..." 
                    className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button className="bg-purple-600 text-white rounded-r-lg px-3 py-2 text-sm hover:bg-purple-700 transition-colors">
                    发送
                  </button>
                </div>
                
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 transition-colors">
                    解释这个概念
                  </button>
                  <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 transition-colors">
                    我需要帮助
                  </button>
                </div>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all"
            aria-label="打开聊天助手"
          >
            <MessageSquare size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
