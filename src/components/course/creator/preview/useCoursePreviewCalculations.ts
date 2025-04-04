
import { Course, CourseModule } from '@/types/course';

export const useCoursePreviewCalculations = (course: Course, modules: CourseModule[]) => {
  // 计算课程总课时数
  const totalLessons = modules.reduce((acc, module) => 
    acc + (module.lessons?.length || 0), 0
  );

  // 计算估计学习时间（示例：每个课时平均20分钟）
  const estimatedHours = Math.max(1, Math.round(totalLessons * 20 / 60));
  
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '刚刚更新';
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return {
    totalLessons,
    estimatedHours,
    formatDate
  };
};
