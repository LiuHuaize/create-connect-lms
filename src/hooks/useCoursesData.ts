
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Course } from '@/types/course';

export const useCoursesData = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollment, setLoadingEnrollment] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  // 提取获取课程的逻辑到单独的函数中
  const fetchCourses = async () => {
    try {
      setLoading(true);
      console.log('正在获取课程...');
      
      // 获取已发布的课程
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published');
      
      if (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程失败');
        setLoading(false);
        return;
      }
      
      console.log('从数据库获取的课程:', data);
      
      if (!data || data.length === 0) {
        console.log('没有找到课程');
        setCourses([]);
        setLoading(false);
        return;
      }
      
      // 直接将数据转换为Course类型
      setCourses(data as Course[]);
    } catch (error) {
      console.error('获取课程失败:', error);
      toast.error('获取课程失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      if (!courseId) {
        toast.error('课程ID无效');
        return;
      }
      
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }
      
      setLoadingEnrollment(true);
      console.log(`尝试加入课程: ${courseId}`);
      
      // 验证课程是否存在并且是已发布状态
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, status')
        .eq('id', courseId)
        .eq('status', 'published')
        .single();
      
      if (courseError || !courseData) {
        toast.error('课程不存在或未发布');
        setLoadingEnrollment(false);
        return;
      }
      
      // 检查用户是否已经注册了这个课程
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId);
        
      if (enrollmentError) {
        console.error('检查课程注册状态失败:', enrollmentError);
        toast.error('注册课程失败，请稍后重试');
        setLoadingEnrollment(false);
        return;
      }
      
      // 如果用户已经注册，直接导航到课程页面
      if (enrollments && enrollments.length > 0) {
        console.log('用户已经注册了这个课程');
        toast.success('您已注册过此课程，正在跳转...');
        navigate(`/course/${courseId}`);
        setLoadingEnrollment(false);
        return;
      }
      
      // 用户未注册，直接插入新的注册记录
      const { error: insertError } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress: 0
        });
      
      if (insertError) {
        console.error('注册课程失败:', insertError);
        toast.error('注册课程失败，请稍后重试');
        setLoadingEnrollment(false);
        return;
      }
      
      toast.success('成功加入课程！');
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('加入课程过程中发生错误:', error);
      toast.error('加入课程失败，请稍后重试');
    } finally {
      setLoadingEnrollment(false);
    }
  };

  return {
    courses,
    loading,
    loadingEnrollment,
    fetchCourses,
    handleEnrollCourse
  };
};
