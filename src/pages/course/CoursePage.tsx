import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, BookOpen, Play, Check, MessageSquare, Award, Video, FileText, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  
  if (loading) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <Skeleton className="h-12 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-8" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!courseData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Card className="w-96 text-center">
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
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <Link to="/learning" className="mr-4 text-gray-500 hover:text-blue-600 transition-colors">
            <div className="flex items-center">
              <ChevronLeft size={20} />
              <span className="ml-1 font-medium text-sm hidden sm:inline">返回课程</span>
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{courseData.title}</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4 flex items-center">
                <BookOpen size={16} className="mr-1" /> 
                {courseData.short_description || ""}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto hidden md:block">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">课程进度</span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            <div className="space-y-5">
              {courseData.modules && courseData.modules.map((module) => (
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
                            >
                              <div className="flex-shrink-0 mr-3">
                                <div className="w-7 h-7 rounded-full border-2 border-gray-200" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <ContentTypeIcon type={lesson.type} />
                                  <span className="text-sm font-medium">{lesson.title}</span>
                                </div>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        此模块暂无课时内容
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {(!courseData.modules || courseData.modules.length === 0) && (
                <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
                  此课程暂无模块内容
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {selectedLesson && selectedUnit ? (
            <div className="container mx-auto px-4 py-6">
              <div className="md:hidden mb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">课程进度</span>
                    <span className="text-sm font-medium text-blue-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <BookOpen size={18} className="mr-2" /> 查看课程大纲
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>课程大纲</DrawerTitle>
                      <DrawerDescription>{courseData.title}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
                      {courseData.modules && courseData.modules.map((module) => (
                        <Accordion type="single" collapsible key={module.id} className="mb-3">
                          <AccordionItem value={module.id}>
                            <AccordionTrigger className="font-medium py-3">{module.title}</AccordionTrigger>
                            <AccordionContent>
                              {module.lessons && module.lessons.length > 0 ? (
                                <ul className="space-y-1">
                                  {module.lessons.map((lesson) => (
                                    <li key={lesson.id}>
                                      <Link
                                        to={`/course/${courseData.id}/lesson/${lesson.id}`}
                                        className="flex items-center p-2 rounded-md hover:bg-blue-50"
                                      >
                                        <div className="mr-2">
                                          <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                        </div>
                                        <div className="flex items-center text-sm">
                                          <ContentTypeIcon type={lesson.type} />
                                          <span>{lesson.title}</span>
                                        </div>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="p-2 text-gray-500">此模块暂无课时内容</div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ))}
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline">关闭</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </div>
              
              <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <ContentTypeIcon type={selectedLesson.type} />
                    <span>{selectedUnit.title} / {selectedLesson.title}</span>
                  </div>
                  <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
                </CardHeader>
                
                <CardContent className="p-6">
                  {selectedLesson.type === 'text' && (
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
                  )}
                  
                  {selectedLesson.type === 'video' && (
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
                  )}
                  
                  {selectedLesson.type === 'quiz' && (
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
                  )}
                  
                  {selectedLesson.type === 'interactive' && (
                    <div className="space-y-8">
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
                  )}
                  
                  {selectedLesson.type === 'activity' && (
                    <div className="space-y-6">
                      <Card className="border-blue-100">
                        <CardHeader className="bg-blue-50">
                          <CardTitle className="text-lg text-blue-800">活动说明</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <p className="mb-4">
                            这个活动将帮助你巩固所学知识，并发挥创造力。
                            按照以下步骤完成活动，完成后可以上传你的作品。
                          </p>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2 text-gray-800">你需要准备</h4>
                            <ul className="space-y-1 text-gray-700">
                              <li className="flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                纸和彩笔
                              </li>
                              <li className="flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                剪刀（在家长帮助下使用）
                              </li>
                              <li className="flex items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                                胶水或胶带
                              </li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2 text-gray-800">步骤</h4>
                            <ol className="space-y-2 text-gray-700">
                              <li className="flex">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                                <span>在纸上画出你最喜欢的动物</span>
                              </li>
                              <li className="flex">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                                <span>为你的动物添加颜色和细节</span>
                              </li>
                              <li className="flex">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                                <span>写下三个关于这种动物的有趣事实</span>
                              </li>
                              <li className="flex">
                                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                                <span>完成后，拍照上传</span>
                              </li>
                            </ol>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <div className="border border-dashed border-gray-300 rounded-xl p-6">
                        <h4 className="font-semibold mb-4 text-gray-800">上传你的作品</h4>
                        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-gray-500 mb-3">点击或拖放文件到这里上传</div>
                            <Button variant="outline" className="border-blue-300">
                              选择文件
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.type === 'game' && (
                    <div className="space-y-6">
                      <div className="aspect-video bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl flex items-center justify-center mb-6 shadow-lg overflow-hidden">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-indigo-200 mb-4">教育游戏</h3>
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 h-auto">
                            ��始游戏
                          </Button>
                        </div>
                      </div>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>游戏说明</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4">
                            这个有趣的游戏将帮助你练习数学技能！在游戏中，你需要解决各种数学题目来获得分数。
                            尽可能获得高分并挑战自己！
                          </p>
                          
                          <h4 className="font-semibold mb-2">游戏控制</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <div className="mr-2 mt-0.5 text-purple-500">
                                <Check size={16} />
                              </div>
                              <span>使用鼠标点击选择答案</span>
                            </li>
                            <li className="flex items-start">
                              <div className="mr-2 mt-0.5 text-purple-500">
                                <Check size={16} />
                              </div>
                              <span>计时模式：在限定时间内回答尽可能多的问题</span>
                            </li>
                            <li className="flex items-start">
                              <div className="mr-2 mt-0.5 text-purple-500">
                                <Check size={16} />
                              </div>
                              <span>挑战模式：难度会逐渐增加</span>
                            </li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="flex items-center"
                      onClick={() => {
                        const modules = courseData.modules || [];
                        let prevLesson = null;
                        let prevLessonModuleIndex = -1;
                        let prevLessonIndex = -1;
                        
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          const lessons = module.lessons || [];
                          
                          for (let j = 0; j < lessons.length; j++) {
                            if (lessons[j].id === selectedLesson.id) {
                              if (j === 0) {
                                if (i > 0) {
                                  const prevModule = modules[i - 1];
                                  const prevLessons = prevModule.lessons || [];
                                  
                                  if (prevLessons.length > 0) {
                                    prevLesson = prevLessons[prevLessons.length - 1];
                                    prevLessonModuleIndex = i - 1;
                                    prevLessonIndex = prevLessons.length - 1;
                                  }
                                }
                              } else {
                                prevLesson = lessons[j - 1];
                                prevLessonModuleIndex = i;
                                prevLessonIndex = j - 1;
                              }
                              break;
                            }
                          }
                          
                          if (prevLesson) break;
                        }
                        
                        if (prevLesson) {
                          navigate(`/course/${courseData.id}/lesson/${prevLesson.id}`);
                        }
                      }}
                    >
                      <ArrowLeft size={18} className="mr-2" /> 上一课
                    </Button>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
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
                          标记为已完成 <Check size={18} className="ml-2" />
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
                      size="lg" 
                      className="flex items-center"
                      onClick={() => {
                        const modules = courseData.modules || [];
                        let nextLesson = null;
                        let nextLessonModuleIndex = -1;
                        let nextLessonIndex = -1;
                        
                        for (let i = 0; i < modules.length; i++) {
                          const module = modules[i];
                          const lessons = module.lessons || [];
                          
                          for (let j = 0; j < lessons.length; j++) {
                            if (lessons[j].id === selectedLesson.id) {
                              if (j === lessons.length - 1) {
                                if (i < modules.length - 1) {
                                  const nextModule = modules[i + 1];
                                  const nextLessons = nextModule.lessons || [];
                                  
                                  if (nextLessons.length > 0) {
                                    nextLesson = nextLessons[0];
                                    nextLessonModuleIndex = i + 1;
                                    nextLessonIndex = 0;
                                  }
                                }
                              } else {
                                nextLesson = lessons[j + 1];
                                nextLessonModuleIndex = i;
                                nextLessonIndex = j + 1;
                              }
                              break;
                            }
                          }
                          
                          if (nextLesson) break;
                        }
                        
                        if (nextLesson) {
                          navigate(`/course/${courseData.id}/lesson/${nextLesson.id}`);
                        }
                      }}
                    >
                      下一课 <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-6 text-center">
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                      <BookOpen className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">暂无课时内容</h3>
                    <p className="text-gray-500 mb-4">此课程暂未添加课时内容，请稍后再查看</p>
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
        
        <div className={`fixed bottom-6 right-6 transition-all duration-300 z-40 ${isChatOpen ? 'w-80 h-96' : 'w-auto h-auto'}`}>
          {isChatOpen ? (
            <Card className="flex flex-col h-full shadow-xl border border-gray-200 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4">
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
                  
                  <div className="mt-2 flex justify-center">
                    <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 transition-colors mr-2">
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
    </div>
  );
};

export default CoursePage;
