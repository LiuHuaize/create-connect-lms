import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssignmentLessonContent as AssignmentContent, AssignmentSubmission, AssignmentFileSubmission, AIGradingResult } from '@/types/course';
import { AssignmentFileUploader } from '@/components/course/learning/AssignmentFileUploader';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Upload, CheckCircle, Star, BookOpen, Award, Rocket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { isValidUUID } from '@/utils/validators';

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      delayChildren: 0.3,
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

// 从数据库获取的提交数据类型
type SubmissionData = {
  id: string;
  student_id: string;
  lesson_id: string;
  content: string;
  submitted_at: string | null;
  file_submissions: AssignmentFileSubmission[] | null;
  teacher_grading: {
    score: number;
    feedback: string;
    timestamp: string;
  } | null;
  ai_grading: AIGradingResult | null;
};

// 组件内部使用的提交类型
type InternalAssignmentSubmission = {
  id: string;
  studentId: string;
  lessonId: string;
  content: string;
  submittedAt: string | null;
  fileSubmissions: AssignmentFileSubmission[];
  teacherGrading?: {
    score: number;
    feedback: string;
    timestamp: string;
  };
  aiGrading?: AIGradingResult;
};

interface AssignmentLessonContentProps {
  lessonId: string;
  content: AssignmentContent;
  userId: string;
  onComplete?: (data: { submittedAt: string }) => void;
  isCompleted?: boolean;
}

export function AssignmentLessonContent({
  lessonId,
  content,
  userId,
  onComplete,
  isCompleted = false
}: AssignmentLessonContentProps) {
  const { toast } = useToast();
  
  // 验证userId和lessonId
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 检查ID是否有效
  useEffect(() => {
    if (!userId || userId === '') {
      setValidationError('用户ID无效，请尝试重新登录');
      return;
    }
    
    if (!lessonId || lessonId === '') {
      setValidationError('课时ID无效，请尝试刷新页面');
      return;
    }
    
    if (!isValidUUID(userId)) {
      setValidationError('用户ID格式无效，请尝试重新登录');
      return;
    }
    
    if (!isValidUUID(lessonId)) {
      setValidationError('课时ID格式无效，请尝试刷新页面');
      return;
    }
    
    setValidationError(null);
  }, [userId, lessonId]);
  
  // 作业提交状态
  const [fileSubmissions, setFileSubmissions] = useState<AssignmentFileSubmission[]>([]);
  const [submission, setSubmission] = useState<InternalAssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 加载已有提交内容
  useEffect(() => {
    const loadSubmission = async () => {
      if (!userId || !lessonId || validationError) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('assignment_submissions')
          .select('*')
          .eq('student_id', userId)
          .eq('lesson_id', lessonId)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误
          throw error;
        }
        
        if (data) {
          // 安全地处理数据类型
          const submissionData = data as unknown as SubmissionData;
          
          setSubmission({
            id: submissionData.id,
            studentId: submissionData.student_id,
            lessonId: submissionData.lesson_id,
            content: submissionData.content || '',
            submittedAt: submissionData.submitted_at,
            fileSubmissions: submissionData.file_submissions || [],
            teacherGrading: submissionData.teacher_grading || undefined,
            aiGrading: submissionData.ai_grading || undefined
          });
          
          setFileSubmissions(submissionData.file_submissions || []);
        }
      } catch (err) {
        console.error('加载作业提交时出错:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSubmission();
  }, [userId, lessonId, validationError]);
  
  // 保存草稿
  const handleSaveDraft = async () => {
    if (validationError) {
      toast({
        title: '保存失败',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (submission) {
        // 更新已有提交
        const { error } = await supabase
          .from('assignment_submissions')
          .update({
            file_submissions: fileSubmissions,
            updated_at: new Date().toISOString()
          })
          .eq('id', submission.id);
        
        if (error) throw error;
      } else {
        // 创建新提交
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({
            lesson_id: lessonId,
            student_id: userId,
            content: JSON.stringify({}), // 确保content是有效的JSON字符串
            file_submissions: fileSubmissions,
            status: 'draft',
            submitted_at: null
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          // 安全地处理数据类型
          const submissionData = data as unknown as SubmissionData;
          
          setSubmission({
            id: submissionData.id,
            studentId: submissionData.student_id,
            lessonId: submissionData.lesson_id,
            content: '',
            submittedAt: submissionData.submitted_at,
            fileSubmissions: submissionData.file_submissions || [],
            teacherGrading: submissionData.teacher_grading || undefined,
            aiGrading: submissionData.ai_grading || undefined
          });
        }
      }
      
      toast({
        title: '保存成功',
        description: '作业草稿已保存'
      });
    } catch (err) {
      console.error('保存草稿时出错:', err);
      toast({
        title: '保存失败',
        description: '无法保存作业草稿',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // 提交作业
  const handleSubmitAssignment = async () => {
    if (validationError) {
      toast({
        title: '提交失败',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }
    
    if (fileSubmissions.length === 0) {
      toast({
        title: '提交失败',
        description: '请先上传至少一个文件',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const now = new Date().toISOString();
      
      if (submission) {
        // 更新已有提交
        const { error } = await supabase
          .from('assignment_submissions')
          .update({
            file_submissions: fileSubmissions,
            status: 'submitted',
            submitted_at: now,
            updated_at: now
          })
          .eq('id', submission.id);
        
        if (error) throw error;
        
        // 更新本地状态
        setSubmission({
          ...submission,
          content: '',
          submittedAt: now,
          fileSubmissions: fileSubmissions
        });
      } else {
        // 创建新提交
        const { data, error } = await supabase
          .from('assignment_submissions')
          .insert({
            lesson_id: lessonId,
            student_id: userId,
            content: JSON.stringify({}), // 确保content是有效的JSON字符串
            file_submissions: fileSubmissions,
            status: 'submitted',
            submitted_at: now
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          // 安全地处理数据类型
          const submissionData = data as unknown as SubmissionData;
          
          setSubmission({
            id: submissionData.id,
            studentId: submissionData.student_id,
            lessonId: submissionData.lesson_id,
            content: '',
            submittedAt: now,
            fileSubmissions: submissionData.file_submissions || [],
            teacherGrading: submissionData.teacher_grading || undefined,
            aiGrading: submissionData.ai_grading || undefined
          });
        }
      }
      
      toast({
        title: '太棒了！🎉',
        description: '你的作业已成功提交！老师很快会查看哦。'
      });
      
      // 如果有完成回调，则调用
      if (onComplete) {
        onComplete({
          submittedAt: now
        });
      }
    } catch (err) {
      console.error('提交作业时出错:', err);
      toast({
        title: '提交失败',
        description: '无法提交作业，请稍后重试',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 处理文件上传
  const handleFileUploaded = (file: AssignmentFileSubmission) => {
    setFileSubmissions(prev => [...prev, file]);
    
    // 如果有草稿，自动保存
    if (submission) {
      handleSaveDraft();
    }
    
    toast({
      title: '上传成功！👍',
      description: `文件 ${file.fileName} 已上传成功！`
    });
  };
  
  // 处理文件删除
  const handleFileDeleted = (fileId: string) => {
    setFileSubmissions(prev => prev.filter(file => file.id !== fileId));
    
    // 如果有草稿，自动保存
    if (submission) {
      handleSaveDraft();
    }
    
    toast({
      title: '文件已删除',
      description: '文件已从提交中移除'
    });
  };
  
  // 判断是否已提交
  const hasSubmitted = submission?.submittedAt != null;
  
  // 渲染提交状态
  const renderSubmissionStatus = () => {
    if (!hasSubmitted) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <CheckCircle className="text-green-500" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              作业已提交成功！
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            </h3>
            <p className="text-sm text-gray-600">
              提交时间: {new Date(submission.submittedAt || '').toLocaleString()}
              （{formatDistanceToNow(new Date(submission.submittedAt || ''), { addSuffix: true, locale: zhCN })}）
            </p>
          </div>
        </div>
        
        {(submission.teacherGrading || submission.aiGrading) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-2 flex items-center gap-2 text-gray-700">
              <Award className="h-4 w-4" />
              评分结果
            </h4>
            <div className="bg-white rounded-lg p-4 shadow-inner">
              {submission.teacherGrading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      <span className="text-gray-600">老师评分：</span>
                      <span className="font-medium text-gray-800 text-lg">{submission.teacherGrading.score}</span>
                      <span className="text-gray-400 text-xs ml-1">分</span>
                    </p>
                  </div>
                  {submission.teacherGrading.feedback && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">老师评语：</h5>
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {submission.teacherGrading.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {submission.aiGrading && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-gray-500" />
                    <p className="text-sm">
                      <span className="text-gray-600">AI评分：</span>
                      <span className="font-medium text-gray-800 text-lg">{submission.aiGrading.score}</span>
                      <span className="text-gray-400 text-xs ml-1">分</span>
                    </p>
                  </div>
                  {submission.aiGrading.feedback && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">AI评语：</h5>
                      <div className="text-sm text-gray-700 whitespace-pre-line">
                        {submission.aiGrading.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };
  
  // 渲染验证错误
  const renderValidationError = () => {
    if (!validationError) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
      >
        <div className="flex items-start gap-2">
          <div className="shrink-0 w-5 h-5 mt-0.5 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">无法加载作业提交功能</h4>
            <p className="text-sm mt-1">{validationError}</p>
          </div>
        </div>
      </motion.div>
    );
  };
  
  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">加载中...</span>
      </div>
    );
  }
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* 验证错误 */}
      {renderValidationError()}
      
      {/* 作业说明 */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 overflow-hidden shadow-md bg-card">
          <CardHeader className="bg-muted text-foreground border-b">
            <div className="flex items-center gap-3">
              <BookOpen size={24} />
              <div>
                <CardTitle className="text-xl">作业要求</CardTitle>
                <CardDescription>
                  请仔细阅读下面的要求，按照说明上传你的作业哦！
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: content.instructions }} />
            </div>
            
            {content.criteria && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-md font-medium mb-2 flex items-center gap-2 text-gray-700">
                    <Award className="h-5 w-5 text-gray-500" />
                    评分标准
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert bg-muted/30 p-4 rounded-lg">
                    <div dangerouslySetInnerHTML={{ __html: content.criteria }} />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
      
      {/* 提交状态 */}
      {renderSubmissionStatus()}
      
      {/* 作业提交区域 */}
      {!validationError && (
        <motion.div variants={itemVariants}>
          <Card className="border-0 overflow-hidden shadow-md bg-card">
            <CardHeader className="bg-muted text-foreground border-b">
              <div className="flex items-center gap-3">
                <Upload size={24} />
                <div>
                  <CardTitle className="text-xl">作业提交</CardTitle>
                  <CardDescription>
                    在这里上传你的作业文件，准备好后点击提交按钮
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="min-h-[250px]">
                <AssignmentFileUploader
                  lessonId={lessonId}
                  studentId={userId}
                  onFileUploaded={handleFileUploaded}
                  onFileDeleted={handleFileDeleted}
                  files={fileSubmissions}
                  disabled={hasSubmitted || isCompleted || !!validationError}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-muted/20 p-6">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isSubmitting || hasSubmitted || isCompleted || !!validationError}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在保存...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存草稿
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleSubmitAssignment}
                disabled={isSubmitting || isSaving || hasSubmitted || isCompleted || fileSubmissions.length === 0 || !!validationError}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在提交...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    提交作业
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
} 