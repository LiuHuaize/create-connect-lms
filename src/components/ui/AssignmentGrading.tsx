import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  BarChart,
  User,
  FileText,
  Bot
} from 'lucide-react';
import { AIGradingResult, AssignmentSubmission } from '@/types/course';

interface AssignmentGradingProps {
  submission: AssignmentSubmission;
  aiGradingPrompt?: string;
  onTeacherGradingSubmit: (score: number, feedback: string) => void;
  onRequestAIGrading: () => void;
  isAIGradingLoading?: boolean;
}

const AssignmentGrading: React.FC<AssignmentGradingProps> = ({
  submission,
  aiGradingPrompt,
  onTeacherGradingSubmit,
  onRequestAIGrading,
  isAIGradingLoading = false
}) => {
  const [teacherScore, setTeacherScore] = useState<number>(
    submission.teacherGrading?.score || 0
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    submission.teacherGrading?.feedback || ''
  );
  
  // 处理教师评分提交
  const handleTeacherGradingSubmit = () => {
    onTeacherGradingSubmit(teacherScore, teacherFeedback);
  };
  
  // 根据分数返回颜色类名
  const getScoreColorClass = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <div className="space-y-6">
      {/* 学生信息和提交时间 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium">学生ID: {submission.studentId}</h3>
            <p className="text-sm text-gray-500">提交时间: {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {submission.teacherGrading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={12} className="mr-1" />
              已评分
            </span>
          )}
          {submission.aiGrading && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Bot size={12} className="mr-1" />
              AI已评分
            </span>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* 学生提交内容 */}
      <div>
        <h3 className="text-lg font-medium flex items-center mb-3">
          <FileText size={18} className="mr-2 text-gray-500" />
          提交内容
        </h3>
        <Card className="p-4 bg-gray-50">
          <div dangerouslySetInnerHTML={{ __html: submission.content }} />
        </Card>
      </div>
      
      <Tabs defaultValue="ai-grading" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai-grading" className="flex items-center">
            <Bot size={16} className="mr-2" />
            AI评分
          </TabsTrigger>
          <TabsTrigger value="teacher-grading" className="flex items-center">
            <User size={16} className="mr-2" />
            教师评分
          </TabsTrigger>
        </TabsList>
        
        {/* AI评分内容 */}
        <TabsContent value="ai-grading" className="space-y-4 pt-4">
          {!submission.aiGrading && !isAIGradingLoading && (
            <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg">
              <Bot size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">此作业尚未进行AI评分</p>
              <Button 
                onClick={onRequestAIGrading} 
                className="bg-connect-blue hover:bg-blue-600"
              >
                请求AI评分
              </Button>
              
              {aiGradingPrompt && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">AI评分提示:</p>
                  <p className="text-sm text-gray-600">{aiGradingPrompt}</p>
                </div>
              )}
            </div>
          )}
          
          {isAIGradingLoading && (
            <div className="text-center p-8 border border-dashed border-gray-200 rounded-lg">
              <RefreshCw size={40} className="mx-auto text-blue-400 mb-3 animate-spin" />
              <p className="text-gray-600">AI正在评分中，请稍候...</p>
            </div>
          )}
          
          {submission.aiGrading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${getScoreColorClass(submission.aiGrading.score)}`}>
                      {submission.aiGrading.score}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">AI评分结果</h4>
                    <p className="text-sm text-gray-500">
                      评分时间: {new Date(submission.aiGrading.timestamp).toLocaleString()}
                    </p>
                    
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" className="h-8">
                        <ThumbsUp size={14} className="mr-1" />
                        有帮助
                      </Button>
                      <Button variant="outline" size="sm" className="h-8">
                        <ThumbsDown size={14} className="mr-1" />
                        需改进
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onRequestAIGrading}
                  disabled={isAIGradingLoading}
                >
                  <RefreshCw size={14} className={`mr-1 ${isAIGradingLoading ? 'animate-spin' : ''}`} />
                  重新评分
                </Button>
              </div>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-2">AI评语:</h4>
                <div className="text-sm whitespace-pre-line">
                  {submission.aiGrading.feedback}
                </div>
              </Card>
              
              {aiGradingPrompt && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-xs text-gray-500 mb-1">使用的评分提示:</p>
                  <p className="text-xs text-gray-600">{aiGradingPrompt}</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* 教师评分内容 */}
        <TabsContent value="teacher-grading" className="space-y-4 pt-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分数 (0-100)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={teacherScore}
                onChange={(e) => setTeacherScore(Number(e.target.value))}
                className="text-lg font-medium"
              />
              
              {submission.aiGrading && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Info size={14} className="mr-1" />
                  AI评分: {submission.aiGrading.score}
                </div>
              )}
            </div>
            
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                评语
              </label>
              <Textarea
                value={teacherFeedback}
                onChange={(e) => setTeacherFeedback(e.target.value)}
                placeholder="提供您对学生作业的评语和建议..."
                rows={6}
              />
              
              {submission.aiGrading?.feedback && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setTeacherFeedback(submission.aiGrading?.feedback || '')}
                  >
                    <Bot size={14} className="mr-1" />
                    使用AI评语
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {submission.teacherGrading && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5" />
              <div>
                <p className="text-sm text-green-700 font-medium">已评分</p>
                <p className="text-xs text-green-600">
                  您已于 {new Date(submission.teacherGrading.timestamp).toLocaleString()} 完成评分
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleTeacherGradingSubmit}
              className="bg-connect-blue hover:bg-blue-600"
            >
              {submission.teacherGrading ? '更新评分' : '提交评分'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 分数差异警告 */}
      {submission.aiGrading && submission.teacherGrading && 
        Math.abs(submission.aiGrading.score - submission.teacherGrading.score) > 15 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-500 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700 font-medium">AI评分与教师评分差异较大</p>
            <p className="text-xs text-yellow-600">
              AI评分为 {submission.aiGrading.score}，教师评分为 {submission.teacherGrading.score}，
              差异为 {Math.abs(submission.aiGrading.score - submission.teacherGrading.score)} 分。
              您可能需要检查评分标准的一致性。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentGrading; 