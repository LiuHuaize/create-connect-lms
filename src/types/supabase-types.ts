/**
 * 这个文件包含与Supabase数据库表结构相关的TypeScript类型定义
 */

// course_resources表的行类型定义
export interface CourseResource {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  download_count: number | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
} 