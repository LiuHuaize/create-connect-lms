import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';

const SeriesQuestionnaireSubmissionTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string>('这是一个测试答案，用于验证系列问答提交功能是否正常工作。');

  // 使用真实的lesson ID进行测试
  const testLessonId = '398393d8-4914-4d95-8720-528fe54cd7dc';

  const testSubmitAnswers = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // 构造测试答案数据
      const testAnswers = [
        {
          question_id: 'test-question-1',
          answer_text: answers,
          word_count: answers.split(/\s+/).filter(word => word.length > 0).length
        }
      ];

      // 测试提交答案
      const response = await seriesQuestionnaireService.submitSeriesAnswers({
        questionnaire_id: testLessonId, // 使用lesson ID作为questionnaire_id
        answers: testAnswers,
        status: 'draft', // 先保存为草稿
        time_spent_minutes: 5
      });

      setResult(response);
    } catch (err: any) {
      setError(err.message || '提交失败');
      console.error('提交测试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const testGetStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // 测试获取提交状态
      const response = await seriesQuestionnaireService.getStudentSubmissionStatus(testLessonId);
      setResult(response);
    } catch (err: any) {
      setError(err.message || '获取状态失败');
      console.error('获取状态测试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const testGetQuestionnaire = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // 测试获取问答详情
      const response = await seriesQuestionnaireService.getSeriesQuestionnaire(testLessonId);
      setResult(response);
    } catch (err: any) {
      setError(err.message || '获取问答详情失败');
      console.error('获取问答详情测试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>系列问答提交功能测试</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            测试修复后的系列问答提交功能，使用lesson ID: {testLessonId}
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">测试答案内容:</label>
              <Textarea
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
                placeholder="输入测试答案..."
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={testGetQuestionnaire}
                disabled={loading}
                variant="outline"
              >
                {loading ? '测试中...' : '测试获取问答详情'}
              </Button>
              
              <Button 
                onClick={testGetStatus}
                disabled={loading}
                variant="outline"
              >
                {loading ? '测试中...' : '测试获取提交状态'}
              </Button>
              
              <Button 
                onClick={testSubmitAnswers}
                disabled={loading}
              >
                {loading ? '提交中...' : '测试提交答案'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>
            错误: {error}
          </AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeriesQuestionnaireSubmissionTest;
