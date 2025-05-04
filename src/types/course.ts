// 导入必要的类型
import { Json } from "@/integrations/supabase/types";

// 课程状态类型
export type CourseStatus = 'draft' | 'published' | 'archived';

// 课程类型定义 - 简化版本，与数据库保持一致
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
  grade_range_min?: number | null;
  grade_range_max?: number | null;
  primary_subject?: string | null;
  secondary_subject?: string | null;
};

// 课程模块类型定义
export type CourseModule = {
  id?: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
  lessons?: Lesson[];
  isFrame?: boolean; // 是否是框架模块
};

// Define all possible lesson content types
export type VideoLessonContent = {
  videoUrl?: string;
  description?: string;
  videoFilePath?: string;
  bilibiliUrl?: string; // 添加B站视频iframe嵌入URL
};

export type TextLessonContent = {
  text: string;
};

export type QuizLessonContent = {
  questions: QuizQuestion[];
};

export type AssignmentLessonContent = {
  instructions: string;
  criteria: string;
  aiGradingPrompt?: string; // AI评分提示
};

// 代码课程内容类型
export type CodeLessonContent = {
  code: string;
  language?: string;
};

// 卡片创建器课程内容类型
export type CardCreatorLessonContent = {
  instructions: string;
  templateType: 'image' | 'text';
  templateImageUrl?: string;
  templateDescription?: string;
};

// 资源下载课程内容类型
export type ResourceLessonContent = {
  description?: string;
  resourceFiles?: ResourceFile[];
};

// 资源文件类型
export type ResourceFile = {
  id: string;
  title: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  downloadCount?: number;
};

// AI评分结果类型
export type AIGradingResult = {
  score: number; // AI给出的分数
  feedback: string; // AI的评语
  timestamp: string; // 评分时间
};

// 学生作业提交类型
export type AssignmentSubmission = {
  id: string;
  studentId: string;
  lessonId: string;
  content: string; // 学生提交的内容
  submittedAt: string;
  aiGrading?: AIGradingResult; // AI评分结果
  teacherGrading?: {
    score: number;
    feedback: string;
    timestamp: string;
  }; // 教师评分结果
};

// 学生作业状态
export type StudentAssignmentStatus = 'not_started' | 'in_progress' | 'submitted' | 'ai_graded' | 'teacher_graded';

// 学生课程进度
export type StudentProgress = {
  studentId: string;
  courseId: string;
  completedLessons: string[]; // 已完成课时的ID
  assignmentStatus: Record<string, StudentAssignmentStatus>; // 每个作业的状态
  quizScores: Record<string, number>; // 每个测验的得分
  lastActivity: string; // 最后活动时间
};

// 课程完成记录
export type LessonCompletion = {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  enrollmentId: string;
  completedAt: string;
  score?: number;
  data?: any;
};

// Union type for all possible lesson content
export type LessonContent = 
  | VideoLessonContent 
  | TextLessonContent 
  | QuizLessonContent 
  | AssignmentLessonContent
  | CodeLessonContent
  | CardCreatorLessonContent
  | DragSortContent
  | ResourceLessonContent;

// Quiz related types
export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  text: string;
  options?: QuizOption[];
  correctOption?: string;
  sampleAnswer?: string;
  hint?: string;
};

// Lesson type - use string union for better type safety
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'card_creator' | 'drag_sort' | 'resource' | 'frame';

// Make sure order_index is included in the Lesson type
export type Lesson = {
  id: string;
  type: LessonType;
  title: string;
  content: LessonContent;
  module_id?: string;
  order_index: number; // This field is required
  created_at?: string;
  updated_at?: string;
  video_file_path?: string | null; // 视频文件路径
  bilibili_url?: string | null; // B站嵌入URL
  isFrame?: boolean; // 是否是框架容器
  subLessons?: Lesson[]; // 框架内的子课时
};

// 拖拽分类练习的数据结构
export interface DragSortContent {
  introduction: string;       // 介绍文字
  items: DragSortItem[];      // 可拖拽的项目
  categories: DragSortCategory[];  // 分类区域
  correctMappings: DragSortMapping[];  // 正确的映射关系
}

// 可拖拽项目
export interface DragSortItem {
  id: string;
  text: string;
  description?: string;
}

// 分类区域
export interface DragSortCategory {
  id: string;
  title: string;
  description?: string;
}

// 项目与分类的映射关系
export interface DragSortMapping {
  itemId: string;
  categoryId: string;
}

// 用户提交的答案
export interface DragSortSubmission {
  mappings: DragSortMapping[];
  isCorrect: boolean;
}
