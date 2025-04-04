
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Course, CourseLesson, CourseModule } from '@/types/course';

export const useCourseData = (courseId: string) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<Course & { modules?: CourseModule[] }>(null);
  const [progress, setProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string>(null);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    const loadCourseData = async () => {
      try {
        setLoading(true);
        
        // 获取课程详情
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        if (courseError) throw courseError;
        
        // 获取课程模块和课时
        const { data: modulesData, error: modulesError } = await supabase
          .from('course_modules')
          .select(`
            *,
            lessons(*)
          `)
          .eq('course_id', courseId)
          .order('order_index');
        
        if (modulesError) throw modulesError;
        
        // 整合数据
        const fullCourseData = {
          ...courseData,
          modules: modulesData || []
        };
        
        setCourseData(fullCourseData);
        
        // 如果用户已登录，获取课程注册信息
        if (user) {
          // Check for enrollment
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .rpc('check_enrollment', {
              user_id_param: user.id,
              course_id_param: courseId
            });
          
          if (!enrollmentError && enrollmentData && enrollmentData.length > 0) {
            // User is enrolled, get progress info
            const { data: progressData, error: progressError } = await supabase
              .from('course_enrollments')
              .select('id, progress')
              .eq('user_id', user.id)
              .eq('course_id', courseId)
              .maybeSingle();
            
            if (!progressError && progressData) {
              setProgress(progressData.progress || 0);
              setEnrollmentId(progressData.id);
            }
          }
        }
        
      } catch (error) {
        console.error('加载课程数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [courseId, user]);

  const findCurrentLesson = (lessonId: string) => {
    if (!courseData || !courseData.modules) {
      return { selectedLesson: null, selectedUnit: null };
    }
    
    for (const module of courseData.modules) {
      if (!module.lessons) continue;
      
      const foundLesson = module.lessons.find(lesson => lesson.id === lessonId);
      if (foundLesson) {
        return { 
          selectedLesson: foundLesson as CourseLesson, 
          selectedUnit: module 
        };
      }
    }
    
    // 如果没有找到指定课时，返回第一个课时
    if (courseData.modules.length > 0 && 
        courseData.modules[0].lessons && 
        courseData.modules[0].lessons.length > 0) {
      return { 
        selectedLesson: courseData.modules[0].lessons[0] as CourseLesson, 
        selectedUnit: courseData.modules[0] 
      };
    }
    
    return { selectedLesson: null, selectedUnit: null };
  };

  return {
    loading,
    courseData,
    progress,
    enrollmentId,
    findCurrentLesson
  };
};
