import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { SeriesAIGrading } from '@/types/series-questionnaire';
import { cn } from '@/lib/utils';

interface SeriesGradingResultProps {
  grading: SeriesAIGrading;
  questions: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  answers: Array<{
    question_id: string;
    answer_text: string;
  }>;
  totalScore: number;
}

export const SeriesGradingResult: React.FC<SeriesGradingResultProps> = ({
  grading,
  questions,
  answers,
  totalScore
}) => {
  const [expandedQuestions, setExpandedQuestions] = React.useState<Set<string>>(new Set());
  
  // 计算分数百分比
  const scorePercentage = Math.round((grading.final_score / totalScore) * 100);
  
  // 获取分数等级和颜色
  const getScoreGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: '优秀', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
    if (percentage >= 75) return { grade: '良好', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    if (percentage >= 60) return { grade: '及格', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
    return { grade: '需要改进', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' };
  };
  
  const scoreGrade = getScoreGrade(scorePercentage);
  
  // 解析AI反馈内容
  const parsedFeedback = React.useMemo(() => {
    try {
      if (typeof grading.ai_feedback === 'string') {
        return JSON.parse(grading.ai_feedback);
      }
      return grading.ai_feedback;
    } catch {
      // 如果不是JSON格式，返回默认结构
      return {
        overall_feedback: grading.ai_feedback,
        detailed_feedback: [],
        criteria_scores: {},
        suggestions: []
      };
    }
  }, [grading.ai_feedback]);
  
  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };
  
  return (
    <div className="space-y-6">
      {/* 总体评分卡片 */}
      <Card className={cn("border-2", scoreGrade.borderColor)}>
        <CardHeader className={cn("pb-4", scoreGrade.bgColor)}>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              AI评分结果
            </CardTitle>
            <Badge variant="outline" className={cn("text-lg px-4 py-1", scoreGrade.color, scoreGrade.borderColor)}>
              {scoreGrade.grade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 分数展示 */}
          <div className="mb-6">
            <div className="flex items-end justify-center mb-4">
              <span className={cn("text-5xl font-bold", scoreGrade.color)}>
                {grading.final_score}
              </span>
              <span className="text-2xl text-gray-500 ml-2">/ {totalScore}</span>
            </div>
            <Progress 
              value={scorePercentage} 
              className="h-3 mb-2"
            />
            <p className="text-center text-sm text-gray-600">
              得分率：{scorePercentage}%
            </p>
          </div>
          
          {/* 总体反馈 */}
          {parsedFeedback.overall_feedback && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                总体评价
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {parsedFeedback.overall_feedback}
              </p>
            </div>
          )}
          
          {/* 评分维度（如果有） */}
          {parsedFeedback.criteria_scores && Object.keys(parsedFeedback.criteria_scores).length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                评分维度
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(parsedFeedback.criteria_scores).map(([criterion, score]) => (
                  <div key={criterion} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">{criterion}</span>
                      <span className="font-medium">{score}分</span>
                    </div>
                    <Progress 
                      value={(score as number / totalScore) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 改进建议 */}
          {parsedFeedback.suggestions && parsedFeedback.suggestions.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-blue-800">
                <TrendingUp className="h-4 w-4" />
                改进建议
              </h3>
              <ul className="space-y-2">
                {parsedFeedback.suggestions.map((suggestion: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
                    <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 详细反馈（每道题） */}
      {parsedFeedback.detailed_feedback && parsedFeedback.detailed_feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              各题详细反馈
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((question, index) => {
              const answer = answers.find(a => a.question_id === question.id);
              const feedback = parsedFeedback.detailed_feedback.find(
                (f: {question_id: string}) => f.question_id === question.id
              );
              const isExpanded = expandedQuestions.has(question.id);
              
              if (!feedback) return null;
              
              return (
                <div key={question.id} className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(question.id)}
                    className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-medium">问题 {index + 1}</span>
                        <span className="text-gray-600">{question.title}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {feedback.score}/{totalScore}分
                        </Badge>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 space-y-4 border-t">
                      {/* 问题内容 */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-1">问题内容</h4>
                        <p className="text-gray-700">{question.content}</p>
                      </div>
                      
                      {/* 学生答案 */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-1">你的答案</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {answer?.answer_text || '未作答'}
                        </p>
                      </div>
                      
                      {/* 反馈 */}
                      <div>
                        <h4 className="font-medium text-sm text-gray-600 mb-1">AI反馈</h4>
                        <p className="text-gray-700">{feedback.feedback}</p>
                      </div>
                      
                      {/* 优点和改进点 */}
                      <div className="grid grid-cols-2 gap-4">
                        {feedback.strengths && feedback.strengths.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <h5 className="font-medium text-green-800 mb-2 flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              做得好的地方
                            </h5>
                            <ul className="space-y-1">
                              {feedback.strengths.map((strength: string, idx: number) => (
                                <li key={idx} className="text-sm text-green-700">
                                  • {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {feedback.improvements && feedback.improvements.length > 0 && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <h5 className="font-medium text-yellow-800 mb-2 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              可以改进的地方
                            </h5>
                            <ul className="space-y-1">
                              {feedback.improvements.map((improvement: string, idx: number) => (
                                <li key={idx} className="text-sm text-yellow-700">
                                  • {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      
      {/* 查看报告按钮 */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => window.print()}
        >
          <BarChart3 className="h-4 w-4" />
          打印评分报告
        </Button>
      </div>
    </div>
  );
};