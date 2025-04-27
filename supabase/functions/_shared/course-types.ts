import { PostgrestResponse } from '@supabase/supabase-js';

// 课程状态类型
export type CourseStatus = 'draft' | 'published' | 'archived';

// 课程类型定义
export type Course = {
  id?: string;
  title: string;
  description?: string | null;
  short_description?: string | null;
  author_id: string;
  cover_image?: string | null;
  status: CourseStatus;
  price?: number | null;
  tags?: string[] | null;
  created_at?: string;
  updated_at?: string;
  category?: string | null;
  deleted_at?: string | null;
};

// 课程模块类型定义
export type CourseModule = {
  id?: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  lessons?: Lesson[];
};

// 支持的课时类型枚举
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'card_creator' | 'drag_sort';

// 课时类型定义
export type Lesson = {
  id?: string;
  module_id: string;
  title: string;
  type: LessonType;
  content: any; // 根据不同类型存储不同的内容结构
  order_index: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  video_file_path?: string | null;
  bilibili_url?: string | null;
};

// 保存课程请求类型定义
export interface SaveCourseRequest {
  course: Course;
  modules: CourseModule[];
  idempotencyKey: string; // 用于确保幂等性
  requesterId: string; // 用于验证权限
}

// 保存课程响应类型定义
export interface SaveCourseResponse {
  success: boolean;
  message?: string;
  error?: string;
  course?: Course;
  modules?: CourseModule[];
  savedAt?: string;
}

// 删除课程请求类型定义
export interface DeleteCourseItemsRequest {
  courseId: string;
  moduleIds?: string[];
  lessonIds?: string[];
  idempotencyKey: string;
  requesterId: string;
}

// 删除课程响应类型定义
export interface DeleteCourseItemsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// 幂等性记录类型
export interface IdempotencyRecord {
  id?: string;
  key: string;
  requester_id: string;
  endpoint: string;
  created_at?: string;
  response?: any;
} 