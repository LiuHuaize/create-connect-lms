import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  BarChart4,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  Bot
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AssignmentSubmissionViewer } from '@/components/course/AssignmentSubmissionViewer';
import { getSubmissionsByCourseId, getSubmissionsByLessonId } from '@/services/assignmentService';
import { AssignmentSubmission } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';

export default function CourseAssignmentsPage() {
  const router = useRouter();
  const { courseId } = router.query;
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'graded' | 'ungraded'>('all');
  
  // 加载提交列表
  useEffect(() => {
    if (courseId) {
      loadSubmissions();
    }
  }, [courseId, selectedLesson]);
  
  // 加载提交
  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      
      let data;
      if (selectedLesson) {
        // 获取特定课时的提交
        data = await getSubmissionsByLessonId(selectedLesson);
      } else if (courseId) {
        // 获取整个课程的提交
        data = await getSubmissionsByCourseId(courseId as string);
      }
      
      setSubmissions(data || []);
    } catch (error) {
      console.error('加载提交列表失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载学生提交的作业',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理提交更新
  const handleSubmissionUpdated = (updatedSubmission: AssignmentSubmission) => {
    // 更新本地提交列表
    setSubmissions(prevSubmissions => 
      prevSubmissions.map(sub => 
        sub.id === updatedSubmission.id ? { ...sub, teacher_grading: updatedSubmission.teacherGrading } : sub
      )
    );
  };
  
  // 过滤提交
  const filteredSubmissions = submissions
    .filter(sub => {
      // 搜索筛选
      const studentName = sub.profiles?.username || sub.student_id;
      const lessonTitle = sub.lessons?.title || sub.lesson_id;
      const matchesSearch = 
        searchQuery === '' || 
        studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 状态筛选
      let matchesStatus = true;
      if (filterStatus === 'graded') {
        matchesStatus = !!sub.teacher_grading;
      } else if (filterStatus === 'ungraded') {
        matchesStatus = !sub.teacher_grading;
      }
      
      return matchesSearch && matchesStatus;
    });
  
  // 渲染提交列表
  const renderSubmissionsList = () => {
    if (isLoading) {
      return (
        <div className="p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      );
    }
    
    if (submissions.length === 0) {
      return (
        <div className="p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">没有找到作业提交</h3>
          <p className="text-gray-500">当学生提交作业后，它们将显示在这里</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* 过滤和搜索 */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索学生或课时..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              全部
            </Button>
            <Button
              variant={filterStatus === 'graded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('graded')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              已评分
            </Button>
            <Button
              variant={filterStatus === 'ungraded' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ungraded')}
            >
              <Clock className="mr-1 h-4 w-4" />
              未评分
            </Button>
          </div>
        </div>
        
        {/* 提交列表 */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  学生
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  课时
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  评分
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr 
                  key={submission.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedSubmission(submission.id);
                    setViewMode('detail');
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {(submission.profiles?.username || submission.student_id || '').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.profiles?.username || submission.student_id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {submission.student_id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{submission.lessons?.title || submission.lesson_id}</div>
                    <div className="text-xs text-gray-500">
                      {submission.lessons?.modules?.title || '未知模块'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.submitted_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.teacher_grading ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        已评分
                      </Badge>
                    ) : submission.ai_grading ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <Bot className="h-3.5 w-3.5 mr-1" />
                        AI已评分
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        待评分
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {submission.teacher_grading ? (
                      <span className="font-medium">
                        {submission.teacher_grading.score}
                      </span>
                    ) : submission.ai_grading ? (
                      <span className="text-gray-500">
                        AI: {submission.ai_grading.score}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(submission.id);
                        setViewMode('detail');
                      }}
                    >
                      查看详情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // 查找选中的提交
  const selectedSubmissionData = submissions.find(sub => sub.id === selectedSubmission);
  
  // 将API数据格式转换为组件需要的格式
  const formatSubmissionForViewer = (submission: any): AssignmentSubmission => {
    return {
      id: submission.id,
      studentId: submission.student_id,
      lessonId: submission.lesson_id,
      content: submission.content || '',
      submittedAt: submission.submitted_at,
      fileSubmissions: submission.file_submissions || [],
      teacherGrading: submission.teacher_grading,
      aiGrading: submission.ai_grading,
      profiles: submission.profiles
    };
  };
  
  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">课程作业管理</h1>
          
          {viewMode === 'detail' && (
            <Button
              variant="outline"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          )}
        </div>
        
        {viewMode === 'list' ? (
          renderSubmissionsList()
        ) : selectedSubmissionData ? (
          <AssignmentSubmissionViewer
            lessonId={selectedSubmissionData.lesson_id}
            aiGradingPrompt={selectedSubmissionData.lessons?.content?.ai_grading_prompt}
            onBack={() => setViewMode('list')}
            initialSubmission={formatSubmissionForViewer(selectedSubmissionData)}
            onSubmissionUpdated={handleSubmissionUpdated}
          />
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">找不到提交</h3>
            <p className="text-gray-500">请返回列表重新选择一个提交</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 