
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { Course, CourseModule, Lesson } from '@/types/course';

export const useCourseData = (courseId: string | undefined) => {
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<(Course & { modules?: CourseModule[] }) | null>(null);
  const [progress, setProgress] = useState(0);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      
      try {
        setLoading(true);
        console.log('正在获取课程详情:', courseId);
        
        const { data: user } = await supabase.auth.getUser();
        if (user && user.user) {
          const { data: enrollments } = await supabase
            .from('course_enrollments')
            .select('id, progress')
            .eq('user_id', user.user.id)
            .eq('course_id', courseId)
            .maybeSingle();
            
          if (enrollments) {
            setEnrollmentId(enrollments.id);
            setProgress(enrollments.progress || 0);
          }
        }
        
        const courseDetails = await courseService.getCourseDetails(courseId);
        console.log('获取到的课程详情:', courseDetails);
        // 确保我们使用正确的类型
        setCourseData(courseDetails as (Course & { modules?: CourseModule[] }));
      } catch (error) {
        console.error('获取课程失败:', error);
        toast.error('获取课程数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);
  
  const findCurrentLesson = (lessonId: string | undefined): { 
    selectedLesson: Lesson | null; 
    selectedUnit: CourseModule | null 
  } => {
    let selectedLesson = null;
    let selectedUnit = null;
    
    if (courseData?.modules && courseData.modules.length > 0) {
      if (lessonId) {
        for (const module of courseData.modules) {
          if (!module.lessons) continue;
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            selectedLesson = lesson;
            selectedUnit = module;
            break;
          }
        }
      }
      
      if (!selectedLesson) {
        for (const module of courseData.modules) {
          if (module.lessons && module.lessons.length > 0) {
            selectedLesson = module.lessons[0];
            selectedUnit = module;
            break;
          }
        }
      }
    }
    
    return { selectedLesson, selectedUnit };
  };

  return {
    loading,
    courseData,
    progress,
    enrollmentId,
    findCurrentLesson
  };
};
