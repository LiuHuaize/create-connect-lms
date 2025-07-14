import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AssignmentSubmissionViewer } from '@/components/course/AssignmentSubmissionViewer';
import { AssignmentSubmission } from '@/types/course';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 这里应该导入真实的服务，但目前使用模拟数据
const getSubmissionById = async (submissionId: string): Promise<AssignmentSubmission | null> => {
  // 模拟API调用
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟返回提交数据
      const mockSubmission: AssignmentSubmission = {
        id: submissionId,
        studentId: 'student123',
        lessonId: 'lesson456',
        content: '<h1>学生提交的作业内容</h1><p>这是学生提交的详细内容...</p>',
        submittedAt: new Date().toISOString(),
        profiles: {
          username: '张同学'
        }
      };
      resolve(mockSubmission);
    }, 1000);
  });
};

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId) {
      setError('提交ID不能为空');
      setIsLoading(false);
      return;
    }

    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getSubmissionById(submissionId!);
      
      if (data) {
        setSubmission(data);
      } else {
        setError('未找到该提交记录');
      }
    } catch (err) {
      console.error('加载提交详情失败:', err);
      setError('加载提交详情失败，请稍后重试');
      toast({
        title: '加载失败',
        description: '无法加载提交详情，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1); // 返回上一页
  };

  const handleSubmissionUpdated = (updatedSubmission: AssignmentSubmission) => {
    setSubmission(updatedSubmission);
    toast({
      title: '更新成功',
      description: '提交信息已更新',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载提交详情中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-lg border">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">提交不存在</h2>
          <p className="text-gray-600 mb-4 text-center">
            {error || '未找到指定的提交记录，可能已被删除或您没有查看权限'}
          </p>
          <Button onClick={handleBack}>
            返回上一页
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">作业提交详情</h1>
        </div>
        <p className="text-gray-600">
          查看学生提交的作业内容，进行评分和反馈
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <AssignmentSubmissionViewer
            initialSubmission={submission}
            onBack={handleBack}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;