import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { SeriesQuestion } from '@/types/course';
import { countWords, estimateWritingTime } from '@/utils/wordCount';

interface PreviewAnswer {
  questionId: string;
  text: string;
  wordCount: number;
}

interface ProgressStatsProps {
  questions: SeriesQuestion[];
  answers: PreviewAnswer[];
  timeLimit?: number;
  className?: string;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  questions,
  answers,
  timeLimit,
  className = ''
}) => {
  // 计算统计数据
  const stats = React.useMemo(() => {
    const totalQuestions = questions.length;
    const answeredQuestions = answers.filter(answer => answer.text.trim().length > 0).length;
    const requiredQuestions = questions.filter(q => q.required).length;
    const answeredRequiredQuestions = answers.filter(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      return question?.required && answer.text.trim().length > 0;
    }).length;
    
    const totalWords = answers.reduce((sum, answer) => sum + answer.wordCount, 0);
    const averageWordsPerQuestion = answeredQuestions > 0 ? Math.round(totalWords / answeredQuestions) : 0;
    
    // 计算完成度
    const overallProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    const requiredProgress = requiredQuestions > 0 ? Math.round((answeredRequiredQuestions / requiredQuestions) * 100) : 100;
    
    // 计算字数要求完成情况
    let wordRequirementsMet = 0;
    let totalWordRequirements = 0;
    
    questions.forEach(question => {
      if (question.min_words || question.max_words) {
        totalWordRequirements++;
        const answer = answers.find(a => a.questionId === question.id);
        if (answer) {
          const wordCount = answer.wordCount;
          const meetsMin = !question.min_words || wordCount >= question.min_words;
          const meetsMax = !question.max_words || wordCount <= question.max_words;
          if (meetsMin && meetsMax) {
            wordRequirementsMet++;
          }
        }
      }
    });
    
    const wordRequirementsProgress = totalWordRequirements > 0 ? 
      Math.round((wordRequirementsMet / totalWordRequirements) * 100) : 100;
    
    // 估算剩余时间
    const remainingQuestions = totalQuestions - answeredQuestions;
    const estimatedRemainingTime = remainingQuestions > 0 ? 
      estimateWritingTime(remainingQuestions * 100) : 0; // 假设每题平均100字
    
    return {
      totalQuestions,
      answeredQuestions,
      requiredQuestions,
      answeredRequiredQuestions,
      totalWords,
      averageWordsPerQuestion,
      overallProgress,
      requiredProgress,
      wordRequirementsMet,
      totalWordRequirements,
      wordRequirementsProgress,
      estimatedRemainingTime
    };
  }, [questions, answers]);

  // 获取进度状态
  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return 'complete';
    if (progress >= 80) return 'good';
    if (progress >= 50) return 'fair';
    return 'poor';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          答题进度统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 总体进度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">总体完成度</span>
            <Badge variant={stats.overallProgress >= 80 ? 'default' : 'secondary'}>
              {stats.overallProgress}%
            </Badge>
          </div>
          <Progress value={stats.overallProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>已答: {stats.answeredQuestions}</span>
            <span>总计: {stats.totalQuestions}</span>
          </div>
        </div>

        {/* 必答题进度 */}
        {stats.requiredQuestions > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                必答题完成度
              </span>
              <Badge variant={stats.requiredProgress >= 100 ? 'default' : 'destructive'}>
                {stats.requiredProgress}%
              </Badge>
            </div>
            <Progress value={stats.requiredProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>已答: {stats.answeredRequiredQuestions}</span>
              <span>必答: {stats.requiredQuestions}</span>
            </div>
          </div>
        )}

        {/* 字数要求完成度 */}
        {stats.totalWordRequirements > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Target className="h-4 w-4 text-blue-500" />
                字数要求达标率
              </span>
              <Badge variant={stats.wordRequirementsProgress >= 80 ? 'default' : 'secondary'}>
                {stats.wordRequirementsProgress}%
              </Badge>
            </div>
            <Progress value={stats.wordRequirementsProgress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>达标: {stats.wordRequirementsMet}</span>
              <span>有要求: {stats.totalWordRequirements}</span>
            </div>
          </div>
        )}

        {/* 统计信息网格 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">总字数</span>
            </div>
            <div className="text-lg font-bold text-gray-700">{stats.totalWords}</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-500">平均字数</span>
            </div>
            <div className="text-lg font-bold text-gray-700">{stats.averageWordsPerQuestion}</div>
          </div>
        </div>

        {/* 时间估算 */}
        {(timeLimit || stats.estimatedRemainingTime > 0) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">时间信息</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {timeLimit && (
                <div className="flex justify-between">
                  <span className="text-gray-600">时间限制:</span>
                  <span className="font-medium">{timeLimit} 分钟</span>
                </div>
              )}
              {stats.estimatedRemainingTime > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">预计剩余:</span>
                  <span className="font-medium">{stats.estimatedRemainingTime} 分钟</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 完成状态提示 */}
        <div className={`p-3 rounded-lg border ${getStatusColor(getProgressStatus(stats.overallProgress))}`}>
          <div className="text-sm font-medium mb-1">
            {stats.overallProgress >= 100 ? '🎉 全部完成!' :
             stats.overallProgress >= 80 ? '👍 接近完成' :
             stats.overallProgress >= 50 ? '📝 进行中' : '🚀 刚开始'}
          </div>
          <div className="text-xs">
            {stats.overallProgress >= 100 ? '所有问题都已回答完成' :
             stats.requiredProgress < 100 ? `还有 ${stats.requiredQuestions - stats.answeredRequiredQuestions} 道必答题待完成` :
             `还有 ${stats.totalQuestions - stats.answeredQuestions} 道题目待回答`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressStats;
