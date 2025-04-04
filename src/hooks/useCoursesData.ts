
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
      
      // Validate course existence and status in a single query
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, status')
        .eq('id', courseId)
        .eq('status', 'published')
        .single();
      
      if (courseError || !courseData) {
        toast.error('课程不存在或未发布');
        return;
      }
      
      let isAlreadyEnrolled = false;
      
      try {
        // 尝试使用check_enrollment RPC，但如果失败，就直接检查课程注册表
        const { data: enrollmentData, error: enrollmentCheckError } = await supabase
          .rpc('check_enrollment', { 
            user_id_param: user.id, 
            course_id_param: courseId 
          });
          
        if (!enrollmentCheckError && enrollmentData && enrollmentData.length > 0) {
          isAlreadyEnrolled = true;
        }
      } catch (checkError) {
        console.log('使用RPC检查注册失败，将直接查询数据库:', checkError);
        
        // 如果RPC调用失败，直接查询course_enrollments表
        const { data: directEnrollmentCheck, error: directCheckError } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', courseId);
          
        if (!directCheckError && directEnrollmentCheck && directEnrollmentCheck.length > 0) {
          isAlreadyEnrolled = true;
        }
      }
      
      // 如果用户已经注册，直接导航到课程页面
      if (isAlreadyEnrolled) {
        console.log('用户已经注册了这个课程');
        toast.success('您已注册过此课程，正在跳转...');
        navigate(`/course/${courseId}`);
        setLoadingEnrollment(false);
        return;
      }
      
      // 用户未注册，使用enroll_in_course函数
      try {
        const { error: enrollError } = await supabase
          .rpc('enroll_in_course', { 
            user_id_param: user.id, 
            course_id_param: courseId 
          });
          
        if (enrollError) {
          throw enrollError;
        }
      } catch (enrollRpcError) {
        console.log('使用RPC注册失败，将直接插入数据:', enrollRpcError);
        
        // 如果RPC调用失败，直接插入数据
        const { error: insertError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: user.id,
            course_id: courseId,
            status: 'active',
            progress: 0
          });
           
        if (insertError) {
          throw insertError;
        }
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
