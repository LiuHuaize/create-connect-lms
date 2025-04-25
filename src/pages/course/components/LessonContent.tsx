import React, { useState, useEffect } from 'react';
import { Play, Check, ChevronLeft, ChevronRight, Loader2, CheckCircle, X, InfoIcon, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lesson, CourseModule, LessonType, QuizLessonContent as QuizLessonContentType, AssignmentLessonContent as AssignmentLessonContentType, CardCreatorLessonContent as CardCreatorLessonContentType, DragSortContent } from '@/types/course';
import { CardCreatorTask } from '@/types/card-creator';
import LessonNavigation from './LessonNavigation';
import { NavigateFunction } from 'react-router-dom';
import { courseService } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CardCreatorStudent } from '@/components/course/card-creator/CardCreatorStudent';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import TextLessonContent from '@/components/course/lessons/TextLessonContent';
import VideoLessonContent from '@/components/course/lessons/VideoLessonContent';
import QuizLessonContent from '@/components/course/lessons/quiz/QuizLessonContent';
import DragSortExercise from '@/components/course/components/drag-sort/DragSortExercise';
import { containsMarkdown } from '@/utils/markdownUtils';

interface LessonContentProps {
  selectedLesson: Lesson | null;
  selectedUnit: CourseModule | null;
  courseData: any;
  enrollmentId: string | null;
  navigate: NavigateFunction;
}

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
  const [showCardCreator, setShowCardCreator] = useState(true);
  
  // 新增状态来跟踪错误尝试次数和是否显示提示
  const [attemptCounts, setAttemptCounts] = useState<{[key: string]: number}>({});
  const [showHints, setShowHints] = useState<{[key: string]: boolean}>({});
  const [showCorrectAnswers, setShowCorrectAnswers] = useState<{[key: string]: boolean}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<{[key: string]: string}>({});
  
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
          setUserAnswers(quizData.userAnswers as Record<string, string>);
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

  // 取消完成标记
  const handleUnmarkComplete = async () => {
    if (!selectedLesson?.id) return;
    
    setIsCompletionLoading(true);
    try {
      await courseService.unmarkLessonComplete(selectedLesson.id);
      setQuizSubmitted(false);
      setQuizResult(null);
      setUserAnswers({});
      toast.success('已取消完成标记');
    } catch (error) {
      console.error('取消标记失败:', error);
      toast.error('取消标记失败');
    } finally {
      setIsCompletionLoading(false);
    }
  };

  const renderLessonContent = () => {
    if (!selectedLesson) return null;
    
    switch (selectedLesson.type) {
      case 'text':
        return <TextLessonContent content={selectedLesson.content as any} />;
      
      case 'video':
        return (
          <VideoLessonContent 
            content={selectedLesson.content as any} 
            videoFilePath={selectedLesson.video_file_path} 
          />
        );
      
      case 'quiz':
        return (
          <QuizLessonContent
            lessonId={selectedLesson.id}
            courseId={courseData?.id || ''}
            enrollmentId={enrollmentId}
            content={selectedLesson.content}
            quizSubmitted={quizSubmitted}
            quizResult={quizResult}
            userAnswers={userAnswers}
            navigate={navigate}
            onQuizSubmit={handleQuizSubmit}
            onAnswerSelect={handleAnswerSelect}
            onCheckSingleAnswer={handleCheckSingleAnswer}
            onUnmarkComplete={handleUnmarkComplete}
            isLoading={isLoading}
            isCompletionLoading={isCompletionLoading}
            attemptCounts={attemptCounts}
            showHints={showHints}
            showCorrectAnswers={showCorrectAnswers}
            selectedAnswer={selectedAnswer}
          />
        );

      case 'assignment':
        const assignmentContent = selectedLesson.content as AssignmentLessonContentType;
        return (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center">
                <Check size={18} className="mr-2" /> 作业说明
              </h3>
              <p className="text-amber-700 text-sm">请按照要求完成作业并提交。</p>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="font-medium text-lg mb-4">作业要求</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <p>{assignmentContent.instructions || '同学们需要自己去做一个网站'}</p>
              </div>
              
              <h3 className="font-medium text-lg mb-4">评分标准</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <p>{assignmentContent.criteria || '只要做了就满分'}</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="font-medium text-lg mb-4">提交作业</h3>
              <textarea 
                className="w-full p-3 border border-gray-300 rounded-md" 
                rows={8}
                placeholder="在此输入您的答案或上传文件..."
              ></textarea>
              
              <div className="flex items-center gap-4 mt-4">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  上传文件
                </Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  提交作业
                </Button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                提交后，您的作业将被AI自动评分，老师也会对您的作业进行审核。
              </p>
            </div>
          </div>
        );
        
      case 'card_creator':
        // 获取卡片创建器内容
        const cardCreatorContent = selectedLesson.content as CardCreatorLessonContentType;
        
        // 从API获取用户ID
        const userId = enrollmentId?.split('_')?.[0] || '';
        
        // 将课时内容转换为卡片任务格式
        const cardTask: CardCreatorTask = {
          id: selectedLesson.id,
          course_id: courseData?.id || '',
          title: selectedLesson.title,
          instructions: cardCreatorContent.instructions || '',
          template_type: cardCreatorContent.templateType || 'text',
          template_image_url: cardCreatorContent.templateImageUrl,
          template_description: cardCreatorContent.templateDescription
        };
        
        return (
          <div className="space-y-6">
            {!showCardCreator ? (
              <div className="space-y-6">
                <div className="interactive-container text-center py-10">
                  <h3 className="text-xl font-bold text-blue-700 mb-4">互动内容区域</h3>
                  <Button 
                    className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm"
                    onClick={() => setShowCardCreator(true)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    点击生成我的卡片
                  </Button>
                </div>
                
                <div className="flex flex-row gap-6 mb-6">
                  <Card className="flex-1 border border-ghibli-teal/30 bg-ghibli-parchment shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-ghibli-mint/30 to-ghibli-lightTeal/20 pb-3">
                      <CardTitle className="text-lg text-ghibli-deepTeal">学习目标</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 text-ghibli-teal">
                            <Check size={16} />
                          </div>
                          <span className="text-ghibli-brown">理解基本概念</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 text-ghibli-teal">
                            <Check size={16} />
                          </div>
                          <span className="text-ghibli-brown">应用所学知识解决简单问题</span>
                        </li>
                        <li className="flex items-start">
                          <div className="mr-2 mt-0.5 text-ghibli-teal">
                            <Check size={16} />
                          </div>
                          <span className="text-ghibli-brown">通过互动加深理解</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="flex-1 border border-ghibli-teal/30 bg-ghibli-parchment shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-ghibli-mint/30 to-ghibli-lightTeal/20 pb-3">
                      <CardTitle className="text-lg text-ghibli-deepTeal">说明</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-ghibli-brown">
                        跟随指示完成互动练习。你可以随时暂停并返回。
                        如果遇到困难，可以点击右下角的帮助按钮获取提示。
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="card-creator-container mt-4">
                <Button 
                  variant="outline" 
                  className="mb-6" 
                  onClick={() => setShowCardCreator(false)}
                >
                  返回说明
                </Button>
                
                <CardCreatorStudent
                  taskId={selectedLesson.id}
                  studentId={userId}
                  task={cardTask}
                  onSubmit={(submission) => {
                    console.log('卡片已提交:', submission);
                    // 这里可以添加卡片提交后的操作，如标记课时为已完成
                    if (enrollmentId && selectedLesson.id && courseData?.id) {
                      courseService.markLessonComplete(
                        selectedLesson.id,
                        courseData.id,
                        enrollmentId
                      );
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      case 'drag_sort':
        return (
          <div className="w-full mt-2 max-w-[1000px] mx-auto">
            <DragSortExercise 
              lesson={selectedLesson}
              onComplete={(isCorrect, mappings) => {
                if (isCorrect && selectedLesson && courseData && enrollmentId) {
                  courseService.markLessonComplete(
                    selectedLesson.id,
                    courseData.id,
                    enrollmentId,
                    isCorrect ? 100 : 0,
                    {
                      isCorrect,
                      mappings
                    }
                  );
                }
              }}
            />
          </div>
        );
      // Handle other types with a default case
      default:
        return (
          <div className="space-y-6">
            <div className="interactive-container">
              <div className="text-center">
                <h3 className="text-xl font-bold text-blue-700 mb-4">互动内容区域</h3>
                <Button 
                  className="bg-ghibli-teal hover:bg-ghibli-deepTeal text-white"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  标记为已完成
                </Button>
              </div>
            </div>
            
            <div className="flex flex-row gap-6 mb-6">
              <Card className="flex-1 border border-ghibli-teal/30 bg-ghibli-parchment shadow-sm">
                <CardHeader className="bg-gradient-to-r from-ghibli-mint/30 to-ghibli-lightTeal/20 pb-3">
                  <CardTitle className="text-lg text-ghibli-deepTeal">学习目标</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-ghibli-teal">
                        <Check size={16} />
                      </div>
                      <span className="text-ghibli-brown">理解基本概念</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-ghibli-teal">
                        <Check size={16} />
                      </div>
                      <span className="text-ghibli-brown">应用所学知识解决简单问题</span>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 mt-0.5 text-ghibli-teal">
                        <Check size={16} />
                      </div>
                      <span className="text-ghibli-brown">通过互动加深理解</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="flex-1 border border-ghibli-teal/30 bg-ghibli-parchment shadow-sm">
                <CardHeader className="bg-gradient-to-r from-ghibli-mint/30 to-ghibli-lightTeal/20 pb-3">
                  <CardTitle className="text-lg text-ghibli-deepTeal">说明</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-ghibli-brown">
                    跟随指示完成互动练习。你可以随时暂停并返回。
                    如果遇到困难，可以点击右下角的帮助按钮获取提示。
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <>
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
              
              <LessonNavigation 
                courseData={courseData}
                selectedLesson={selectedLesson}
                enrollmentId={enrollmentId}
              />
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
    </>
  );
};

export default LessonContent;
