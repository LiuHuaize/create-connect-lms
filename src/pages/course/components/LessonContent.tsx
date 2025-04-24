import React, { useState, useEffect } from 'react';
import { Play, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lesson, CourseModule, LessonType, TextLessonContent, AssignmentLessonContent, CardCreatorLessonContent } from '@/types/course';
import { CardCreatorTask } from '@/types/card-creator';
import LessonNavigation from './LessonNavigation';
import { NavigateFunction } from 'react-router-dom';
import BlockNoteRenderer from '@/components/editor/BlockNoteRenderer';
import { courseService } from '@/services/courseService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CardCreatorStudent } from '@/components/course/card-creator/CardCreatorStudent';

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
        setQuizResult({
          score: completionData.score || 0,
          totalQuestions: completionData.data?.totalQuestions || 0
        });
        
        // 恢复用户答案
        if (completionData.data?.userAnswers) {
          setUserAnswers(completionData.data.userAnswers);
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
        const textContent = selectedLesson.content as TextLessonContent;
        return (
          <div className="prose max-w-none">
            {textContent?.text ? (
              (() => {
                try {
                  const text = textContent.text;
                  
                  // 检查是否可能是BlockNote格式
                  if (text.trim().startsWith('[')) {
                    try {
                      // 尝试使用专用渲染组件
                      return <BlockNoteRenderer content={text} />;
                    } catch (error) {
                      console.error('BlockNote渲染失败:', error);
                    }
                  }
                  
                  // 如果不是BlockNote格式或渲染失败，尝试其他格式解析
                  try {
                    // 尝试解析文本内容
                    const parsed = JSON.parse(text);
                    // 检查是否是数组
                    if (Array.isArray(parsed)) {
                      return parsed.map((block: any) => {
                        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
                          return `<p>${block.content.map((item: any) => item.text || '').join('')}</p>`;
                        }
                        return '';
                      }).join('');
                    } else {
                      // 如果不是预期的格式，直接显示文本
                      return <p>{text}</p>;
                    }
                  } catch (error) {
                    // 解析失败时,直接显示原始文本
                    console.error('解析文本内容失败:', error);
                    return <p>{text}</p>;
                  }
                } catch (error) {
                  console.error('处理课程内容失败:', error);
                  return <p>内容无法显示</p>;
                }
              })()
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
        const quizContent = selectedLesson.content as any;
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <Check size={18} className="mr-2" /> 测验说明
              </h3>
              <p className="text-blue-700 text-sm">完成下面的题目来测试你的理解。每道题选择一个正确答案。</p>
            </div>
            
            {quizSubmitted && quizResult && (
              <div className={`p-4 rounded-lg mb-4 ${quizResult.score >= 60 ? 'bg-green-50 border border-green-100' : 'bg-yellow-50 border border-yellow-100'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-medium mb-2 ${quizResult.score >= 60 ? 'text-green-800' : 'text-yellow-800'}`}>
                      测验结果
                    </h3>
                    <p className={quizResult.score >= 60 ? 'text-green-700' : 'text-yellow-700'}>
                      你的得分: {quizResult.score}% ({Math.round(quizResult.score * quizResult.totalQuestions / 100)}/{quizResult.totalQuestions} 题正确)
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={handleUnmarkComplete}
                    disabled={isCompletionLoading}
                  >
                    {isCompletionLoading ? '取消中...' : '取消标记'}
                  </Button>
                </div>
              </div>
            )}
            
            {quizContent?.questions && quizContent.questions.length > 0 ? (
              <div className="space-y-6">
                {quizContent.questions.map((question: any, qIndex: number) => (
                  <div key={question.id || `q-${qIndex}`} className="quiz-container">
                    <h4 className="font-medium text-lg mb-4">问题 {qIndex + 1}: {question.text || '未命名问题'}</h4>
                    {question.options && (
                      <div className="space-y-3">
                        {question.options.map((option: any, oIndex: number) => (
                          <label key={option.id || `opt-${oIndex}`} className="quiz-option flex items-start">
                            <input 
                              type="radio" 
                              name={`q-${question.id || qIndex}`} 
                              className="mr-3 h-4 w-4 accent-blue-500 mt-1" 
                              checked={userAnswers[question.id] === option.id}
                              onChange={() => handleAnswerSelect(question.id, option.id)}
                              disabled={quizSubmitted}
                            />
                            <span>{option.text}</span>
                            {quizSubmitted && option.id === question.correctOption && (
                              <span className="ml-2 text-green-600 text-sm">(正确答案)</span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'short_answer' && (
                      <div className="mt-4">
                        <textarea 
                          className="w-full p-3 border border-gray-300 rounded-md" 
                          rows={4}
                          placeholder="在此输入您的答案..."
                          value={userAnswers[question.id] || ''}
                          onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                          disabled={quizSubmitted}
                        ></textarea>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-end">
                  {!quizSubmitted ? (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleQuizSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? '提交中...' : '提交答案'}
                    </Button>
                  ) : (
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => navigate('/learning')}
                    >
                      返回课程
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="quiz-container">
                  <h4 className="font-medium text-lg mb-4">问题 1: 新问题</h4>
                  <div className="space-y-3">
                    {['选项1', '选项2'].map((option, index) => (
                      <label key={index} className="quiz-option">
                        <input 
                          type="radio" 
                          name="q1" 
                          className="mr-3 h-4 w-4 accent-blue-500" 
                          disabled={quizSubmitted}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleQuizSubmit}
                  >
                    提交答案
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      case 'assignment':
        const assignmentContent = selectedLesson.content as AssignmentLessonContent;
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
        const cardCreatorContent = selectedLesson.content as CardCreatorLessonContent;
        
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCardCreator(true)}
                  >
                    开始互动
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">学习目标</CardTitle>
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
      // Handle other types with a default case
      default:
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
                  <CardTitle className="text-lg">学习目标</CardTitle>
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
    }
  };

  return (
    <>
      {selectedLesson && selectedUnit ? (
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 py-4">
              <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1">
                <span className="truncate">{selectedUnit.title} / {selectedLesson.title}</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl">{selectedLesson.title}</CardTitle>
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
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <Check className="h-8 w-8 sm:h-12 sm:w-12 text-blue-500" />
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
    </>
  );
};

export default LessonContent;
