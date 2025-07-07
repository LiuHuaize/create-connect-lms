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
      // 优先使用ai_detailed_feedback字段，这是正确的数据结构
      if (grading.ai_detailed_feedback && Array.isArray(grading.ai_detailed_feedback)) {
        return {
          overall_feedback: grading.ai_feedback,
          detailed_feedback: grading.ai_detailed_feedback,
          criteria_scores: {},
          suggestions: []
        };
      }
      
      // 如果ai_feedback是JSON字符串，尝试解析
      if (typeof grading.ai_feedback === 'string') {
        const parsed = JSON.parse(grading.ai_feedback);
        return {
          overall_feedback: parsed.overall_feedback || grading.ai_feedback,
          detailed_feedback: parsed.detailed_feedback || grading.ai_detailed_feedback || [],
          criteria_scores: parsed.criteria_scores || {},
          suggestions: parsed.suggestions || []
        };
      }
      
      // 如果ai_feedback是对象
      if (typeof grading.ai_feedback === 'object' && grading.ai_feedback !== null) {
        return {
          overall_feedback: (grading.ai_feedback as any).overall_feedback || grading.ai_feedback,
          detailed_feedback: (grading.ai_feedback as any).detailed_feedback || grading.ai_detailed_feedback || [],
          criteria_scores: (grading.ai_feedback as any).criteria_scores || {},
          suggestions: (grading.ai_feedback as any).suggestions || []
        };
      }
      
      // 默认结构
      return {
        overall_feedback: grading.ai_feedback,
        detailed_feedback: grading.ai_detailed_feedback || [],
        criteria_scores: {},
        suggestions: []
      };
    } catch (error) {
      console.error('解析AI反馈失败:', error);
      // 如果解析失败，使用原始数据
      return {
        overall_feedback: grading.ai_feedback,
        detailed_feedback: grading.ai_detailed_feedback || [],
        criteria_scores: {},
        suggestions: []
      };
    }
  }, [grading.ai_feedback, grading.ai_detailed_feedback]);
  
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">AI 评分结果</h2>
              <p className="text-sm text-gray-500">智能评估与分析</p>
            </div>
          </div>
          <div className={cn("px-4 py-2 rounded-lg", scoreGrade.color, scoreGrade.bgColor)}>
            <span className="font-semibold">{scoreGrade.grade}</span>
          </div>
        </div>
        
        {/* 分数展示 */}
        <div className="text-center mb-6">
          <div className="flex items-end justify-center mb-4">
            <span className={cn("text-5xl font-bold", scoreGrade.color)}>
              {grading.final_score}
            </span>
            <span className="text-2xl text-gray-400 ml-2">/ {totalScore}</span>
          </div>
          <div className="max-w-xs mx-auto">
            <Progress 
              value={scorePercentage} 
              className="h-3 mb-3"
            />
            <p className="text-sm font-medium text-gray-600">
              得分率：{scorePercentage}%
            </p>
          </div>
        </div>
        
        {/* 总体反馈 */}
        {parsedFeedback.overall_feedback && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" />
              总体评价
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {parsedFeedback.overall_feedback}
            </p>
          </div>
        )}
        
        {/* 评分维度（如果有） */}
        {parsedFeedback.criteria_scores && Object.keys(parsedFeedback.criteria_scores).length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
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
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium mb-2 flex items-center gap-2 text-orange-800">
              <TrendingUp className="h-4 w-4" />
              改进建议
            </h3>
            <ul className="space-y-2">
              {parsedFeedback.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-orange-700">
                  <span className="block w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* 详细反馈（每道题） */}
      {parsedFeedback.detailed_feedback && parsedFeedback.detailed_feedback.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">各题详细反馈</h3>
                <p className="text-sm text-gray-500">逐题分析与建议</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {questions.map((question, index) => {
              const answer = answers.find(a => a.question_id === question.id);
              const feedback = parsedFeedback.detailed_feedback.find(
                (f: {question_id: string}) => f.question_id === question.id
              );
              const isExpanded = expandedQuestions.has(question.id);
              
              // 如果没有找到对应的反馈，创建一个默认反馈
              const actualFeedback = feedback || {
                question_id: question.id,
                score: 0,
                feedback: '暂无AI反馈，请重新进行评分',
                strengths: ['已完成答题'],
                improvements: ['建议重新进行AI评分']
              };
              
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
                          {actualFeedback.score}/{totalScore}分
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
                    <div className="p-4 space-y-4 border-t bg-gray-50">
                      {/* AI反馈 - 主要展示区域 */}
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <h4 className="font-medium text-gray-800">AI 评价反馈</h4>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {actualFeedback.feedback}
                        </p>
                      </div>
                      
                      {/* 亮点表现 */}
                      {actualFeedback.strengths && actualFeedback.strengths.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <h5 className="font-medium text-green-800">亮点表现</h5>
                          </div>
                          <ul className="space-y-2">
                            {actualFeedback.strengths.map((strength: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                                <span className="block w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                <span>{strength}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 改进建议 */}
                      {actualFeedback.improvements && actualFeedback.improvements.length > 0 && (
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <h5 className="font-medium text-orange-800">提升空间</h5>
                          </div>
                          <ul className="space-y-2">
                            {actualFeedback.improvements.map((improvement: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-orange-700">
                                <span className="block w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
};