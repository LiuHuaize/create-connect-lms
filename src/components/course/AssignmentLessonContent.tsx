import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AssignmentLessonContent as AssignmentContent, AssignmentSubmission, AssignmentFileSubmission } from '@/types/course';
import { AssignmentFileUploader } from '@/components/course/learning/AssignmentFileUploader';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Upload, CheckCircle, Star, BookOpen, Award, Rocket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      delayChildren: 0.2,
      staggerChildren: 0.1
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

interface AssignmentLessonContentProps {
  lessonId: string;
  content: AssignmentContent;
  userId: string;
  onComplete?: (data?: any) => void;
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
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [fileSubmissions, setFileSubmissions] = useState<AssignmentFileSubmission[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 加载已有的提交
  useEffect(() => {
    loadSubmission();
  }, [lessonId, userId]);
  
  // 加载提交内容
  const loadSubmission = async () => {
    try {
      // 查询学生的提交记录
      const { data, error } = await supabase
        .from('assignment_submissions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误
        console.error('加载提交时出错:', error);
        toast({
          title: '加载失败',
          description: '无法加载已有的提交内容',
          variant: 'destructive'
        });
        return;
      }
      
      if (data) {
        const fileSubmissions = data.file_submissions || [];
        
        // 设置提交内容
        setSubmission({
          id: data.id,
          studentId: data.student_id,
          lessonId: data.lesson_id,
          content: '',
          submittedAt: data.submitted_at,
          fileSubmissions: fileSubmissions,
          teacherGrading: data.teacher_grading,
          aiGrading: data.ai_grading
        });
        
        setFileSubmissions(fileSubmissions);
      }
    } catch (err) {
      console.error('加载提交时出错:', err);
      toast({
        title: '加载失败',
        description: '无法加载已有的提交内容',
        variant: 'destructive'
      });
    }
  };
  
  // 保存草稿
  const handleSaveDraft = async () => {
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
            content: {},
            file_submissions: fileSubmissions,
            status: 'draft',
            submitted_at: null
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSubmission({
            id: data.id,
            studentId: data.student_id,
            lessonId: data.lesson_id,
            content: '',
            submittedAt: data.submitted_at,
            fileSubmissions: fileSubmissions
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
            content: {},
            file_submissions: fileSubmissions,
            status: 'submitted',
            submitted_at: now
          })
          .select()
          .single();
        
        if (error) throw error;
        
        if (data) {
          setSubmission({
            id: data.id,
            studentId: data.student_id,
            lessonId: data.lesson_id,
            content: '',
            submittedAt: now,
            fileSubmissions: fileSubmissions
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
              提交时间: {new Date(submission.submittedAt).toLocaleString()}
              （{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true, locale: zhCN })}）
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
  
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
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
                disabled={hasSubmitted || isCompleted}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between bg-muted/20 p-6">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting || hasSubmitted || isCompleted}
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
              disabled={isSubmitting || isSaving || hasSubmitted || isCompleted || fileSubmissions.length === 0}
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
    </motion.div>
  );
} 