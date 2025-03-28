import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, BookOpen, Play, Check, MessageSquare, Award, Video, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      return <Video size={16} className="mr-2" />;
    case 'quiz':
      return <HelpCircle size={16} className="mr-2" />;
    case 'interactive':
      return <Play size={16} className="mr-2" />;
    case 'game':
      return <Play size={16} className="mr-2" />;
    case 'activity':
      return <FileText size={16} className="mr-2" />;
    default:
      return <BookOpen size={16} className="mr-2" />;
  }
};

const CoursePage = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // 获取课程数据
  const course = courseId ? COURSES[courseId as keyof typeof COURSES] : null;
  
  if (!course) {
    return <div className="p-8 text-center">课程未找到</div>;
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
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Link to="/learning" className="mr-3 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="mr-3">适合: {course.ageRange}</span>
              <span>级别: {course.level}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* 课程内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 课程大纲侧边栏 */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">课程进度</span>
                <span className="text-sm text-gray-500">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-2" />
            </div>
            
            <div className="space-y-4">
              {course.units.map((unit) => (
                <div key={unit.id} className="border border-gray-200 rounded-lg">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-medium">{unit.title}</h3>
                  </div>
                  
                  <ul className="divide-y divide-gray-100">
                    {unit.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${course.id}/lesson/${lesson.id}`}
                          className={`flex items-center px-4 py-3 hover:bg-gray-50 ${
                            selectedLesson && selectedLesson.id === lesson.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex-shrink-0 mr-3">
                            {lesson.completed ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                <Check size={14} className="text-green-600" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <ContentTypeIcon type={lesson.type} />
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* 主内容区域 */}
        <div className="flex-1 overflow-auto">
          {selectedLesson && selectedUnit && (
            <div className="container mx-auto px-4 py-6">
              <div className="md:hidden mb-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">课程进度</span>
                    <span className="text-sm text-gray-500">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              </div>
              
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <ContentTypeIcon type={selectedLesson.type} />
                    <span>{selectedUnit.title} / {selectedLesson.title}</span>
                  </div>
                  <h2 className="text-xl font-bold">{selectedLesson.title}</h2>
                </div>
                
                <div className="p-6">
                  {/* 基于课时类型渲染不同内容 */}
                  {selectedLesson.type === 'video' && (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                      <Play size={48} className="text-white opacity-80" />
                    </div>
                  )}
                  
                  {selectedLesson.type === 'quiz' && (
                    <div className="space-y-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-medium text-blue-800 mb-2">测验说明</h3>
                        <p className="text-blue-700 text-sm">完成下面的题目来测试你的理解。每道题选择一个正确答案。</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium mb-3">问题 1: 在数学中，5 + 3 = ?</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input type="radio" id="q1a" name="q1" className="mr-2" />
                              <label htmlFor="q1a">7</label>
                            </div>
                            <div className="flex items-center">
                              <input type="radio" id="q1b" name="q1" className="mr-2" />
                              <label htmlFor="q1b">8</label>
                            </div>
                            <div className="flex items-center">
                              <input type="radio" id="q1c" name="q1" className="mr-2" />
                              <label htmlFor="q1c">9</label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium mb-3">问题 2: 哪个形状有四个相等的边？</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input type="radio" id="q2a" name="q2" className="mr-2" />
                              <label htmlFor="q2a">三角形</label>
                            </div>
                            <div className="flex items-center">
                              <input type="radio" id="q2b" name="q2" className="mr-2" />
                              <label htmlFor="q2b">圆形</label>
                            </div>
                            <div className="flex items-center">
                              <input type="radio" id="q2c" name="q2" className="mr-2" />
                              <label htmlFor="q2c">正方形</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                          提交答案
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.type === 'interactive' && (
                    <div className="space-y-6">
                      <div className="aspect-video bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center mb-6">
                        <div className="text-center">
                          <div className="text-gray-400 mb-2">互动内容区域</div>
                          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            开始互动
                          </button>
                        </div>
                      </div>
                      
                      <div className="prose max-w-none">
                        <h3>学习目标</h3>
                        <ul>
                          <li>理解基本概念</li>
                          <li>应用所学知识解决简单问题</li>
                          <li>通过互动加深理解</li>
                        </ul>
                        
                        <h3>说明</h3>
                        <p>
                          跟随指示完成互动练习。你可以随时暂停并返回。
                          如果遇到困难，可以点击右下角的帮助按钮获取提示。
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.type === 'activity' && (
                    <div className="space-y-6">
                      <div className="prose max-w-none">
                        <h3>活动说明</h3>
                        <p>
                          这个活动将帮助你巩固所学知识，并发挥创造力。
                          按照以下步骤完成活动，完成后可以上传你的作品。
                        </p>
                        
                        <h4>你需要准备</h4>
                        <ul>
                          <li>纸和彩笔</li>
                          <li>剪刀（在家长帮助下使用）</li>
                          <li>胶水或胶带</li>
                        </ul>
                        
                        <h4>步骤</h4>
                        <ol>
                          <li>在纸上画出你最喜欢的动物</li>
                          <li>为你的动物添加颜色和细节</li>
                          <li>写下三个关于这种动物的有趣事实</li>
                          <li>完成后，拍照上传</li>
                        </ol>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium mb-3">上传你的作品</h4>
                        <div className="flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg">
                          <div className="text-center">
                            <div className="text-gray-500 mb-2">点击或拖放文件到这里上传</div>
                            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                              选择文件
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedLesson.type === 'game' && (
                    <div className="space-y-6">
                      <div className="aspect-video bg-indigo-900 rounded-lg flex items-center justify-center mb-6">
                        <div className="text-center">
                          <div className="text-indigo-300 mb-2">教育游戏</div>
                          <button className="bg-indigo-500 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-indigo-600">
                            开始游戏
                          </button>
                        </div>
                      </div>
                      
                      <div className="prose max-w-none">
                        <h3>游戏说明</h3>
                        <p>
                          这个有趣的游戏将帮助你练习数学技能！在游戏中，你需要解决各种数学题目来获得分数。
                          尽可能获得高分并挑战自己！
                        </p>
                        
                        <h4>游戏控制</h4>
                        <ul>
                          <li>使用鼠标点击选择答案</li>
                          <li>计时模式：在限定时间内回答尽可能多的问题</li>
                          <li>挑战模式：难度会逐渐增加</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-8">
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                      上一课
                    </button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      标记为已完成
                    </button>
                    <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50">
                      下一课
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 聊天机器人 */}
        <div className={`fixed bottom-6 right-6 transition-all duration-300 ${isChatOpen ? 'w-80 h-96' : 'w-auto h-auto'}`}>
          {isChatOpen ? (
            <div className="flex flex-col h-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-purple-600 text-white px-4 py-3 flex justify-between items-center">
                <div className="flex items-center">
                  <MessageSquare size={18} className="mr-2" />
                  <h3 className="font-medium">课程助手</h3>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
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
              </div>
              
              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="输入你的问题..." 
                    className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <button className="bg-purple-600 text-white rounded-r-lg px-3 py-2 text-sm hover:bg-purple-700">
                    发送
                  </button>
                </div>
                
                <div className="mt-2 flex justify-center">
                  <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200 mr-2">
                    解释这个概念
                  </button>
                  <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1 text-xs hover:bg-gray-200">
                    我需要帮助
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsChatOpen(true)}
              className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700"
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