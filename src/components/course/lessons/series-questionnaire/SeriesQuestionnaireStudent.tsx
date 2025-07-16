import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Save,
  Send,
  AlertCircle,
  CheckCircle,
  FileText,
  Timer,
  BookOpen,
  User,
  Award,
  ChevronLeft,
  ChevronRight,
  Navigation,
  List,
  Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';
import { seriesAIGradingService } from '@/services/seriesAIGradingService';
import { 
  SeriesQuestionnaire, 
  SeriesQuestion, 
  SeriesSubmission, 
  SeriesAnswer,
  SeriesAIGrading 
} from '@/types/course';
import { getCurrentUser } from '@/utils/userSession';
import WordCountDisplay from '@/components/course/creator/series-questionnaire/WordCountDisplay';
import { SeriesGradingResult } from './SeriesGradingResult';

interface SeriesQuestionnaireStudentProps {
  questionnaireId: string;
  lessonId: string;
  courseId: string;
  enrollmentId: string | null;
  onComplete?: () => void;
  showGradingResult?: boolean;
  onGradingResultShown?: () => void;
}

interface StudentSubmissionStatus {
  submission?: SeriesSubmission;
  has_submission: boolean;
  can_submit: boolean;
  time_remaining?: number;
}

const SeriesQuestionnaireStudent: React.FC<SeriesQuestionnaireStudentProps> = ({
  questionnaireId,
  lessonId,
  courseId,
  enrollmentId,
  onComplete,
  showGradingResult = false,
  onGradingResultShown
}) => {
  // 导航
  const navigate = useNavigate();
  
  // 状态管理
  const [questionnaire, setQuestionnaire] = useState<SeriesQuestionnaire | null>(null);
  const [questions, setQuestions] = useState<SeriesQuestion[]>([]);
  const [answers, setAnswers] = useState<SeriesAnswer[]>([]);
  const [submissionStatus, setSubmissionStatus] = useState<StudentSubmissionStatus | null>(null);
  const [aiGrading, setAiGrading] = useState<SeriesAIGrading | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [aiGradingLoading, setAiGradingLoading] = useState(false);
  const [aiGradingProgress, setAiGradingProgress] = useState(0);
  const [aiGradingStep, setAiGradingStep] = useState('');

  // 导航和UI状态
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single'); // 单题模式或全部显示模式
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [startTime] = useState(Date.now());
  const [isSubmittingProcess, setIsSubmittingProcess] = useState(false);

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, [startTime]);

  // 加载问答数据
  const loadQuestionnaireData = async () => {
    try {
      setLoading(true);

      // 检查questionnaireId是否有效
      if (!questionnaireId) {
        throw new Error('问答ID无效');
      }

      // 获取问答详情
      const questionnaireResponse = await seriesQuestionnaireService.getSeriesQuestionnaire(questionnaireId);
      
      if (!questionnaireResponse.success || !questionnaireResponse.data) {
        throw new Error('无法加载问答内容');
      }

      setQuestionnaire(questionnaireResponse.data);
      const questionsData = questionnaireResponse.data.questions || [];
      setQuestions(questionsData);

      // 获取学生提交状态
      const statusResponse = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);

      if (statusResponse.success && statusResponse.data) {
        setSubmissionStatus(statusResponse.data);

        // 如果有已保存的答案，加载它们
        if (statusResponse.data.submission?.answers && questionnaireResponse.data.questions) {
          // 创建一个包含所有问题的答案数组，确保每个问题都有对应的答案条目
          const allAnswers: SeriesAnswer[] = questionnaireResponse.data.questions.map(question => {
            const savedAnswer = statusResponse.data.submission!.answers.find(
              (a: SeriesAnswer) => a.question_id === question.id
            );
            
            if (savedAnswer) {
              return savedAnswer;
            } else {
              // 为没有保存答案的问题创建空答案
              return {
                question_id: question.id,
                answer_text: '',
                word_count: 0
              };
            }
          });
          
          setAnswers(allAnswers);
        } else if (questionnaireResponse.data.questions) {
          // 如果没有保存的答案，初始化所有问题的空答案
          const emptyAnswers: SeriesAnswer[] = questionnaireResponse.data.questions.map(question => ({
            question_id: question.id,
            answer_text: '',
            word_count: 0
          }));
          setAnswers(emptyAnswers);
        }

        // 如果已提交且已评分，手动获取AI评分数据
        if (statusResponse.data.submission?.status === 'graded') {
          // 使用专门的AI评分服务查询最新数据
          try {
            const gradingData = await seriesAIGradingService.getAIGrading(statusResponse.data.submission.id);
            
            if (gradingData) {
              setAiGrading(gradingData);
            } else {
              setAiGrading(null);
            }
          } catch (gradingQueryError) {
            console.error('❌ 查询AI评分失败:', gradingQueryError);
            setAiGrading(null);
          }
        } else {
          // 清除之前的AI评分数据
          setAiGrading(null);
        }
      }
    } catch (error) {
      console.error('加载问答数据失败:', error);
      toast.error('加载问答内容失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 只在 questionnaireId 变化时加载数据
  useEffect(() => {
    if (questionnaireId) {
      loadQuestionnaireData();
    }
  }, [questionnaireId]);

  // AI评分处理函数
  const handleAIGrading = async (submissionId: string, forceRegrade: boolean = false) => {
    try {
      setAiGradingLoading(true);
      setAiGradingProgress(0);
      setAiGradingStep('准备开始AI评分...');

      // 模拟进度更新
      const progressSteps = [
        { progress: 10, step: '正在分析您的答案...' },
        { progress: 30, step: '评估答案质量...' },
        { progress: 60, step: '生成详细反馈...' },
        { progress: 85, step: '完成评分计算...' },
        { progress: 95, step: '准备评分结果...' }
      ];

      // 启动进度动画
      progressSteps.forEach((stepData, index) => {
        setTimeout(() => {
          setAiGradingProgress(stepData.progress);
          setAiGradingStep(stepData.step);
        }, (index + 1) * 1000);
      });

      // 触发AI评分
      const gradingResponse = await seriesQuestionnaireService.triggerAIGrading({
        submission_id: submissionId,
        force_regrade: forceRegrade
      });

      if (gradingResponse.success) {
        // 等待AI评分完成
        let attempts = 0;
        const maxAttempts = 20; // 最多等待100秒
        
        const checkGradingStatus = async (): Promise<boolean> => {
          attempts++;
          const statusResponse = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);
          
          if (statusResponse.success && statusResponse.data?.submission?.status === 'graded') {
            return true;
          }
          
          if (attempts >= maxAttempts) {
            throw new Error('AI评分超时，请稍后查看结果');
          }
          
          // 继续等待
          await new Promise(resolve => setTimeout(resolve, 5000));
          return checkGradingStatus();
        };

        await checkGradingStatus();
        
        // 评分完成，更新进度
        setAiGradingProgress(100);
        setAiGradingStep('AI评分完成！');
        
        // 重新加载数据以获取评分结果
        await loadQuestionnaireData();
        
        toast.success('AI评分完成！');
        
        // 短暂延迟后隐藏加载状态
        setTimeout(() => {
          setAiGradingLoading(false);
          setAiGradingProgress(0);
          setAiGradingStep('');
        }, 2000);

      } else {
        throw new Error(gradingResponse.error || 'AI评分启动失败');
      }

    } catch (error) {
      console.error('AI评分失败:', error);
      toast.error(error instanceof Error ? error.message : 'AI评分失败，请稍后重试');
      setAiGradingLoading(false);
      setAiGradingProgress(0);
      setAiGradingStep('');
    }
  };

  // 更新答案
  const updateAnswer = (questionId: string, answerText: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.question_id === questionId);
      if (existing) {
        return prev.map(a => 
          a.question_id === questionId 
            ? { ...a, answer_text: answerText, word_count: answerText.trim().split(/\s+/).length }
            : a
        );
      } else {
        return [...prev, {
          question_id: questionId,
          answer_text: answerText,
          word_count: answerText.trim().split(/\s+/).length
        }];
      }
    });
  };

  // 保存草稿
  const saveDraft = async () => {
    if (!questionnaire?.allow_save_draft) {
      toast.error('此问答不允许保存草稿');
      return;
    }

    try {
      setSaving(true);

      // 确保所有问题都有答案条目（即使是空的）
      const allAnswers: SeriesAnswer[] = questions.map(question => {
        const existingAnswer = answers.find(a => a.question_id === question.id);
        if (existingAnswer) {
          return existingAnswer;
        } else {
          // 为未回答的问题创建空答案
          return {
            question_id: question.id,
            answer_text: '',
            word_count: 0
          };
        }
      });

      // 调试信息
      console.log('保存草稿 - 当前答案:', answers);
      console.log('保存草稿 - 所有答案（包括空答案）:', allAnswers);
      console.log('保存草稿 - 问答ID:', questionnaireId);
      console.log('保存草稿 - 时间:', timeSpent);

      const response = await seriesQuestionnaireService.saveSeriesDraft({
        questionnaire_id: questionnaireId,
        answers: allAnswers,
        time_spent_minutes: timeSpent
      });

      console.log('保存草稿 - 服务器响应:', response);

      if (response.success) {
        toast.success('草稿已保存');
        // 重新加载提交状态（避免无限循环）
        console.log('保存草稿后重新加载数据');
        // 使用 setTimeout 避免立即重新渲染导致的性能问题
        setTimeout(() => {
          loadQuestionnaireData();
        }, 100);
      } else {
        console.error('保存草稿失败 - 服务器错误:', response.error);
        throw new Error(response.error || '保存失败');
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      toast.error('保存草稿失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 导航功能
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // 检查提交前的验证
  const validateBeforeSubmit = () => {
    const requiredQuestions = questions.filter(q => q.required);
    const answeredQuestions = answers.filter(a => a.answer_text.trim() !== '');
    const missingRequired = requiredQuestions.filter(rq =>
      !answeredQuestions.some(aq => aq.question_id === rq.id)
    );

    return {
      isValid: missingRequired.length === 0,
      missingCount: missingRequired.length,
      missingQuestions: missingRequired
    };
  };

  // 显示提交确认对话框
  const handleSubmitClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🚀 handleSubmitClick 被调用');
    
    const validation = validateBeforeSubmit();
    if (!validation.isValid) {
      toast.error(`请回答所有必填问题（还有 ${validation.missingCount} 个必填问题未回答）`);
      return;
    }
    setShowSubmitConfirm(true);
  };

  // 确认提交答案
  const confirmSubmitAnswers = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('🚀 confirmSubmitAnswers 被调用');
    
    // 防止重复提交
    if (isSubmittingProcess) {
      console.log('⚠️ 正在提交中，忽略重复请求');
      return;
    }
    
    try {
      setIsSubmittingProcess(true);
      setSubmitting(true);
      setShowSubmitConfirm(false);

      console.log('📤 准备提交答案:', {
        questionnaire_id: questionnaireId,
        answers: answers.filter(a => a.answer_text.trim() !== ''),
        status: 'submitted',
        time_spent_minutes: timeSpent
      });

      const response = await seriesQuestionnaireService.submitSeriesAnswers({
        questionnaire_id: questionnaireId,
        answers,
        status: 'submitted',
        time_spent_minutes: timeSpent
      });

      console.log('📥 提交答案响应:', response);

      if (response.success) {
        toast.success('答案已提交！');
        
        // 重新加载数据以获取最新状态
        await loadQuestionnaireData();
        
        // 如果需要AI评分且有评分标准，在原界面启动AI评分
        if (response.data?.redirect_to_grading && 
            questionnaire?.ai_grading_prompt && 
            questionnaire?.ai_grading_criteria &&
            response.data?.submission_id) {
          
          console.log('🤖 开始AI评分流程');
          toast.info('开始AI评分，请稍候...');
          
          // 在原界面启动AI评分
          await handleAIGrading(response.data.submission_id);
        }
        
        // 延迟调用 onComplete 以防止立即触发父组件刷新
        setTimeout(() => {
          onComplete?.();
        }, 100);
      } else {
        throw new Error(response.error || '提交失败');
      }
    } catch (error) {
      console.error('❌ 提交答案失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
      setIsSubmittingProcess(false);
    }
  };

  // 计算完成进度
  const getProgress = () => {
    if (questions.length === 0) return 0;
    const answeredCount = answers.filter(a => a.answer_text.trim() !== '').length;
    return (answeredCount / questions.length) * 100;
  };

  // 获取答案
  const getAnswer = (questionId: string) => {
    return answers.find(a => a.question_id === questionId)?.answer_text || '';
  };

  // 计算总字数
  const getTotalWords = () => {
    return answers.reduce((total, answer) => total + (answer.word_count || 0), 0);
  };


  // 手动请求AI评分
  const handleRequestAIGrading = async () => {
    if (!submissionStatus?.submission || !questionnaire) {
      toast.error('无法获取提交数据');
      return;
    }

    // 如果状态不是submitted，直接返回
    if (submissionStatus.submission.status !== 'submitted' && submissionStatus.submission.status !== 'graded') {
      console.log('检测到异常状态:', submissionStatus.submission.status);
      toast.error('提交状态异常，请联系管理员');
      return;
    }

    // 使用新的AI评分处理函数，手动请求时强制重新评分
    await handleAIGrading(submissionStatus.submission.id, true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载问答内容...</p>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">无法加载问答内容</h3>
          <p className="text-gray-600 mb-4">请检查网络连接或刷新页面重试</p>
          <Button onClick={loadQuestionnaireData} variant="outline">
            重新加载
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 如果已提交或已评分，显示完整的查看界面
  if (submissionStatus?.submission && (submissionStatus.submission.status === 'submitted' || submissionStatus.submission.status === 'graded')) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 状态标题 */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
              <CardTitle className="text-2xl">
                {submissionStatus.submission.status === 'graded' ? '问答已完成' : '答案已提交'}
              </CardTitle>
            </div>
            <p className="text-gray-600">
              {submissionStatus.submission.status === 'graded' 
                ? '您已完成此问答，以下是您的答案和评分结果' 
                : '您的答案已成功提交，正在等待评分'
              }
            </p>
          </CardHeader>
        </Card>

        {/* 题目和答案展示 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          {/* 标题区域 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{questionnaire?.title}</h2>
              {questionnaire?.description && (
                <p className="text-sm text-gray-500 mt-1">{questionnaire.description}</p>
              )}
            </div>
          </div>
          
          {/* 问题列表 */}
          <div className="space-y-8">
            {questions.map((question, index) => {
              const answer = submissionStatus.submission?.answers?.find(
                (a: any) => a.question_id === question.id
              );
              
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 问题标题区域 */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-semibold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">
                          {question.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">{question.content}</p>
                        <div className="flex gap-2">
                          {question.required && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              必答题
                            </span>
                          )}
                          {question.max_words && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              字数限制: {question.max_words}字
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 答案展示区域 */}
                  <div className="p-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {answer?.answer_text || (
                          <span className="text-gray-400 italic">未作答</span>
                        )}
                      </p>
                      {answer?.word_count && (
                        <div className="flex justify-end mt-3">
                          <span className="text-sm text-gray-500">
                            字数：{answer.word_count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI评分结果（如果有） */}
        {aiGrading && (
          <SeriesGradingResult
            grading={aiGrading}
            questions={questions}
            answers={submissionStatus.submission.answers || []}
            totalScore={questionnaire?.max_score || 100}
          />
        )}

        {/* 如果是submitted状态但没有AI评分，显示等待状态 */}
        {submissionStatus.submission.status === 'submitted' && !aiGrading && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-800 font-medium">AI正在评分中，请稍后查看结果</p>
                <Button 
                  onClick={loadQuestionnaireData} 
                  variant="outline" 
                  className="mt-4"
                >
                  刷新状态
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI评分状态区域 */}
        {aiGradingLoading ? (
          // AI评分加载中
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-6">
                {/* 加载动画 */}
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                {/* 标题和描述 */}
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 mb-2">AI 智能评分中</h3>
                  <p className="text-gray-600">{aiGradingStep}</p>
                </div>
                
                {/* 进度条 */}
                <div className="space-y-2 max-w-md mx-auto">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">评分进度</span>
                    <span className="font-medium text-blue-600">{Math.round(aiGradingProgress)}%</span>
                  </div>
                  <Progress value={aiGradingProgress} className="h-2 bg-gray-100" />
                </div>
                
                {/* 提示信息 */}
                <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-blue-700">
                    AI正在仔细分析您的答案，通常需要1-3分钟，请耐心等待...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // AI评分按钮区域
          <Card>
            <CardContent className="text-center py-6">
              <div className="space-y-4">
                {aiGrading ? (
                  // 已有AI评分，显示重新评分选项
                  <div className="bg-green-50 p-4 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">AI评分已完成</p>
                    <p className="text-green-600 text-sm">评分结果已显示在上方，可重新评分</p>
                  </div>
                ) : (
                  // 未有AI评分
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Sparkles className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-blue-800 font-medium">获取AI评分</p>
                    <p className="text-blue-600 text-sm">点击下方按钮让AI对您的答案进行评分</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleRequestAIGrading}
                  disabled={submitting || aiGradingLoading}
                  className={aiGrading 
                    ? "bg-orange-600 hover:bg-orange-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                  }
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      AI评分中...
                    </>
                  ) : aiGrading ? (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      重新AI评分
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      请求AI评分
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 问答标题和信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                {questionnaire.title}
              </CardTitle>
              {questionnaire.description && (
                <p className="text-gray-600 mt-2">{questionnaire.description}</p>
              )}
            </div>
            <div className="text-right space-y-2">
              {questionnaire.time_limit_minutes && (
                <div className="flex items-center text-sm text-gray-600">
                  <Timer className="h-4 w-4 mr-1" />
                  时间限制: {questionnaire.time_limit_minutes} 分钟
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                已用时间: {timeSpent} 分钟
              </div>
            </div>
          </div>
          
          {questionnaire.instructions && (
            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <h4 className="font-medium mb-2">答题说明</h4>
              <p className="text-gray-700">{questionnaire.instructions}</p>
            </div>
          )}
          
          {/* 技能标签 */}
          {questionnaire.skill_tags && questionnaire.skill_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {questionnaire.skill_tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* 简化的进度显示 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            {/* 进度信息 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">答题进度</span>
                <span className="text-sm font-semibold text-blue-600">{Math.round(getProgress())}%</span>
              </div>
              <Progress value={getProgress()} className="h-2 bg-blue-100" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>已回答 {answers.filter(a => a.answer_text.trim() !== '').length} / {questions.length} 题</span>
                <span>总字数: {getTotalWords()}</span>
              </div>
            </div>

            {/* 简化的视图模式切换 */}
            <div className="flex items-center justify-center pt-2 border-t border-blue-200">
              <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
                <Button
                  variant={viewMode === 'single' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('single')}
                  className={`flex items-center gap-1 ${viewMode === 'single' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <Navigation className="h-4 w-4" />
                  逐题模式
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-1 ${viewMode === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <List className="h-4 w-4" />
                  全部显示
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 问题显示区域 */}
      {viewMode === 'single' ? (
        /* 单题模式 */
        questions.length > 0 && (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold mr-3 shadow-md">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {questions[currentQuestionIndex].title}
                  </span>
                  {questions[currentQuestionIndex].required && (
                    <span className="text-red-500 ml-2 text-lg">*</span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs bg-white border-blue-300 text-blue-700">
                  第 {currentQuestionIndex + 1} 题，共 {questions.length} 题
                </Badge>
              </CardTitle>
              {questions[currentQuestionIndex].description && (
                <p className="text-gray-600 ml-11">{questions[currentQuestionIndex].description}</p>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="ml-11">
                  <p className="text-gray-800 mb-4 text-base leading-relaxed">
                    {questions[currentQuestionIndex].question_text}
                  </p>

                  <Textarea
                    placeholder={questions[currentQuestionIndex].placeholder_text || '请在此输入您的答案...'}
                    value={getAnswer(questions[currentQuestionIndex].id)}
                    onChange={(e) => updateAnswer(questions[currentQuestionIndex].id, e.target.value)}
                    className="min-h-[150px] text-base border-2 border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg transition-all duration-200"
                    disabled={submissionStatus?.submission && (submissionStatus.submission.status === 'submitted' || submissionStatus.submission.status === 'graded')}
                  />

                  <WordCountDisplay
                    text={getAnswer(questions[currentQuestionIndex].id)}
                    minWords={questions[currentQuestionIndex].min_words}
                    maxWords={questions[currentQuestionIndex].max_words}
                    showProgress={true}
                    showEstimatedTime={true}
                    className="mt-3 bg-gray-50 p-3 rounded-lg"
                  />
                </div>

                {/* 简化的导航按钮 */}
                <div className="flex justify-center items-center pt-4 border-t border-blue-100">
                  <div className="flex items-center gap-3 bg-white rounded-lg p-2 shadow-sm border border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一题
                    </Button>

                    <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {currentQuestionIndex + 1} / {questions.length}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center gap-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                    >
                      下一题
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      ) : (
        /* 全部显示模式 */
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id} className="border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3 shadow-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-800">{question.title}</span>
                  {question.required && (
                    <span className="text-red-500 ml-2 text-lg">*</span>
                  )}
                </CardTitle>
                {question.description && (
                  <p className="text-gray-600 ml-11 text-sm">{question.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <div className="ml-11 space-y-3">
                  <p className="text-gray-700 text-sm leading-relaxed">{question.question_text}</p>

                  <Textarea
                    placeholder={question.placeholder_text || '请在此输入您的答案...'}
                    value={getAnswer(question.id)}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={submissionStatus?.submission && (submissionStatus.submission.status === 'submitted' || submissionStatus.submission.status === 'graded')}
                  />

                  <WordCountDisplay
                    text={getAnswer(question.id)}
                    minWords={question.min_words}
                    maxWords={question.max_words}
                    showProgress={true}
                    showEstimatedTime={true}
                    className="bg-blue-50 p-2 rounded-lg border border-blue-200"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 简化的操作区域 */}
      {submissionStatus?.can_submit && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="space-y-4">
              {/* 简化的提交提示 */}
              <div className="bg-white border border-green-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    已回答 {answers.filter(a => a.answer_text.trim() !== '').length} / {questions.length} 题
                  </span>
                  <span className="text-green-600">•</span>
                  <span className="text-green-700">
                    必填题 {questions.filter(q => q.required && answers.some(a => a.question_id === q.id && a.answer_text.trim() !== '')).length} / {questions.filter(q => q.required).length} 题
                  </span>
                </div>
              </div>

              {/* 简化的操作按钮 */}
              <div className="flex justify-center gap-3">
                {questionnaire.allow_save_draft && (
                  <Button
                    variant="outline"
                    onClick={saveDraft}
                    disabled={saving || submitting}
                    className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        保存草稿
                      </>
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={saving || submitting}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 shadow-md"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      提交答案
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 提交确认对话框 */}
      <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              确认提交答案
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-left space-y-4 pt-2">
                <p className="text-gray-700">您即将提交系列问答的答案，请确认以下信息：</p>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">答题统计</h4>
                  <ul className="text-sm space-y-2 text-blue-700">
                    <li className="flex justify-between">
                      <span>已回答题目：</span>
                      <span className="font-medium">{answers.filter(a => a.answer_text.trim() !== '').length} / {questions.length} 题</span>
                    </li>
                    <li className="flex justify-between">
                      <span>必填题完成：</span>
                      <span className="font-medium text-green-600">✓ 已全部完成</span>
                    </li>
                    <li className="flex justify-between">
                      <span>总字数：</span>
                      <span className="font-medium">{getTotalWords()} 字</span>
                    </li>
                    <li className="flex justify-between">
                      <span>答题用时：</span>
                      <span className="font-medium">{timeSpent} 分钟</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-amber-800 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    重要提醒
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    提交后将无法修改答案，系统将自动进行AI评分。请仔细确认您的答案内容！
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSubmitConfirm(false)}
              disabled={submitting}
              className="flex-1 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={confirmSubmitAnswers}
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  提交中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  确认提交
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeriesQuestionnaireStudent;
