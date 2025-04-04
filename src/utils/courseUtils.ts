
import { Course } from '@/types/course';
import { CourseCategory } from '@/types/course-enrollment';

// 过滤课程的逻辑
export const filterCourses = (
  courses: Course[], 
  searchQuery: string, 
  selectedCategory: CourseCategory
): Course[] => {
  return courses.filter(course => {
    const matchesSearch = 
      (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    // 如果选择了"全部"分类，则显示所有课程
    // 否则，检查课程的类别是否与所选类别匹配
    const matchesCategory = selectedCategory === '全部' || 
      (course.category && course.category.includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });
};
