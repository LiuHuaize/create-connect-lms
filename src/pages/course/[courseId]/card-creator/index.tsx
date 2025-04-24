import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useUser } from '@/contexts/UserContext';
import { CardCreatorTeacher } from '@/components/course/card-creator/CardCreatorTeacher';
import { CardTaskList } from '@/components/course/card-creator/CardTaskList';
import { CardCreatorTask } from '@/types/card-creator';
import { CourseLayout } from '@/components/layout/CourseLayout';
import { supabase } from '@/integrations/supabase/client';
import Link from 'next/link';
import { WandSparkles } from 'lucide-react';
import { GeneralLayout } from '@/components/layout/GeneralLayout';

interface CardCreatorPageProps {
  courseId: string;
  courseTitle: string;
  userRole: 'student' | 'teacher' | 'admin';
}

const CardCreatorPage = ({ courseId, courseTitle, userRole }: CardCreatorPageProps) => {
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

  const pageContent = (
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
  );

  return (
    <GeneralLayout>
      <div className="min-h-screen bg-gradient-to-br from-ghibli-parchment to-ghibli-cream">
        <div className="container max-w-5xl px-4 py-8">
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-ghibli-teal/20">
            <div className="bg-gradient-to-r from-ghibli-lightTeal to-ghibli-sand p-5 border-b border-ghibli-teal/20">
              <h1 className="text-2xl font-bold text-ghibli-deepTeal flex items-center">
                <WandSparkles className="mr-2 h-6 w-6 text-ghibli-teal" />
                创意卡片制作
              </h1>
              <p className="text-ghibli-brown mt-2">
                在这里，你可以根据课程内容创建你的专属创意卡片。发挥想象力，创造属于你的精彩作品！
              </p>
            </div>
            <div className="p-5">
              {pageContent}
            </div>
          </div>
        </div>
      </div>
    </GeneralLayout>
  );
};

export default CardCreatorPage;

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