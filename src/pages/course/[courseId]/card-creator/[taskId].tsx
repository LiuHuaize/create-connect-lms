import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { CardCreatorStudent } from '@/components/course/card-creator/CardCreatorStudent';
import { CardCreatorTask, CardSubmission } from '@/types/card-creator';
import { CardCreatorService } from '@/services/card-creator-service';
import { CourseLayout } from '@/components/layout/CourseLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface CardCreatorTaskPageProps {
  courseId: string;
  courseTitle: string;
  taskId: string;
  userRole: 'student' | 'teacher' | 'admin';
  userId: string;
}

export default function CardCreatorTaskPage({ 
  courseId, 
  courseTitle, 
  taskId, 
  userRole,
  userId 
}: CardCreatorTaskPageProps) {
  const [task, setTask] = useState<CardCreatorTask | null>(null);
  const [submissions, setSubmissions] = useState<CardSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  
  useEffect(() => {
    loadTaskData();
  }, [taskId]);

  const loadTaskData = async () => {
    setIsLoading(true);
    try {
      // 获取任务详情
      const taskData = await CardCreatorService.getTaskById(taskId);
      if (!taskData) {
        throw new Error('任务不存在');
      }
      setTask(taskData);
      
      // 获取提交记录
      if (isTeacher) {
        const allSubmissions = await CardCreatorService.getSubmissionsByTaskId(taskId);
        setSubmissions(allSubmissions);
      } else {
        const userSubmissions = await CardCreatorService.getUserSubmissionsByTaskId(taskId, userId);
        setSubmissions(userSubmissions);
      }
    } catch (error) {
      console.error('Error loading task data:', error);
      alert('加载任务数据失败');
      router.push(`/course/${courseId}/card-creator`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmissionCreated = (submission: CardSubmission) => {
    setSubmissions(prev => [submission, ...prev]);
    alert('卡片已成功提交！');
  };

  const goBack = () => {
    router.push(`/course/${courseId}/card-creator`);
  };

  if (isLoading) {
    return (
      <CourseLayout courseId={courseId} courseTitle={courseTitle}>
        <div className="container py-6 text-center">加载中...</div>
      </CourseLayout>
    );
  }

  if (!task) {
    return (
      <CourseLayout courseId={courseId} courseTitle={courseTitle}>
        <div className="container py-6 text-center">任务不存在</div>
      </CourseLayout>
    );
  }

  return (
    <CourseLayout courseId={courseId} courseTitle={courseTitle}>
      <div className="container py-6 space-y-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">{task.title}</h1>
        </div>
        
        {/* 学生视图：创建卡片 */}
        {!isTeacher && submissions.length === 0 && (
          <CardCreatorStudent 
            taskId={taskId}
            studentId={userId}
            task={task}
            onSubmit={handleSubmissionCreated}
          />
        )}
        
        {/* 提交记录 */}
        {submissions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {isTeacher ? '学生提交记录' : '你的提交记录'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submissions.map(submission => (
                <div key={submission.id} className="border rounded-lg overflow-hidden shadow-sm">
                  <div className="p-3 bg-gray-50 border-b">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        提交时间: {new Date(submission.created_at || '').toLocaleString()}
                      </div>
                      {!isTeacher && (
                        <Button 
                          size="sm"
                          variant="ghost"
                          className="text-blue-600"
                          onClick={() => {
                            // 下载卡片图片
                            const a = document.createElement('a');
                            a.href = submission.card_image_url || '';
                            a.download = `card-${submission.id}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                        >
                          下载
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {submission.card_image_url && (
                      <img 
                        src={submission.card_image_url} 
                        alt="提交的卡片" 
                        className="w-full h-auto rounded-md mb-3"
                      />
                    )}
                    <div className="text-sm">
                      <h4 className="font-medium mb-1">提交内容:</h4>
                      <p className="text-gray-700 whitespace-pre-line">{submission.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 学生已有提交但想再次提交 */}
        {!isTeacher && submissions.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">重新创建卡片</h3>
              <Button
                onClick={() => {
                  window.scrollTo({top: 0, behavior: 'smooth'});
                }}
              >
                再次提交
              </Button>
            </div>
            <CardCreatorStudent 
              taskId={taskId}
              studentId={userId}
              task={task}
              onSubmit={handleSubmissionCreated}
            />
          </div>
        )}
      </div>
    </CourseLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { courseId, taskId } = context.params || {};
  
  // 获取认证会话信息
  const { data: { session } } = await supabase.auth.getSession();
  
  // 如果没有认证，重定向到登录页
  if (!session) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }
  
  // 获取课程信息
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();
  
  if (courseError || !course) {
    return {
      notFound: true,
    };
  }
  
  // 获取用户角色
  const { data: userRole, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  
  const role = userRole?.role || 'student';
  
  // 检查用户是否已注册此课程
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('user_id', session.user.id)
    .single();
  
  // 如果用户不是教师或管理员，且未注册课程，重定向到课程详情页
  if (role !== 'teacher' && role !== 'admin' && (!enrollment || enrollmentError)) {
    return {
      redirect: {
        destination: `/course/${courseId}`,
        permanent: false,
      },
    };
  }
  
  return {
    props: {
      courseId: courseId as string,
      courseTitle: course.title,
      taskId: taskId as string,
      userRole: role,
      userId: session.user.id,
    },
  };
}; 