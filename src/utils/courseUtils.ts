import { Course } from '@/types/course';
import { CourseCategory, getCategoryDisplayName, CATEGORY_MAP } from '@/types/course-enrollment';

// 过滤课程的逻辑
export const filterCourses = (
  courses: Course[], 
  searchQuery: string, 
  selectedCategory: CourseCategory
): Course[] => {
  try {
    return courses.filter(course => {
      // 标题、描述和简短描述的搜索匹配
      const matchesSearch = 
        (course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) || 
        (course.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
      
      // 如果选择了"全部"分类，则显示所有满足搜索条件的课程
      if (selectedCategory === '全部') {
        return matchesSearch;
      }
      
      // 分类匹配逻辑
      if (course.category) {
        // 获取课程分类的显示名称
        const categoryDisplayName = getCategoryDisplayName(course.category);
        
        // 记录分类匹配过程以便调试
        console.log(`课程: ${course.title}, 分类: ${course.category}, 显示名称: ${categoryDisplayName}, 选择的分类: ${selectedCategory}`);
        
        // 匹配显示名称或原始分类值（不区分大小写）
        const matchesCategory = 
          categoryDisplayName === selectedCategory || 
          course.category === selectedCategory ||
          categoryDisplayName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          course.category.toLowerCase().includes(selectedCategory.toLowerCase());
        
        return matchesSearch && matchesCategory;
      }
      
      return false; // 如果课程没有分类，则不匹配任何特定分类
    });
  } catch (error) {
    console.error('过滤课程时出错:', error);
    return courses; // 出错时返回所有课程
  }
};

// 注意：不再需要重复定义CATEGORY_MAP和getCategoryDisplayName
// 这些已从@/types/course-enrollment导入
