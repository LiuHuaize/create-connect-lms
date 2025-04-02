import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, BookOpen, Play, Check, MessageSquare, Award, Video, FileText, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// 模拟课程数据
const COURSES = {
  "math-adventure": {
    id: "math-adventure",
    title: "数学冒险",
    description: "通过有趣的游戏和活动学习基础数学概念",
    progress: 40,
    level: "初级",
    ageRange: "6-8岁",
    units: [
      {
        id: "unit-1",
        title: "数字与计数",
        lessons: [
          { id: "lesson-1", title: "认识数字1-10", type: "video", completed: true },
          { id: "lesson-2", title: "数字排序", type: "interactive", completed: true },
          { id: "lesson-3", title: "计数游戏", type: "game", completed: false }
        ]
      },
      {
        id: "unit-2",
        title: "形状与颜色",
        lessons: [
          { id: "lesson-4", title: "认识基本形状", type: "video", completed: false },
          { id: "lesson-5", title: "形状匹配", type: "quiz", completed: false },
          { id: "lesson-6", title: "创建形状艺术", type: "activity", completed: false }
        ]
      },
      {
        id: "unit-3",
        title: "简单加法",
        lessons: [
          { id: "lesson-7", title: "加法基础", type: "video", completed: false },
          { id: "lesson-8", title: "加法练习", type: "interactive", completed: false },
          { id: "lesson-9", title: "加法游戏", type: "game", completed: false },
          { id: "lesson-10", title: "加法测验", type: "quiz", completed: false }
        ]
      }
    ]
  },
  "science-discovery": {
    id: "science-discovery",
    title: "科学发现之旅",
    description: "探索自然世界的奇妙现象和基本科学概念",
    progress: 20,
    level: "初级",
    ageRange: "8-10岁",
    units: [
      {
        id: "unit-1",
        title: "动植物世界",
        lessons: [
          { id: "lesson-1", title: "认识常见动物", type: "video", completed: true },
          { id: "lesson-2", title: "植物的生长", type: "interactive", completed: false },
          { id: "lesson-3", title: "动物分类游戏", type: "game", completed: false }
        ]
      },
      {
        id: "unit-2",
        title: "天气与季节",
        lessons: [
          { id: "lesson-4", title: "认识四季", type: "video", completed: false },
          { id: "lesson-5", title: "天气现象", type: "interactive", completed: false },
          { id: "lesson-6", title: "季节变化", type: "quiz", completed: false }
        ]
      }
    ]
  },
  "creative-writing": {
    id: "creative-writing",
    title: "创意写作启蒙",
    description: "培养孩子的写作兴趣和表达能力",
    progress: 10,
    level: "中级",
    ageRange: "9-12岁",
    units: [
      {
        id: "unit-1",
        title: "故事构思",
        lessons: [
          { id: "lesson-1", title: "故事元素", type: "video", completed: true },
          { id: "lesson-2", title: "角色设计", type: "interactive", completed: false },
          { id: "lesson-3", title: "故事构思练习", type: "activity", completed: false }
        ]
      },
      {
        id: "unit-2",
        title: "创意表达",
        lessons: [
          { id: "lesson-4", title: "描写技巧", type: "video", completed: false },
          { id: "lesson-5", title: "对话写作", type: "interactive", completed: false },
          { id: "lesson-6", title: "小故事创作", type: "activity", completed: false }
        ]
      }
    ]
  }
};

// 内容类型图标映射
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
    default:
      return <BookOpen size={18} className="mr-2 text-gray-500" />;
  }
};

const CoursePage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // 获取课程数据
  const course = courseId ? COURSES[courseId as keyof typeof COURSES] : null;
  
  if (!course) {
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
  
  // 查找选中的课程单元和课时
  let selectedLesson = null;
  let selectedUnit = null;
  
  if (lessonId) {
    for (const unit of course.units) {
      const lesson = unit.lessons.find(l => l.id === lessonId);
      if (lesson) {
        selectedLesson = lesson;
        selectedUnit = unit;
        break;
      }
    }
  }
  
  // 如果没有特定课时选择，使用第一个未完成的课时
  if (!selectedLesson) {
    for (const unit of course.units) {
      const lesson = unit.lessons.find(l => !l.completed);
      if (lesson) {
        selectedLesson = lesson;
        selectedUnit = unit;
        break;
      }
    }
  }
  
  // 如果所有课时都已完成，使用第一个课时
  if (!selectedLesson && course.units.length > 0 && course.units[0].lessons.length > 0) {
    selectedUnit = course.units[0];
    selectedLesson = selectedUnit.lessons[0];
  }
  
  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* 课程头部 */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-6 flex items-center">
          <Link to="/learning" className="mr-4 text-gray-500 hover:text-blue-600 transition-colors">
            <div className="flex items-center">
              <ChevronLeft size={20} />
              <span className="ml-1 font-medium text-sm hidden sm:inline">返回课程</span>
            </div>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">{course.title}</h1>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4 flex items-center"><Award size={16} className="mr-1" /> 适合: {course.ageRange}</span>
              <span className="flex items-center"><BookOpen size={16} className="mr-1" /> 级别: {course.level}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* 课程内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 课程大纲侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto hidden md:block">
          <div className="p-4">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">课程进度</span>
                <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
            
            <div className="space-y-5">
              {course.units.map((unit) => (
                <Card key={unit.id} className="border border-gray-100 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 px-4">
                    <CardTitle className="text-base font-medium text-gray-800">{unit.title}</CardTitle>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    <ul className="divide-y divide-gray-100">
                      {unit.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          <Link
                            to={`/course/${course.id}/lesson/${lesson.id}`}
                            className={`flex items-center px-4 py-3 hover:bg-blue-50 transition-colors ${
                              selectedLesson && selectedLesson.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex-shrink-0 mr-3">
                              {lesson.completed ? (
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                                  <Check size={14} className="text-green-600" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full border-2 border-gray-200" />
                              )}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
        
        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto">
          {selectedLesson && selectedUnit && (
            <div className="container mx-auto px-4 py-6">
              <div className="md:hidden mb-6">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">课程进度</span>
                    <span className="text-sm font-medium text-blue-600">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
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
                      <DrawerDescription>{course.title}</DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
                      {course.units.map((unit) => (
                        <Accordion type="single" collapsible key={unit.id} className="mb-3">
                          <AccordionItem value={unit.id}>
                            <AccordionTrigger className="font-medium py-3">{unit.title}</AccordionTrigger>
                            <AccordionContent>
                              <ul className="space-y-1">
                                {unit.lessons.map((lesson) => (
                                  <li key={lesson.id}>
                                    <Link
                                      to={`/course/${course.id}/lesson/${lesson.id}`}
                                      className="flex items-center p-2 rounded-md hover:bg-blue-50"
                                    >
                                      <div className="mr-2">
                                        {lesson.completed ? (
                                          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <Check size={12} className="text-green-600" />
                                          </div>
                                        ) : (
                                          <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                        )}
                                      </div>
                                      <div className="flex items-center text-sm">
                                        <ContentTypeIcon type={lesson.type} />
                                        <span>{lesson.title}</span>
                                      </div>
                                    </Link>
                                  </li>
                                ))}
                              </ul>
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
                  {/* 基于课时类型渲染不同内容 */}
                  {selectedLesson.type === 'video' && (
                    <div className="aspect-video bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl flex items-center justify-center mb-6 shadow-lg overflow-hidden">
                      <div className="text-center">
                        <div className="p-4 rounded-full bg-white/20 backdrop-blur-md inline-block mb-4 cursor-pointer hover:bg-white/30 transition-all">
                          <Play size={48} className="text-white" />
                        </div>
                        <p className="text-white font-medium">点击播放视频</p>
                      </div>
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
                    <Button variant="outline" size="lg" className="flex items-center">
                      <ArrowLeft size={18} className="mr-2" /> 上一课
                    </Button>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button className="bg-green-600 hover:bg-green-700">
                          标记为已完成 <Check size={18} className="ml-2" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="text-sm">
                          <h4 className="font-medium mb-2">完成课程</h4>
                          <p>标记此课程为已完成后，会更新您的学习进度，并解锁下一节课程。</p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <Button variant="outline" size="lg" className="flex items-center">
                      下一课 <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* 聊天机器人 */}
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
                  
                  <div className="flex justify-end">
                    <div className="bg-blue-100 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm text-blue-800">
                        这节课的主要内容是什么？
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-purple-100 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm text-purple-800">
                        这节课我们学习的是基础数学中的数字与计数概念。你将学习如何识别1到10的数字，并练习数字排序和基础计数技能。
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
