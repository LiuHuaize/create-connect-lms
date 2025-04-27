import { useState, useEffect } from 'react';
import { Course } from '@/types/course';
import { courseService } from '@/services/courseService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 专注于处理课程基本信息的Hook
 * 提供加载、设置和管理课程基本信息的功能
 */
export const useCourseBasicInfo = (courseId: string | null) => {
  const { user } = useAuth();
  
  // 课程基本信息
  const [course, setCourse] = useState<Course>({
    title: '',
    description: '',
    short_description: '',
    author_id: user?.id || '',
    status: 'draft',
    price: null,
    tags: [],
    category: null
  });

  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // 引用对象，用于比较课程是否有变更
  const courseRef = { current: null as Course | null };

  // 初始加载课程信息
  const loadCourseBasicInfo = async () => {
    if (!courseId) {
      setLoadingDetails(false);
      setIsLoading(false);
      return null;
    }
      
    try {
      setIsLoading(true);
      setLoadingDetails(true);
      
      const courseDetails = await courseService.getCourseDetails(courseId);
      
      setCourse(courseDetails);
      setCoverImageURL(courseDetails.cover_image || null);
      
      // 保存当前课程状态用于比较
      courseRef.current = { ...courseDetails };
      
      setLoadingDetails(false);
      setIsLoading(false);
      
      return courseDetails;
    } catch (error) {
      console.error('加载课程失败:', error);
      toast.error('加载课程失败，请重试', {
        duration: 5000,
        action: {
          label: '重试',
          onClick: () => loadCourseBasicInfo()
        }
      });
      setLoadingDetails(false);
      setIsLoading(false);
      return null;
    }
  };

  // 确保作者ID总是使用当前登录用户的ID
  useEffect(() => {
    if (user?.id) {
      setCourse(prev => ({ ...prev, author_id: user.id }));
    }
  }, [user]);

  // 计算课程完成度
  const calculateCompletionPercentage = (currentCourse: Course, hasModules: boolean, hasLessons: boolean) => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    totalPoints += 1;
    if (currentCourse.title?.trim()) earnedPoints += 1;
    
    totalPoints += 1;
    if (coverImageURL || currentCourse.cover_image) earnedPoints += 1;
    
    totalPoints += 1;
    if (hasModules) earnedPoints += 1;
    
    totalPoints += 1;
    if (hasLessons) earnedPoints += 0.5;
    
    if (currentCourse.description?.trim()) earnedPoints += 0.5;
    if (currentCourse.short_description?.trim()) earnedPoints += 0.5;
    
    const percentage = Math.min(100, Math.round((earnedPoints / totalPoints) * 100));
    setCompletionPercentage(percentage);
    return percentage;
  };

  // 检查课程基本信息是否变更
  const hasCourseChanged = (currentCourse: Course, prevCourse: Course | null) => {
    if (!prevCourse) return true;
    
    return (
      prevCourse.title !== currentCourse.title ||
      prevCourse.description !== currentCourse.description ||
      prevCourse.short_description !== currentCourse.short_description ||
      prevCourse.status !== currentCourse.status ||
      prevCourse.cover_image !== currentCourse.cover_image ||
      JSON.stringify(prevCourse.tags) !== JSON.stringify(currentCourse.tags) ||
      prevCourse.category !== currentCourse.category ||
      prevCourse.price !== currentCourse.price
    );
  };

  // 设置引用对象的值
  const updateCourseRef = (newCourse: Course) => {
    courseRef.current = { ...newCourse };
  };

  return {
    course,
    setCourse,
    isLoading,
    loadingDetails,
    coverImageURL,
    setCoverImageURL,
    completionPercentage,
    loadCourseBasicInfo,
    calculateCompletionPercentage,
    hasCourseChanged,
    updateCourseRef,
    courseRef
  };
}; 