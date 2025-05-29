import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Play, Check, ChevronLeft, ChevronRight, Loader2, CheckCircle, X, InfoIcon, AlertTriangle, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lesson, CourseModule, LessonType, QuizLessonContent as QuizLessonContentType, AssignmentLessonContent as AssignmentLessonContentType, CardCreatorLessonContent as CardCreatorLessonContentType, DragSortContent, ResourceLessonContent, FrameLessonContent as FrameLessonContentType, HotspotLessonContent as HotspotLessonContentType } from '@/types/course';
// 临时注释掉不存在的导入
// import { CardCreatorTask } from '@/types/card-creator';
import LessonNavigation from './LessonNavigation';
import { NavigateFunction } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// 临时注释掉不存在的导入
// import { CardCreatorStudent } from '@/components/course/card-creator/CardCreatorStudent';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

// 创建一个加载指示器组件
const LessonLoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 text-macaron-pink animate-spin" />
      <p className="text-sm text-macaron-brown">正在加载课程内容...</p>
    </div>
  </div>
);

// 使用React.lazy进行懒加载
const TextLessonContent = React.lazy(() => import('@/components/course/lessons/TextLessonContent'));
const VideoLessonContent = React.lazy(() => import('@/components/course/lessons/VideoLessonContent'));
const QuizLessonContent = React.lazy(() => import('@/components/course/lessons/quiz/QuizLessonContent'));
const ResourceLessonView = React.lazy(() => import('@/components/course/lessons/ResourceLessonView'));
const DragSortExercise = React.lazy(() => import('@/components/course/components/drag-sort/DragSortExercise'));
const HotspotLessonView = React.lazy(() => import('@/components/course/lessons/hotspot/HotspotLessonView'));
// 修正 AssignmentLessonContent 的导入方式
const AssignmentLessonContent = React.lazy(() => import('@/components/course/AssignmentLessonContent').then(module => ({ default: module.AssignmentLessonContent })));

import { containsMarkdown } from '@/utils/markdownUtils';
import LessonCompletionButton from '@/components/course/lessons/LessonCompletionButton';
import { useCourseData } from '../hooks/useCourseData';

interface LessonContentProps {
  selectedLesson: Lesson | null;
  selectedUnit: CourseModule | null;
  courseData: any;
  enrollmentId: string | null;
  navigate: NavigateFunction;
}

// 框架内容视图组件
interface FrameLessonViewProps {
  content: FrameLessonContentType;
  courseId: string;
  enrollmentId: string | null;
  navigate: NavigateFunction;
  nextLesson?: Lesson | null;
  prevLesson?: Lesson | null;
  frameLessonId: string;
}

const FrameLessonView: React.FC<FrameLessonViewProps> = ({
  content,
  courseId,
  enrollmentId,
  navigate,
  nextLesson,
  prevLesson,
  frameLessonId,
}) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [renderedLesson, setRenderedLesson] = useState<Lesson | null>(null);
  const { refreshCourseData } = useCourseData(courseId);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [lessonCompletionStatus, setLessonCompletionStatus] = useState<{[key: string]: boolean}>({});
  
  // 测验相关状态
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{score: number, totalQuestions: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [attemptCounts, setAttemptCounts] = useState<{[key: string]: number}>({});
  const [showHints, setShowHints] = useState<{[key: string]: boolean}>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<{[key: string]: boolean}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<{[key: string]: string}>({});
  
  // 获取当前用户ID
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // 初始化时设置第一个子课时
  useEffect(() => {
    if (content.lessons && content.lessons.length > 0) {
      setRenderedLesson(content.lessons[0]);
      // 确保初始化时currentLessonIndex为0
      setCurrentLessonIndex(0);
    }
  }, [content]);
  
  // 当currentLessonIndex变化时，更新显示的课时
  useEffect(() => {
    if (content.lessons && content.lessons.length > 0) {
      // 防御性检查：确保currentLessonIndex不超出范围
      const safeIndex = Math.min(currentLessonIndex, content.lessons.length - 1);
      if (safeIndex !== currentLessonIndex) {
        setCurrentLessonIndex(safeIndex);
      }
      setRenderedLesson(content.lessons[safeIndex]);
    }
  }, [currentLessonIndex, content.lessons]);
  
  // 获取框架内子课时的完成状态
  useEffect(() => {
    if (courseId && content.lessons && content.lessons.length > 0) {
      courseService.getLessonCompletionStatus(courseId)
        .then(status => {
          setLessonCompletionStatus(status);
        })
        .catch(error => {
          console.error('获取子课时完成状态失败:', error);
        });
    }
  }, [courseId, content.lessons]);
  
  // 导航到下一个框架内课时
  const goToNextFramePage = () => {
    // 确保有下一页才能导航
    if (content.lessons && currentLessonIndex < content.lessons.length - 1) {
      setCurrentLessonIndex(prevIndex => prevIndex + 1);
    }
  };

  // 导航到上一个框架内课时或上一课
  const goToPreviousLessonOrFramePage = () => {
    if (currentLessonIndex > 0) {
      // 如果不是第一页，去上一页
      setCurrentLessonIndex(prevIndex => prevIndex - 1);
    } else if (prevLesson) {
      // 如果是第一页且有上一课，跳转到上一课
      navigate(`/course/${courseId}/lesson/${prevLesson.id}`);
    }
  };
  
  if (!renderedLesson) {
    return <div>此框架中没有课时内容</div>;
  }
  
  // 确保isLastPageOfFrame逻辑正确，即使在边界情况
  const validLessonsLength = content.lessons?.length || 0;
  const safeCurrentIndex = Math.min(currentLessonIndex, Math.max(0, validLessonsLength - 1));
  const isLastPageOfFrame = safeCurrentIndex >= validLessonsLength - 1;

  // 处理用户选择答案
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
    
    setSelectedAnswer(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // 检查单个问题答案
  const handleCheckSingleAnswer = (questionId: string, correctOptionId: string) => {
    const userAnswer = selectedAnswer[questionId];
    
    if (userAnswer !== correctOptionId) {
      const currentAttempts = attemptCounts[questionId] || 0;
      const newAttempts = currentAttempts + 1;
      
      setAttemptCounts(prev => ({
        ...prev,
        [questionId]: newAttempts
      }));
      
      if (newAttempts === 1) {
        setShowHints(prev => ({
          ...prev,
          [questionId]: true
        }));
      } else {
        setShowHints(prev => ({
          ...prev,
          [questionId]: false
        }));
        setShowCorrectAnswers(prev => ({
          ...prev,
          [questionId]: true
        }));
      }
      return false;
    } else {
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: userAnswer
      }));
      
      setShowCorrectAnswers(prev => ({
        ...prev,
        [questionId]: true
      }));
      return true;
    }
  };
  
  // 处理测验提交
  const handleQuizSubmit = async () => {
    if (!renderedLesson || renderedLesson.type !== 'quiz') return;
    
    const quizContent = renderedLesson.content as any;
    if (!quizContent?.questions) return;
    
    setIsLoading(true);
    
    try {
      let correctAnswers = 0;
      const totalQuestions = quizContent.questions.length;
      
      const userAnswersData = { ...userAnswers };
      const correctAnswersData = {};
      
      quizContent.questions.forEach((question: any) => {
        correctAnswersData[question.id] = question.correctOption;
        if (userAnswers[question.id] === question.correctOption) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      setQuizResult({score, totalQuestions});
      setQuizSubmitted(true);
      
      // 框架内的子课时完成逻辑可以后续处理
      // 这里只关注测验状态的更新
    } catch (error) {
      console.error('提交测验结果失败:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      {/* 框架描述信息 */}
      {currentLessonIndex === 0 && content.description && (
        <div className="mb-6 p-4 bg-ghibli-cream/40 rounded-lg border border-ghibli-sand/30">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-ghibli-purple mt-1" />
            <div>
              <div className="text-base text-ghibli-brown">
                <MarkdownRenderer>{content.description || ''}</MarkdownRenderer>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 当前课时内容 */}
      <div className="mb-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="text-xs text-ghibli-brown mb-1">
              {content.lessons && content.lessons.length > 0 ? (
                <>第 {Math.min(currentLessonIndex + 1, content.lessons.length)} 课时，共 {content.lessons.length} 课时</>
              ) : (
                <>课时信息加载中...</>
              )}
            </div>
            <CardTitle className="text-xl text-ghibli-deepTeal">
              {renderedLesson.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 渲染子课时内容 */}
            {(() => {
              const lesson = renderedLesson;
              switch (lesson.type) {
                case 'text':
                  return <TextLessonContent key={lesson.id} content={lesson.content as any} />;
                case 'video':
                  return <VideoLessonContent 
                    key={lesson.id}
                    content={lesson.content as any} 
                    videoFilePath={lesson.video_file_path} 
                  />;
                case 'quiz':
                  return <QuizLessonContent 
                    key={lesson.id}
                    lessonId={lesson.id}
                    courseId={courseId}
                    enrollmentId={enrollmentId}
                    content={lesson.content}
                    userAnswers={userAnswers} 
                    quizSubmitted={quizSubmitted}
                    quizResult={quizResult}
                    isLoading={isLoading}
                    attemptCounts={attemptCounts}
                    showHints={showHints}
                    showCorrectAnswers={showCorrectAnswers}
                    selectedAnswer={selectedAnswer}
                    onAnswerSelect={handleAnswerSelect}
                    onCheckSingleAnswer={handleCheckSingleAnswer}
                    onQuizSubmit={handleQuizSubmit}
                    onUnmarkComplete={async () => Promise.resolve()}
                    isCompletionLoading={isCompletionLoading}
                    navigate={navigate}
                    refreshCourseData={refreshCourseData}
                  />;
                case 'resource':
                  return <ResourceLessonView 
                    key={lesson.id}
                    lesson={lesson}
                    onComplete={() => {
                      if (refreshCourseData) {
                        refreshCourseData();
                        // 更新本地状态，实时反映完成状态
                        setLessonCompletionStatus(prev => ({
                          ...prev,
                          [lesson.id]: true
                        }));
                      }
                    }}
                    isCompleted={lessonCompletionStatus[lesson.id] || false}
                    courseId={courseId}
                    enrollmentId={enrollmentId}
                  />;
                case 'assignment':
                  return <AssignmentLessonContent
                    key={lesson.id}
                    lessonId={frameLessonId}
                    content={lesson.content as AssignmentLessonContentType}
                    userId={currentUserId}
                    onComplete={() => {
                      if (refreshCourseData) {
                        refreshCourseData();
                        // 更新本地状态，实时反映完成状态
                        setLessonCompletionStatus(prev => ({
                          ...prev,
                          [lesson.id]: true
                        }));
                      }
                    }}
                    isCompleted={lessonCompletionStatus[lesson.id] || false}
                  />;
                case 'drag_sort':
                  if (lesson.content) {
                    return <DragSortExercise 
                      lesson={lesson}
                      onComplete={(isCorrect, mappings) => {
                        if (refreshCourseData) {
                          refreshCourseData();
                          // 更新本地状态，实时反映完成状态
                          setLessonCompletionStatus(prev => ({
                            ...prev,
                            [lesson.id]: true
                          }));
                        }
                      }}
                    />;
                  }
                  return null;
                case 'hotspot':
                  return <HotspotLessonView
                    key={lesson.id}
                    lesson={lesson}
                    enrollmentId={enrollmentId || undefined}
                    isPreview={false}
                  />;
                // 可以根据需要添加其他类型
                default:
                  return <div key={lesson.id}>此类型的内容暂不支持在框架内显示</div>;
              }
            })()}
          </CardContent>
        </Card>
      </div>
      
      {/* 框架内导航按钮 */}
      <div className="grid grid-cols-3 items-center mt-6">
        {/* 左侧按钮 */}
        <div className="justify-self-start">
          <Button
            variant="outline"
            className="flex items-center border-ghibli-teal/30 text-ghibli-brown hover:bg-ghibli-cream/30 transition-all"
            onClick={goToPreviousLessonOrFramePage}
            disabled={currentLessonIndex === 0 && !prevLesson}
          >
            <ChevronLeft className="mr-2 h-5 w-5" /> 上一页
          </Button>
        </div>
        
        {/* 中间完成按钮 */}
        <div className="justify-self-center">
          {isLastPageOfFrame && (
            <LessonCompletionButton
              lessonId={frameLessonId}
              courseId={courseId}
              enrollmentId={enrollmentId}
              refreshCourseData={refreshCourseData}
              className="px-6 py-2.5 rounded-xl"
            />
          )}
        </div>
        
        {/* 右侧按钮 */}
        <div className="justify-self-end">
          {/* 只有当确实有下一页时才显示下一页按钮 */}
          {!isLastPageOfFrame && content.lessons && currentLessonIndex < content.lessons.length - 1 && (
            <Button
              variant="outline"
              className="flex items-center border-ghibli-teal/30 text-ghibli-brown hover:bg-ghibli-cream/30 transition-all"
              onClick={goToNextFramePage}
            >
              下一页 <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
          {isLastPageOfFrame && nextLesson && (
            <Button
              variant="outline"
              className="flex items-center border-ghibli-teal/30 text-ghibli-brown hover:bg-ghibli-cream/30 transition-all"
              onClick={() => navigate(`/course/${courseId}/lesson/${nextLesson.id}`)}
            >
              下一课 <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

const LessonContent: React.FC<LessonContentProps> = ({
  selectedLesson,
  selectedUnit,
  courseData,
  enrollmentId,
  navigate
}) => {
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{score: number, totalQuestions: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);
  const [showCardCreator, setShowCardCreator] = useState(false);
  const [lessonIsCompleted, setLessonIsCompleted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // 添加新状态：存储完整加载的课时内容
  const [loadedLessonContent, setLoadedLessonContent] = useState<Record<string, any>>({});
  const [isContentLoading, setIsContentLoading] = useState(false);
  
  // 添加ref，用于获取组件的根元素
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 获取刷新课程数据的函数
  const { refreshCourseData } = useCourseData(courseData?.id);
  
  // 新增状态来跟踪错误尝试次数和是否显示提示
  const [attemptCounts, setAttemptCounts] = useState<{[key: string]: number}>({});
  const [showHints, setShowHints] = useState<{[key: string]: boolean}>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<{[key: string]: boolean}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<{[key: string]: string}>({});
  
  // 按需加载课时内容
  useEffect(() => {
    const loadLessonContent = async () => {
      if (!selectedLesson) return;
      
      // 检查是否已经加载过内容
      if (loadedLessonContent[selectedLesson.id]) {
        return;
      }
      
      // 检查课时内容是否为空对象
      const isContentEmpty = !selectedLesson.content || 
        (typeof selectedLesson.content === 'object' && Object.keys(selectedLesson.content).length === 0);
      
      if (isContentEmpty) {
        setIsContentLoading(true);
        try {
          console.log(`加载课时内容: ${selectedLesson.id}`);
          const content = await courseService.getLessonContent(selectedLesson.id);
          
          // 更新课时内容
          selectedLesson.content = content;
          
          // 缓存已加载的内容
          setLoadedLessonContent(prev => ({
            ...prev,
            [selectedLesson.id]: content
          }));
        } catch (error) {
          console.error('加载课时内容失败:', error);
          toast.error('加载课时内容失败，请重试');
        } finally {
          setIsContentLoading(false);
        }
      }
    };
    
    loadLessonContent();
  }, [selectedLesson?.id]);
  
  // 获取课时的完成状态
  useEffect(() => {
    if (courseData?.id && selectedLesson?.id) {
      courseService.getLessonCompletionStatus(courseData.id)
        .then(status => {
          setLessonIsCompleted(!!status[selectedLesson.id]);
        })
        .catch(error => {
          console.error('获取课时完成状态失败:', error);
        });
    }
  }, [courseData?.id, selectedLesson?.id]);
  
  // 获取当前用户ID
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    getUserId();
  }, []);
  
  // 在组件挂载和课程ID/课时ID变化时，加载测验状态
  useEffect(() => {
    // 只有在课时是测验类型时才加载
    if (selectedLesson?.type === 'quiz' && courseData?.id && enrollmentId) {
      loadQuizState();
    }
  }, [selectedLesson?.id, courseData?.id, enrollmentId]);
  
  // 从数据库加载测验状态
  const loadQuizState = async () => {
    if (!selectedLesson || !courseData?.id) return;
    
    try {
      // 1. 检查用户是否已完成该课时
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;
      
      const { data: completionData, error: completionError } = await supabase
        .from('lesson_completions')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('lesson_id', selectedLesson.id)
        .eq('course_id', courseData.id)
        .maybeSingle();
        
      if (completionError) {
        console.error('获取课时完成记录失败:', completionError);
        return;
      }
      
      // 如果已完成，恢复测验状态
      if (completionData) {
        setQuizSubmitted(true);
        
        // 使用类型断言确保可以访问data中的属性
        const quizData = completionData.data as Record<string, any>;
        
        setQuizResult({
          score: completionData.score || 0,
          totalQuestions: quizData?.totalQuestions || 0
        });
        
        // 恢复用户答案
        if (quizData?.userAnswers) {
          const userAnswersData = quizData.userAnswers as Record<string, string>;
          setUserAnswers(userAnswersData);
          
          // 同时设置selectedAnswer，以便显示用户的错误答案
          setSelectedAnswer(userAnswersData);
          
          // 为所有问题启用显示正确答案
          const correctAnswersVisibility = {};
          
          // 假设selectedLesson.content包含问题列表
          const questions = (selectedLesson.content as any)?.questions || [];
          questions.forEach((question: any) => {
            if (question.id) {
              correctAnswersVisibility[question.id] = true;
            }
          });
          
          setShowCorrectAnswers(correctAnswersVisibility);
        }
      }
    } catch (error) {
      console.error('加载测验状态失败:', error);
    }
  };
  
  // 处理用户选择答案
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
    
    // 记录用户选择的答案，但还没有提交
    setSelectedAnswer(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };
  
  // 检查单个问题答案并显示提示
  const checkAnswer = (questionId: string, correctOptionId: string) => {
    const userAnswer = selectedAnswer[questionId];
    
    if (userAnswer !== correctOptionId) {
      // 更新尝试次数
      const currentAttempts = attemptCounts[questionId] || 0;
      const newAttempts = currentAttempts + 1;
      
      setAttemptCounts(prev => ({
        ...prev,
        [questionId]: newAttempts
      }));
      
      // 根据尝试次数决定是显示提示还是正确答案
      if (newAttempts === 1) {
        // 第一次错误：显示提示
        setShowHints(prev => ({
          ...prev,
          [questionId]: true
        }));
        return false;
      } else {
        // 第二次错误：直接显示正确答案，不再显示提示
        setShowHints(prev => ({
          ...prev,
          [questionId]: false // 隐藏提示
        }));
        setShowCorrectAnswers(prev => ({
          ...prev,
          [questionId]: true
        }));
        return false;
      }
    } else {
      // 答案正确，直接标记为正确
      setUserAnswers(prev => ({
        ...prev,
        [questionId]: userAnswer // 确保用户答案被记录
      }));
      
      // 添加这一部分来显示正确答案的反馈
      setShowCorrectAnswers(prev => ({
        ...prev,
        [questionId]: true
      }));
      return true;
    }
  };
  
  // 处理测验提交
  const handleQuizSubmit = async () => {
    if (!selectedLesson || selectedLesson.type !== 'quiz') return;
    
    const quizContent = selectedLesson.content as any;
    if (!quizContent?.questions) return;
    
    setIsLoading(true);
    
    try {
      let correctAnswers = 0;
      const totalQuestions = quizContent.questions.length;
      
      // 收集用户答案和正确答案，用于保存到数据库
      const userAnswersData = { ...userAnswers };
      const correctAnswersData = {};
      
      quizContent.questions.forEach((question: any) => {
        correctAnswersData[question.id] = question.correctOption;
        if (userAnswers[question.id] === question.correctOption) {
          correctAnswers++;
        }
      });
      
      const score = Math.round((correctAnswers / totalQuestions) * 100);
      setQuizResult({score, totalQuestions});
      setQuizSubmitted(true);
      
      // 如果有注册ID，调用API来保存测验结果
      if (enrollmentId && selectedLesson.id && courseData?.id) {
        // 创建数据对象，用于保存到lesson_completions表
        const quizData = {
          userAnswers: userAnswersData,
          correctAnswers: correctAnswersData,
          score,
          totalQuestions,
          submittedAt: new Date().toISOString()
        };
        
        // 调用API来记录测验结果和更新课程进度
        await courseService.markLessonComplete(
          selectedLesson.id, 
          courseData.id, 
          enrollmentId,
          score,
          quizData
        );
        
        // 刷新课程数据以更新进度
        if (refreshCourseData) {
          refreshCourseData();
        }
        
        console.log('测验完成并标记为已完成');
      }
    } catch (error) {
      console.error('提交测验结果失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理单个问题答案的检查
  const handleCheckSingleAnswer = (questionId: string, correctOptionId: string) => {
    checkAnswer(questionId, correctOptionId);
  };

  // 添加新的useEffect，监听selectedLesson变化，当变化时滚动到顶部
  useEffect(() => {
    if (selectedLesson) {
      // 使用setTimeout确保在DOM更新后执行滚动操作
      setTimeout(() => {
        // 滚动方法1：尝试滚动最近的可滚动父容器
        const scrollToTop = () => {
          // 查找方法1：通过ref找到组件的DOM元素，然后找到其可滚动的父容器
          if (contentRef.current) {
            let parent = contentRef.current.parentElement;
            while (parent) {
              const style = window.getComputedStyle(parent);
              if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                parent.scrollTop = 0;
                return true;
              }
              parent = parent.parentElement;
            }
          }
          
          // 查找方法2：使用选择器直接找到可滚动的课程内容容器
          const contentContainer = document.querySelector('.flex-1.overflow-y-auto.scrollbar-thin');
          if (contentContainer instanceof HTMLElement) {
            contentContainer.scrollTop = 0;
            return true;
          }
          
          // 查找方法3：尝试查找带有特定类组合的元素
          const scrollElements = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]');
          let scrolled = false;
          scrollElements.forEach(element => {
            if (element instanceof HTMLElement) {
              element.scrollTop = 0;
              scrolled = true;
            }
          });
          if (scrolled) return true;
          
          // 备选方案：如果上述方法都失败，滚动整个窗口
          window.scrollTo(0, 0);
          return true;
        };
        
        // 执行滚动
        scrollToTop();
      }, 100); // 短暂延迟确保DOM已更新
    }
  }, [selectedLesson]); // 只有在selectedLesson变化时触发

  const renderLessonContent = () => {
    if (!selectedLesson) {
      return (
        <Card className="p-5 bg-white rounded-xl shadow-sm text-center">
          <CardContent className="py-10">
            <p>请从侧边栏选择一个课时开始学习</p>
          </CardContent>
        </Card>
      );
    }

    // 如果内容正在加载，显示加载状态
    if (isContentLoading) {
      return <LessonLoadingSpinner />;
    }

    // 找到前一个和后一个课时
    const findNeighborLessons = () => {
      if (!courseData?.modules || !selectedLesson) return { prevLesson: null, nextLesson: null };
      
      // 获取所有模块和课时信息
      const modules = [...courseData.modules];
      
      // 按模块序号排序
      modules.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      // 创建有序的课时列表
      let allLessons: { lesson: Lesson, moduleIndex: number }[] = [];
      
      modules.forEach((module, moduleIndex) => {
        if (!module.lessons || module.lessons.length === 0) return;
        
        // 按课时序号排序课时
        const sortedLessons = [...module.lessons].sort((a, b) => a.order_index - b.order_index);
        
        // 添加到全局列表
        sortedLessons.forEach(lesson => {
          // 直接添加所有顶层课时
          allLessons.push({
            lesson, 
            moduleIndex
          });
        });
      });
      
      // 查找当前课时的索引
      const currentIndex = allLessons.findIndex(item => item.lesson.id === selectedLesson.id);
      if (currentIndex === -1) return { prevLesson: null, nextLesson: null };
      
      // 获取前一个和后一个课时
      const prevItem = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
      const nextItem = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
      
      return { 
        prevLesson: prevItem ? prevItem.lesson : null, 
        nextLesson: nextItem ? nextItem.lesson : null 
      };
    };
    
    const { prevLesson, nextLesson } = findNeighborLessons();

    // 使用Suspense包装不同类型的课时内容
    return (
      <Suspense fallback={<LessonLoadingSpinner />}>
        {(() => {
          // 根据课时类型渲染不同内容
          switch (selectedLesson.type) {
            case 'frame':
              return (
                <FrameLessonView
                  content={selectedLesson.content as FrameLessonContentType}
                  courseId={courseData?.id || ''}
                  enrollmentId={enrollmentId}
                  navigate={navigate}
                  nextLesson={nextLesson}
                  prevLesson={prevLesson}
                  frameLessonId={selectedLesson.id}
                />
              );
            
            case 'text':
              return (
                <TextLessonContent 
                  key={selectedLesson.id}
                  content={selectedLesson.content as any} 
                />
              );
            
            case 'video':
              return (
                <VideoLessonContent 
                  key={selectedLesson.id}
                  content={selectedLesson.content as any} 
                  videoFilePath={selectedLesson.video_file_path} 
                />
              );
            
            case 'quiz':
              return (
                <QuizLessonContent 
                  key={selectedLesson.id}
                  lessonId={selectedLesson.id}
                  courseId={courseData?.id || ''}
                  enrollmentId={enrollmentId}
                  content={selectedLesson.content}
                  userAnswers={userAnswers} 
                  quizSubmitted={quizSubmitted}
                  quizResult={quizResult}
                  isLoading={isLoading}
                  attemptCounts={attemptCounts}
                  showHints={showHints}
                  showCorrectAnswers={showCorrectAnswers}
                  selectedAnswer={selectedAnswer}
                  onAnswerSelect={handleAnswerSelect}
                  onCheckSingleAnswer={handleCheckSingleAnswer}
                  onQuizSubmit={handleQuizSubmit}
                  onUnmarkComplete={async () => {
                    // 空的异步函数，返回Promise
                    return Promise.resolve();
                  }}
                  isCompletionLoading={isCompletionLoading}
                  navigate={navigate}
                  refreshCourseData={refreshCourseData}
                />
              );
            
            case 'resource':
              return (
                <ResourceLessonView 
                  key={selectedLesson.id}
                  lesson={selectedLesson}
                  onComplete={() => {
                    // 不再需要在这里标记完成，由统一的完成按钮处理
                  }}
                  isCompleted={lessonIsCompleted}
                  courseId={courseData?.id}
                  enrollmentId={enrollmentId}
                />
              );
            
            case 'assignment':
              return (
                <AssignmentLessonContent
                  key={selectedLesson.id}
                  lessonId={selectedLesson.id}
                  content={selectedLesson.content as AssignmentLessonContentType}
                  userId={currentUserId}
                  onComplete={() => {
                    // 刷新课程数据以更新进度
                    if (refreshCourseData) {
                      refreshCourseData();
                    }
                  }}
                  isCompleted={lessonIsCompleted}
                />
              );
            
            case 'drag_sort':
              if (selectedLesson.content) {
                const dragSortContent = selectedLesson.content as DragSortContent;
                return (
                  <DragSortExercise 
                    lesson={selectedLesson}
                    onComplete={(isCorrect, mappings) => {
                      console.log('拖拽练习完成回调被触发', { isCorrect, mappingsCount: mappings.length });
                    }}
                  />
                );
              }
              return null;
              
            case 'hotspot':
              return (
                <HotspotLessonView
                  key={selectedLesson.id}
                  lesson={selectedLesson}
                  enrollmentId={enrollmentId || undefined}
                  isPreview={false}
                />
              );
              
            case 'card_creator':
              // 卡片创建功能已被隐藏
              return (
                <Card className="p-5 bg-white rounded-xl shadow-sm overflow-hidden">
                  <CardContent>
                    <div className="py-10 text-center">
                      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4 mx-auto" />
                      <h3 className="text-xl font-bold mb-2">此功能已被禁用</h3>
                      <p className="text-gray-600 mb-4">卡片创建功能当前不可用。</p>
                    </div>
                  </CardContent>
                </Card>
              );
              
            default:
              return (
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedLesson.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>此类型的内容暂不支持显示</p>
                  </CardContent>
                </Card>
              );
          }
        })()}
      </Suspense>
    );
  };

  return (
    <div className="flex-1 relative bg-white rounded-xl shadow-sm overflow-hidden">
      {selectedLesson && selectedUnit ? (
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-ghibli-cream to-ghibli-lightTeal/20 border-b border-ghibli-sand py-4">
              <div className="flex items-center text-xs sm:text-sm text-ghibli-brown mb-1 pr-24">
                <span className="truncate">{selectedUnit.title} / {selectedLesson.title}</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl text-ghibli-deepTeal pr-24 max-w-[80%]">{selectedLesson.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="p-4 sm:p-6">
              {renderLessonContent()}
              
              {/* 在非框架课时模式下才显示课程级别导航 */}
              {selectedLesson.type !== 'frame' && (
                <LessonNavigation 
                  courseData={courseData}
                  selectedLesson={selectedLesson}
                  enrollmentId={enrollmentId}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-6 text-center">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col items-center justify-center py-6">
                <div className="bg-ghibli-lightTeal/30 p-4 rounded-full mb-4">
                  <Check className="h-8 w-8 sm:h-12 sm:w-12 text-ghibli-deepTeal" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-ghibli-deepTeal">暂无课时内容</h3>
                <p className="text-ghibli-brown mb-4 text-sm sm:text-base">此课程暂未添加课时内容，请稍后再查看</p>
                <Button
                  onClick={() => navigate('/learning')}
                  className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white"
                >
                  返回课程列表
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LessonContent;
