import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { gradeSeriesQuestionnaire } from '@/services/aiService';
import { Loader2 } from 'lucide-react';

export default function TestSeriesAIGrading() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    overall_score: number;
    overall_feedback: string;
    detailed_feedback: Array<{
      question_id: string;
      score: number;
      feedback: string;
      strengths: string[];
      improvements: string[];
    }>;
    criteria_scores: Record<string, number>;
    suggestions: string[];
  } | null>(null);
  
  // 测试数据
  const testData = {
    questionnaire: {
      title: '光合作用知识测验',
      description: '测试学生对光合作用的理解',
      ai_grading_prompt: '请评估学生对光合作用概念的理解程度，重点关注其对过程、原理和重要性的认识',
      ai_grading_criteria: '1. 概念准确性（40%）2. 理解深度（30%）3. 表达清晰度（30%）',
      max_score: 100
    },
    questions: [
      {
        id: '1',
        title: '什么是光合作用？',
        content: '请简述光合作用的定义和基本过程。',
        required: true,
        word_limit: 200
      },
      {
        id: '2',
        title: '光合作用的重要性',
        content: '为什么光合作用对地球生命如此重要？请举例说明。',
        required: true,
        word_limit: 300
      }
    ],
    answers: [
      {
        question_id: '1',
        answer_text: '光合作用是植物利用阳光、水和二氧化碳制造有机物质的过程。在这个过程中，植物的叶绿体吸收光能，将二氧化碳和水转化为葡萄糖和氧气。',
        word_count: 45
      },
      {
        question_id: '2',
        answer_text: '光合作用对地球生命至关重要。首先，它是地球上几乎所有食物链的基础，植物通过光合作用产生的有机物质为其他生物提供能量。其次，光合作用释放氧气，维持大气中的氧气含量，使需氧生物能够生存。最后，光合作用吸收二氧化碳，有助于调节地球气候。',
        word_count: 89
      }
    ]
  };
  
  const runTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      toast.info('开始AI评分测试...');
      
      const gradingResult = await gradeSeriesQuestionnaire(testData);
      
      setResult(gradingResult);
      toast.success('AI评分完成！');
      
    } catch (error) {
      console.error('测试失败:', error);
      toast.error('AI评分测试失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">系列问答AI评分测试</h1>
      
      {/* 测试数据展示 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>测试数据</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">问答标题：{testData.questionnaire.title}</h3>
            <p className="text-sm text-gray-600 mb-2">评分标准：{testData.questionnaire.ai_grading_criteria}</p>
            <p className="text-sm text-gray-600">满分：{testData.questionnaire.max_score}分</p>
          </div>
          
          <div className="space-y-3">
            {testData.questions.map((question, index) => {
              const answer = testData.answers.find(a => a.question_id === question.id);
              return (
                <div key={question.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-1">问题 {index + 1}: {question.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{question.content}</p>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium mb-1">学生答案：</p>
                    <p className="text-sm">{answer?.answer_text}</p>
                    <p className="text-xs text-gray-500 mt-1">字数：{answer?.word_count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* 测试按钮 */}
      <div className="text-center mb-6">
        <Button 
          onClick={runTest} 
          disabled={testing}
          size="lg"
          className="min-w-[200px]"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在进行AI评分...
            </>
          ) : (
            '运行AI评分测试'
          )}
        </Button>
      </div>
      
      {/* 结果展示 */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>AI评分结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">总分：{result.overall_score} / {testData.questionnaire.max_score}</h3>
                <p className="text-sm">{result.overall_feedback}</p>
              </div>
              
              {result.criteria_scores && Object.keys(result.criteria_scores).length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">评分维度：</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                      <div key={criterion} className="bg-gray-50 p-2 rounded">
                        <span className="text-sm">{criterion}: </span>
                        <span className="font-medium">{score}分</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {result.detailed_feedback && result.detailed_feedback.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">详细反馈：</h4>
                  {result.detailed_feedback.map((feedback, index) => (
                    <div key={feedback.question_id} className="border rounded-lg p-3 mb-2">
                      <h5 className="font-medium text-sm mb-1">问题 {index + 1} - 得分：{feedback.score}分</h5>
                      <p className="text-sm text-gray-700 mb-2">{feedback.feedback}</p>
                      {feedback.strengths && feedback.strengths.length > 0 && (
                        <div className="text-sm">
                          <span className="text-green-600">优点：</span>
                          {feedback.strengths.join('、')}
                        </div>
                      )}
                      {feedback.improvements && feedback.improvements.length > 0 && (
                        <div className="text-sm">
                          <span className="text-yellow-600">改进：</span>
                          {feedback.improvements.join('、')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">改进建议：</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.suggestions.map((suggestion: string, index: number) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-gray-100 rounded">
                <h4 className="font-medium mb-2">原始JSON响应：</h4>
                <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}