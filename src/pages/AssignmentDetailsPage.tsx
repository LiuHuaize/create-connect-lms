import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, FileText, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssignmentSubmissionViewer } from '@/components/course/AssignmentSubmissionViewer';

// 模拟作业数据类型
interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  lessonId: string;
  courseName: string;
  lessonTitle: string;
  dueDate?: string;
  submissionCount: number;
  maxScore: number;
  status: 'active' | 'closed' | 'draft';
}

// 模拟API调用
const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockAssignment: Assignment = {
        id: assignmentId,
        title: '商业计划书作业',
        description: '请根据课程内容，撰写一份完整的商业计划书，包括市场分析、商业模式、团队介绍等关键部分。',
        courseId: 'course123',
        lessonId: 'lesson456',
        courseName: '创业基础',
        lessonTitle: '商业计划书写作',
        dueDate: '2024-01-20T23:59:59Z',
        submissionCount: 15,
        maxScore: 100,
        status: 'active'
      };
      resolve(mockAssignment);
    }, 1000);
  });
};

const AssignmentDetailsPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'submissions'>('details');

  useEffect(() => {
    if (!assignmentId) {
      setError('作业ID不能为空');
      setIsLoading(false);
      return;
    }

    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await getAssignmentById(assignmentId!);
      
      if (data) {
        setAssignment(data);
      } else {
        setError('未找到该作业');
      }
    } catch (err) {
      console.error('加载作业详情失败:', err);
      setError('加载作业详情失败，请稍后重试');
      toast({
        title: '加载失败',
        description: '无法加载作业详情，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载作业详情中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">作业不存在</h2>
          <p className="text-gray-600 mb-4 text-center">
            {error || '未找到指定的作业，可能已被删除或您没有查看权限'}
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
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
            {assignment.status === 'active' ? '进行中' : '已结束'}
          </Badge>
        </div>
        <p className="text-gray-600">
          {assignment.courseName} - {assignment.lessonTitle}
        </p>
      </div>

      {/* 标签切换 */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'details' ? 'default' : 'outline'}
            onClick={() => setActiveTab('details')}
          >
            作业详情
          </Button>
          <Button
            variant={activeTab === 'submissions' ? 'default' : 'outline'}
            onClick={() => setActiveTab('submissions')}
          >
            学生提交
          </Button>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="grid gap-6">
          {/* 作业基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>作业信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">作业要求</h4>
                <p className="text-gray-600">{assignment.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">截止时间</p>
                    <p className="font-medium">
                      {assignment.dueDate ? formatDate(assignment.dueDate) : '无限制'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">提交数量</p>
                    <p className="font-medium">{assignment.submissionCount} 份</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">满分</p>
                    <p className="font-medium">{assignment.maxScore} 分</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <AssignmentSubmissionViewer
              lessonId={assignment.lessonId}
              onBack={handleBack}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetailsPage;