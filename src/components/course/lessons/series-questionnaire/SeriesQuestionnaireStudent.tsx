import React, { useState, useEffect, useCallback } from 'react';
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
  List
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
import { 
  SeriesQuestionnaire, 
  SeriesQuestion, 
  SeriesSubmission, 
  SeriesAnswer,
  SeriesAIGrading 
} from '@/types/course';
import { getCurrentUser } from '@/utils/userSession';
import WordCountDisplay from '@/components/course/creator/series-questionnaire/WordCountDisplay';

interface SeriesQuestionnaireStudentProps {
  questionnaireId: string;
  lessonId: string;
  courseId: string;
  enrollmentId: string | null;
  onComplete?: () => void;
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
  onComplete
}) => {
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

  // 导航和UI状态
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single'); // 单题模式或全部显示模式
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [startTime] = useState(Date.now());

  // 计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000 / 60));
    }, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, [startTime]);

  // 加载问答数据
  const loadQuestionnaireData = useCallback(async () => {
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
      setQuestions(questionnaireResponse.data.questions || []);

      // 获取学生提交状态
      const statusResponse = await seriesQuestionnaireService.getStudentSubmissionStatus(questionnaireId);
      console.log('加载问答数据 - 提交状态响应:', statusResponse);

      if (statusResponse.success && statusResponse.data) {
        setSubmissionStatus(statusResponse.data);

        // 如果有已保存的答案，加载它们
        if (statusResponse.data.submission?.answers) {
          console.log('加载问答数据 - 已保存的答案:', statusResponse.data.submission.answers);
          setAnswers(statusResponse.data.submission.answers);
        }

        // 如果已提交，获取AI评分
        if (statusResponse.data.submission?.status === 'graded') {
          // 这里可以添加获取AI评分的逻辑
        }
      }
    } catch (error) {
      console.error('加载问答数据失败:', error);
      toast.error('加载问答内容失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, [questionnaireId]);

  useEffect(() => {
    loadQuestionnaireData();
  }, [loadQuestionnaireData]);

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

      // 调试信息
      console.log('保存草稿 - 当前答案:', answers);
      console.log('保存草稿 - 问答ID:', questionnaireId);
      console.log('保存草稿 - 时间:', timeSpent);

      const response = await seriesQuestionnaireService.saveSeriesDraft({
        questionnaire_id: questionnaireId,
        answers,
        time_spent_minutes: timeSpent
      });

      console.log('保存草稿 - 服务器响应:', response);

      if (response.success) {
        toast.success('草稿已保存');
        // 重新加载提交状态
        await loadQuestionnaireData();
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
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

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
  const handleSubmitClick = () => {
    const validation = validateBeforeSubmit();
    if (!validation.isValid) {
      toast.error(`请回答所有必填问题（还有 ${validation.missingCount} 个必填问题未回答）`);
      return;
    }
    setShowSubmitConfirm(true);
  };

  // 确认提交答案
  const confirmSubmitAnswers = async () => {
    try {
      setSubmitting(true);
      setShowSubmitConfirm(false);

      const response = await seriesQuestionnaireService.submitSeriesAnswers({
        questionnaire_id: questionnaireId,
        answers,
        time_spent_minutes: timeSpent
      });

      if (response.success) {
        toast.success('答案已提交，正在进行AI评分...');
        // 重新加载数据以获取最新状态
        await loadQuestionnaireData();
        onComplete?.();
      } else {
        throw new Error(response.error || '提交失败');
      }
    } catch (error) {
      console.error('提交答案失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
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

  // 如果已提交，显示相应状态
  if (submissionStatus?.submission?.status === 'submitted') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500 mr-2" />
            <CardTitle className="text-2xl">答案已提交</CardTitle>
          </div>
          <p className="text-gray-600">您的答案已成功提交，正在等待评分</p>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800">AI正在评分中，请稍后查看结果</p>
            </div>
            <Button onClick={loadQuestionnaireData} variant="outline">
              刷新状态
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 如果已提交且已评分，显示结果
  if (submissionStatus?.submission?.status === 'graded') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-yellow-500 mr-2" />
            <CardTitle className="text-2xl">问答已完成</CardTitle>
          </div>
          <p className="text-gray-600">您的答案已提交并完成评分</p>
        </CardHeader>
        <CardContent>
          {aiGrading && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {aiGrading.final_score || aiGrading.ai_score || 0} / {questionnaire.max_score || 100}
                </div>
                <p className="text-gray-600">最终得分</p>
              </div>
              
              {aiGrading.ai_feedback && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">AI 反馈</h4>
                  <p className="text-gray-700">{aiGrading.ai_feedback}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
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
                    disabled={submissionStatus?.submission?.status === 'submitted'}
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
                    disabled={submissionStatus?.submission?.status === 'submitted'}
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
            <DialogDescription className="text-left space-y-4 pt-2">
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
