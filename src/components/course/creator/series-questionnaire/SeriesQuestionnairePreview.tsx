import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { SeriesQuestion } from '@/types/course';
import { countWords, validateWordCount } from '@/utils/wordCount';
import WordCountDisplay from './WordCountDisplay';
import ProgressStats from './ProgressStats';

interface SeriesQuestionnairePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  instructions?: string;
  questions: SeriesQuestion[];
  timeLimit?: number;
  maxScore?: number;
  skillTags?: string[];
}

interface PreviewAnswer {
  questionId: string;
  text: string;
  wordCount: number;
}

const SeriesQuestionnairePreview: React.FC<SeriesQuestionnairePreviewProps> = ({
  isOpen,
  onClose,
  title,
  description,
  instructions,
  questions,
  timeLimit,
  maxScore,
  skillTags = []
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState<PreviewAnswer[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'step-by-step'>('overview');

  // 使用导入的字数统计工具函数

  // 获取当前问题的预览答案
  const getCurrentAnswer = (questionId: string): PreviewAnswer | undefined => {
    return previewAnswers.find(answer => answer.questionId === questionId);
  };

  // 更新预览答案
  const updatePreviewAnswer = (questionId: string, text: string) => {
    const wordCount = countWords(text);
    setPreviewAnswers(prev => {
      const existing = prev.find(answer => answer.questionId === questionId);
      if (existing) {
        return prev.map(answer => 
          answer.questionId === questionId 
            ? { ...answer, text, wordCount }
            : answer
        );
      } else {
        return [...prev, { questionId, text, wordCount }];
      }
    });
  };

  // 计算总体进度
  const overallProgress = useMemo(() => {
    const answeredQuestions = previewAnswers.filter(answer => answer.text.trim().length > 0).length;
    return questions.length > 0 ? Math.round((answeredQuestions / questions.length) * 100) : 0;
  }, [previewAnswers, questions.length]);

  // 计算总字数
  const totalWordCount = useMemo(() => {
    return previewAnswers.reduce((total, answer) => total + answer.wordCount, 0);
  }, [previewAnswers]);

  // 验证当前问题答案
  const validateCurrentQuestion = (question: SeriesQuestion): { isValid: boolean; message?: string } => {
    const answer = getCurrentAnswer(question.id);

    if (question.required && (!answer || answer.text.trim().length === 0)) {
      return { isValid: false, message: '此题为必答题，请填写答案' };
    }

    if (answer && answer.text.trim().length > 0) {
      const validation = validateWordCount(answer.text, question.min_words, question.max_words);
      return {
        isValid: validation.isValid,
        message: validation.message
      };
    }

    return { isValid: true };
  };

  // 导航到下一题
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // 导航到上一题
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // 渲染概览模式
  const renderOverviewMode = () => (
    <div className="space-y-6">
      {/* 进度统计 */}
      <ProgressStats
        questions={questions}
        answers={previewAnswers}
        timeLimit={timeLimit}
      />

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {description && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">描述</h4>
              <p className="text-gray-600">{description}</p>
            </div>
          )}
          
          {instructions && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">答题说明</h4>
              <p className="text-gray-600">{instructions}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span>{questions.length} 道题目</span>
            </div>
            
            {timeLimit && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span>{timeLimit} 分钟</span>
              </div>
            )}
            
            {maxScore && (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>满分 {maxScore} 分</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span>预览模式</span>
            </div>
          </div>

          {skillTags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">技能标签</h4>
              <div className="flex flex-wrap gap-2">
                {skillTags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 问题列表 */}
      <Card>
        <CardHeader>
          <CardTitle>问题列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">
                      {index + 1}
                    </span>
                    {question.title}
                    {question.required && (
                      <Badge variant="destructive" className="text-xs">必答</Badge>
                    )}
                  </h4>
                </div>
                
                {question.description && (
                  <p className="text-sm text-gray-600 mb-2 ml-8">{question.description}</p>
                )}
                
                <p className="text-gray-800 ml-8 mb-3">{question.question_text}</p>
                
                {(question.min_words || question.max_words) && (
                  <div className="ml-8 text-xs text-gray-500">
                    字数要求: 
                    {question.min_words && ` 最少${question.min_words}字`}
                    {question.min_words && question.max_words && '，'}
                    {question.max_words && ` 最多${question.max_words}字`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 渲染逐步预览模式
  const renderStepByStepMode = () => {
    if (questions.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无问题可预览</p>
        </div>
      );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = getCurrentAnswer(currentQuestion.id);
    const validation = validateCurrentQuestion(currentQuestion);

    return (
      <div className="space-y-6">
        {/* 进度条 */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">答题进度</span>
                <span className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              <Progress value={(currentQuestionIndex + 1) / questions.length * 100} />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">总体完成度: </span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <div>
                  <span className="text-gray-500">总字数: </span>
                  <span className="font-medium">{totalWordCount} 字</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 当前问题 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  {currentQuestionIndex + 1}
                </span>
                {currentQuestion.title}
                {currentQuestion.required && (
                  <Badge variant="destructive" className="text-xs">必答</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.description && (
              <p className="text-gray-600">{currentQuestion.description}</p>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 font-medium">{currentQuestion.question_text}</p>
            </div>

            {/* 答案输入区域 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                预览答案 (仅用于演示字数统计)
              </label>
              <Textarea
                placeholder={currentQuestion.placeholder_text || '在此输入你的答案...'}
                value={currentAnswer?.text || ''}
                onChange={(e) => updatePreviewAnswer(currentQuestion.id, e.target.value)}
                className="min-h-[120px]"
              />
              
              {/* 字数统计显示 */}
              <WordCountDisplay
                text={currentAnswer?.text || ''}
                minWords={currentQuestion.min_words}
                maxWords={currentQuestion.max_words}
                showProgress={true}
                showEstimatedTime={true}
                className="bg-gray-50 p-3 rounded-lg"
              />
            </div>

            {/* 导航按钮 */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                上一题
              </Button>
              
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                下一题
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              系列问答预览
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('overview')}
              >
                概览
              </Button>
              <Button
                variant={viewMode === 'step-by-step' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('step-by-step')}
              >
                逐步预览
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'overview' ? renderOverviewMode() : renderStepByStepMode()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeriesQuestionnairePreview;
