
import { Course } from '@/types/course';

// Course enrollment types
export interface CheckEnrollmentResult {
  enrollment_id: string | null;
}

export interface EnrollInCourseResult {
  success: boolean;
}

// 课程分类类型，不再需要强制与课程的category匹配
export type CourseCategory = '全部' | '商业规划' | '游戏设计' | '产品开发' | '编程' | '创意写作';

// Category list constant
export const COURSE_CATEGORIES: CourseCategory[] = ['全部', '商业规划', '游戏设计', '产品开发', '编程', '创意写作'];

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
