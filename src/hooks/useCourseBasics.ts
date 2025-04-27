import { useState, useEffect } from 'react';
import { Course } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';

interface UseCourseBasicsProps {
  initialCourse?: Course;
  onCourseChange?: (course: Course) => void;
}

/**
 * 管理课程基本信息的状态Hook
 * 
 * 负责管理和更新课程的基本信息，如标题、描述、封面图片等
 */
export const useCourseBasics = ({
  initialCourse,
  onCourseChange
}: UseCourseBasicsProps = {}) => {
  const { user } = useAuth();
  
  // 初始化课程状态
  const [course, setCourse] = useState<Course>(
    initialCourse || {
      title: '',
      description: '',
      short_description: '',
      author_id: user?.id || '',
      status: 'draft',
      price: null,
      tags: [],
      category: null
    }
  );
  
  // 封面图片URL状态
  const [coverImageURL, setCoverImageURL] = useState<string | null>(
    initialCourse?.cover_image || null
  );
  
  // 完成百分比状态
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // 当用户ID改变时，更新课程作者ID
  useEffect(() => {
    if (user?.id && course.author_id !== user.id) {
      updateCourse({ ...course, author_id: user.id });
    }
  }, [user?.id]);
  
  // 当封面图片URL改变时，更新课程封面图片
  useEffect(() => {
    if (coverImageURL !== course.cover_image) {
      updateCourse({ ...course, cover_image: coverImageURL });
    }
  }, [coverImageURL]);
  
  // 更新课程对象
  const updateCourse = (newCourse: Course) => {
    setCourse(newCourse);
    // 如果提供了onChange回调，则调用它
    if (onCourseChange) {
      onCourseChange(newCourse);
    }
  };
  
  // 更新课程标题
  const updateTitle = (title: string) => {
    updateCourse({ ...course, title });
  };
  
  // 更新课程描述
  const updateDescription = (description: string) => {
    updateCourse({ ...course, description });
  };
  
  // 更新课程简短描述
  const updateShortDescription = (short_description: string) => {
    updateCourse({ ...course, short_description });
  };
  
  // 更新课程价格
  const updatePrice = (price: number | null) => {
    updateCourse({ ...course, price });
  };
  
  // 更新课程标签
  const updateTags = (tags: string[]) => {
    updateCourse({ ...course, tags });
  };
  
  // 更新课程分类
  const updateCategory = (category: string | null) => {
    updateCourse({ ...course, category });
  };
  
  // 更新课程状态
  const updateStatus = (status: 'draft' | 'published' | 'archived') => {
    updateCourse({ ...course, status });
  };
  
  // 计算课程完成百分比
  const calculateCompletionPercentage = () => {
    let totalPoints = 0;
    let earnedPoints = 0;
    
    // 检查标题
    totalPoints += 1;
    if (course.title?.trim()) earnedPoints += 1;
    
    // 检查封面图片
    totalPoints += 1;
    if (coverImageURL || course.cover_image) earnedPoints += 1;
    
    // 检查描述
    totalPoints += 1;
    if (course.description?.trim()) earnedPoints += 1;
    
    // 检查简短描述
    totalPoints += 1;
    if (course.short_description?.trim()) earnedPoints += 1;
    
    // 计算百分比
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    setCompletionPercentage(percentage);
    
    return percentage;
  };
  
  // 当课程信息改变时，重新计算完成百分比
  useEffect(() => {
    calculateCompletionPercentage();
  }, [course, coverImageURL]);
  
  return {
    // 状态
    course,
    coverImageURL,
    completionPercentage,
    
    // 设置方法
    setCourse: updateCourse,
    setCoverImageURL,
    
    // 专用更新方法
    updateTitle,
    updateDescription,
    updateShortDescription, 
    updatePrice,
    updateTags,
    updateCategory,
    updateStatus,
    
    // 计算方法
    calculateCompletionPercentage
  };
}; 