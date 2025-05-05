import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
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
  Bot,
  Download,
  Paperclip
} from 'lucide-react';
import { AIGradingResult, AssignmentSubmission, AssignmentFileSubmission } from '@/types/course';
import { Badge } from './badge';
import { supabase } from '@/integrations/supabase/client';
import { submitTeacherGrading } from '@/services/assignmentService';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';

interface AssignmentGradingProps {
  submission: AssignmentSubmission;
  aiGradingPrompt?: string;
  onTeacherGradingSubmit: (score: number, feedback: string) => void;
  onRequestAIGrading: () => void;
  isAIGradingLoading?: boolean;
  onSubmissionUpdated?: (updatedSubmission: AssignmentSubmission) => void;
}

const AssignmentGrading: React.FC<AssignmentGradingProps> = ({
  submission,
  aiGradingPrompt,
  onTeacherGradingSubmit,
  onRequestAIGrading,
  isAIGradingLoading = false,
  onSubmissionUpdated
}) => {
  const { toast } = useToast();
  const [teacherScore, setTeacherScore] = useState<number>(
    submission.teacherGrading?.score || 0
  );
  const [teacherFeedback, setTeacherFeedback] = useState<string>(
    submission.teacherGrading?.feedback || ''
  );
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  
  // 处理教师评分提交
  const handleTeacherGradingSubmit = async () => {
    try {
      setIsSubmittingGrade(true);
      
      // 调用API提交评分
      const grading = {
        score: teacherScore,
        feedback: teacherFeedback,
        timestamp: new Date().toISOString()
      };
      
      const updatedSubmission = await submitTeacherGrading(submission.id, grading);
      
      // 通知父组件评分已更新
      if (onSubmissionUpdated) {
        onSubmissionUpdated({
          ...submission,
          teacherGrading: grading
        });
      }
      
      // 调用原有的回调
      onTeacherGradingSubmit(teacherScore, teacherFeedback);
      
      toast({
        title: '评分成功',
        description: '你的评分已成功保存',
        variant: 'default',
      });
    } catch (error) {
      console.error('提交评分失败:', error);
      toast({
        title: '评分失败',
        description: '保存评分时出现错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingGrade(false);
    }
  };
  
  // 根据分数返回颜色类名
  const getScoreColorClass = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 下载文件
  const handleDownloadFile = async (file: AssignmentFileSubmission) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .download(file.filePath);
      
      if (error) {
        console.error('下载文件错误:', error);
        return;
      }
      
      // 创建下载链接
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('下载文件出错:', err);
    }
  };
  
  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    return '📎';
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="space-y-6">
      {/* 学生信息和提交时间 */}
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium">学生ID: {submission.studentId}</h3>
            <p className="text-sm text-gray-500">提交时间: {new Date(submission.submittedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-2">
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
          {submission.fileSubmissions && submission.fileSubmissions.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Paperclip size={12} className="mr-1" />
              {submission.fileSubmissions.length} 个文件
            </span>
          )}
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="content">
            <FileText className="h-4 w-4 mr-2" />
            提交内容
          </TabsTrigger>
          <TabsTrigger value="files" disabled={!submission.fileSubmissions || submission.fileSubmissions.length === 0}>
            <Paperclip className="h-4 w-4 mr-2" />
            文件
            {submission.fileSubmissions && submission.fileSubmissions.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {submission.fileSubmissions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-0">
          {/* 学生提交内容 */}
          <div>
            <h3 className="text-lg font-medium flex items-center mb-3">
              <FileText size={18} className="mr-2 text-gray-500" />
              提交内容
            </h3>
            <Card className="p-4 bg-gray-50">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: submission.content }} />
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="files" className="mt-0">
          {/* 学生提交的文件 */}
          <div>
            <h3 className="text-lg font-medium flex items-center mb-3">
              <Paperclip size={18} className="mr-2 text-gray-500" />
              提交的文件
            </h3>
            <div className="space-y-2">
              {submission.fileSubmissions && submission.fileSubmissions.length > 0 ? (
                submission.fileSubmissions.map((file) => (
                  <Card key={file.id} className="overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {getFileIcon(file.fileType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" title={file.fileName}>
                              {file.fileName}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(file.fileSize)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(file.uploadedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadFile(file)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <Paperclip size={24} className="text-gray-400 mb-2" />
                  <p className="text-gray-500">学生没有提交任何文件</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      {/* 评分区域 */}
      <div className="space-y-4">
        <Tabs defaultValue="teacher">
          <TabsList>
            <TabsTrigger value="teacher">教师评分</TabsTrigger>
            <TabsTrigger value="ai" disabled={!submission.aiGrading && !aiGradingPrompt}>
              AI评分
              {isAIGradingLoading && <RefreshCw size={14} className="ml-2 animate-spin" />}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="teacher" className="space-y-4 pt-4">
            {submission.teacherGrading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium">教师评分</h3>
                  <span className={`text-lg font-bold ${getScoreColorClass(submission.teacherGrading.score)}`}>
                    {submission.teacherGrading.score}
                  </span>
                </div>
                
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <p>{submission.teacherGrading.feedback}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Button onClick={() => {
                  setTeacherScore(submission.teacherGrading.score);
                  setTeacherFeedback(submission.teacherGrading.feedback);
                }}>
                  修改评分
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="teacher-score">分数</Label>
                  <span className={`text-lg font-bold ${getScoreColorClass(teacherScore)}`}>
                    {teacherScore}
                  </span>
                </div>
                
                <Input
                  id="teacher-score"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={teacherScore}
                  onChange={(e) => setTeacherScore(parseInt(e.target.value))}
                  className="w-full"
                />
                
                <div className="grid grid-cols-5 text-center text-xs text-gray-500">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
                
                <div>
                  <Label htmlFor="teacher-feedback">评语</Label>
                  <Textarea
                    id="teacher-feedback"
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    placeholder="输入对学生作业的评语和反馈..."
                    className="min-h-32 mt-2"
                  />
                </div>
                
                <Button 
                  onClick={handleTeacherGradingSubmit} 
                  className="w-full"
                  disabled={isSubmittingGrade}
                >
                  {isSubmittingGrade ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      提交中...
                    </>
                  ) : '提交评分'}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4 pt-4">
            {submission.aiGrading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium flex items-center">
                    <Bot size={16} className="mr-2 text-blue-500" />
                    AI评分
                  </h3>
                  <span className={`text-lg font-bold ${getScoreColorClass(submission.aiGrading.score)}`}>
                    {submission.aiGrading.score}
                  </span>
                </div>
                
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="prose prose-sm max-w-none">
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {submission.aiGrading.feedback}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => {
                      // 使用AI评分作为教师评分的起点
                      setTeacherScore(submission.aiGrading!.score);
                      setTeacherFeedback(submission.aiGrading!.feedback);
                    }}
                  >
                    <ThumbsUp size={14} className="mr-2" />
                    使用AI评分
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRequestAIGrading}
                    disabled={isAIGradingLoading}
                  >
                    <RefreshCw size={14} className={`mr-2 ${isAIGradingLoading ? 'animate-spin' : ''}`} />
                    重新评分
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
                  <Bot size={32} className="text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">AI尚未评分</h3>
                  <p className="text-sm text-gray-500 text-center mb-4">
                    使用AI来自动评分，它将根据提交的内容给出评分和反馈。
                  </p>
                  
                  <Button onClick={onRequestAIGrading} disabled={isAIGradingLoading}>
                    {isAIGradingLoading ? (
                      <>
                        <RefreshCw size={16} className="mr-2 animate-spin" />
                        AI评分中...
                      </>
                    ) : (
                      <>
                        <Bot size={16} className="mr-2" />
                        开始AI评分
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AssignmentGrading; 