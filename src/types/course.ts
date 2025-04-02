
// 导入必要的类型
import { Json } from "@/integrations/supabase/types";

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
  category?: string;
  difficulty?: 'initial' | 'intermediate' | 'advanced';
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
};

// Define all possible lesson content types
export type VideoLessonContent = {
  videoUrl?: string;
  description?: string;
  videoFilePath?: string;
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

// Union type for all possible lesson content
export type LessonContent = 
  | VideoLessonContent 
  | TextLessonContent 
  | QuizLessonContent 
  | AssignmentLessonContent;

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
};

// Lesson type
export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';

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
  video_file_path?: string | null; // 添加视频文件路径
};
