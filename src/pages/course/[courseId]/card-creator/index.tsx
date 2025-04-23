import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { CardCreatorTeacher } from '@/components/course/card-creator/CardCreatorTeacher';
import { CardTaskList } from '@/components/course/card-creator/CardTaskList';
import { CardCreatorTask } from '@/types/card-creator';
import { CourseLayout } from '@/components/layout/CourseLayout';
import { supabase } from '@/integrations/supabase/client';

interface CardCreatorPageProps {
  courseId: string;
  courseTitle: string;
  userRole: 'student' | 'teacher' | 'admin';
}

export default function CardCreatorPage({ courseId, courseTitle, userRole }: CardCreatorPageProps) {
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<CardCreatorTask | null>(null);
  const { user } = useUser();
  const router = useRouter();

  const isTeacher = userRole === 'teacher' || userRole === 'admin';
  
  const handleTaskCreated = (task: CardCreatorTask) => {
    setIsCreatingTask(false);
    router.push(`/course/${courseId}/card-creator/${task.id}`);
  };
  
  const handleEditTask = (task: CardCreatorTask) => {
    setEditingTask(task);
    setIsCreatingTask(true);
  };

  return (
    <CourseLayout courseId={courseId} courseTitle={courseTitle}>
      <div className="container py-6 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">卡片制作</h1>
        </div>
        
        {isCreatingTask ? (
          <CardCreatorTeacher 
            courseId={courseId} 
            onSave={handleTaskCreated}
            onCancel={() => setIsCreatingTask(false)}
          />
        ) : (
          <CardTaskList 
            courseId={courseId}
            isTeacher={isTeacher}
            onCreateTask={() => setIsCreatingTask(true)}
            onEditTask={handleEditTask}
          />
        )}
      </div>
    </CourseLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { courseId } = context.params || {};
  const { req } = context;
  
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
      userRole: role,
    },
  };
}; 