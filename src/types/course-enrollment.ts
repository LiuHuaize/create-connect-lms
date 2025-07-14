import { Course } from '@/types/course';

// Course enrollment types
export interface CheckEnrollmentResult {
  enrollment_id: string | null;
}

export interface EnrollInCourseResult {
  success: boolean;
}

// 基础分类（固定的分类选项）
export const BASE_CATEGORIES = ['全部', '商业规划', '游戏设计', '产品开发', '编程', '创意写作'];

// 课程分类类型，使用string类型以支持动态添加的自定义分类
export type CourseCategory = string;

// 默认分类列表，可以动态扩展
export let COURSE_CATEGORIES: CourseCategory[] = [...BASE_CATEGORIES];

// 分类代码到显示名称的映射
export const CATEGORY_MAP: Record<string, string> = {
  'business_planning': '商业规划',
  'game_design': '游戏设计',
  'product_development': '产品开发',
  'marketing': '市场营销',
  'project_management': '项目管理'
};

// 获取分类的显示名称
export const getCategoryDisplayName = (categoryCode: string | null | undefined): string => {
  if (!categoryCode) return '未分类';
  return CATEGORY_MAP[categoryCode] || categoryCode; // 如果找不到映射，返回原始代码（自定义分类）
};

// 从所有课程中提取唯一的分类集合
export const updateCourseCategories = (courses: Course[]): CourseCategory[] => {
  try {
    console.log('正在从课程中提取分类...');
    
    // 从课程中提取所有非空分类
    const categoriesFromCourses = courses
      .filter(course => !!course.category)
      .map(course => {
        // 获取显示名称
        const displayName = getCategoryDisplayName(course.category);
        console.log(`课程 "${course.title}" 的分类: ${course.category}, 显示名称: ${displayName}`);
        return displayName;
      })
      // 过滤掉"未分类"
      .filter(category => category !== '未分类');

    console.log('提取的所有分类:', categoriesFromCourses);
    
    // 创建唯一分类集合
    const uniqueCategories = Array.from(new Set(categoriesFromCourses));
    console.log('唯一分类:', uniqueCategories);
    
    // 只返回实际存在的分类，始终保持"全部"在第一位
    const finalCategories = uniqueCategories.length > 0 
      ? ['全部', ...uniqueCategories] 
      : ['全部'];
    
    // 更新全局分类列表
    COURSE_CATEGORIES = finalCategories;
    console.log('更新后的完整分类列表:', COURSE_CATEGORIES);
    
    return COURSE_CATEGORIES;
  } catch (error) {
    console.error('更新课程分类时出错:', error);
    return ['全部']; // 出错时只返回"全部"分类
  }
};

// 扩展Supabase客户端类型以支持自定义RPC函数
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: string,
      params?: object,
      options?: object
    ): { data: T; error: Error };
  }
}
