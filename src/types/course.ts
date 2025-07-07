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
  preparation_materials?: string | null;
  duration_minutes?: number | null;
  difficulty?: string | null;
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
  allowFileUpload?: boolean; // 是否允许文件上传
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

// 热点课程内容类型
export type Hotspot = {
  id: string;
  x: number;  // X坐标 (百分比形式，0-100)
  y: number;  // Y坐标 (百分比形式，0-100)
  title: string;
  description: string;
  audioUrl?: string;  // 可选的音频描述
  imageUrl?: string;  // 可选的图片
};

export type HotspotLessonContent = {
  backgroundImage: string;  // 背景图片URL
  introduction?: string;    // 可选的介绍文字
  hotspots: Hotspot[];      // 热点数组
};

// 系列问答课程内容类型
export type SeriesQuestionnaireLessonContent = {
  questionnaire: SeriesQuestionnaire;
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
  fileSubmissions?: AssignmentFileSubmission[]; // 学生提交的文件
  profiles?: {
    username: string;
  }; // 学生个人资料信息
};

// 学生文件提交类型
export type AssignmentFileSubmission = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string; // Supabase存储路径
  uploadedAt: string;
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

// 框架课时内容类型 - 可以包含多个子课时内容
export type FrameLessonContent = {
  title: string;
  description?: string;
  lessons: Lesson[]; // 框架内的课时
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
  | ResourceLessonContent
  | FrameLessonContent
  | HotspotLessonContent
  | SeriesQuestionnaireLessonContent;

// Quiz related types
export type QuizQuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer';

// 多选题评分模式
export type MultipleChoiceScoringMode = 'strict' | 'partial';

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  type: QuizQuestionType;
  text: string;
  options?: QuizOption[];
  correctOption?: string; // 保留用于单选题和向后兼容
  correctOptions?: string[]; // 新增：用于多选题的多个正确答案
  sampleAnswer?: string;
  hint?: string;
  isMultipleCorrect?: boolean; // 新增：标识是否为真正的多选题
  requiredSelections?: number; // 新增：多选题要求选择的数量（可选）
  scoringMode?: MultipleChoiceScoringMode; // 新增：多选题评分模式，默认为strict
};

// Lesson type - use string union for better type safety
export type LessonType = 'text' | 'video' | 'quiz' | 'assignment' | 'card_creator' | 'drag_sort' | 'resource' | 'frame' | 'hotspot' | 'series_questionnaire';

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
  isCompleted?: boolean; // 课时完成状态（运行时属性）
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

// ==================== 系列问答相关类型定义 ====================

// 系列问答状态
export type SeriesQuestionnaireStatus = 'draft' | 'published' | 'archived';

// 系列问答主体类型
export type SeriesQuestionnaire = {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  lesson_id: string;
  ai_grading_prompt?: string;
  ai_grading_criteria?: string;
  max_score?: number;
  time_limit_minutes?: number;
  allow_save_draft?: boolean;
  skill_tags?: string[];
  created_at?: string;
  updated_at?: string;
  questions?: SeriesQuestion[];
};

// 系列问题类型
export type SeriesQuestion = {
  id: string;
  questionnaire_id: string;
  title: string;
  description?: string;
  question_text: string;
  order_index: number;
  required?: boolean;
  min_words?: number;
  max_words?: number;
  placeholder_text?: string;
  created_at?: string;
  updated_at?: string;
};

// 系列问答提交状态
export type SeriesSubmissionStatus = 'draft' | 'submitted' | 'graded';

// 系列问答答案类型
export type SeriesAnswer = {
  question_id: string;
  answer_text: string;
  word_count?: number;
};

// 系列问答提交类型
export type SeriesSubmission = {
  id: string;
  questionnaire_id: string;
  student_id: string;
  status: SeriesSubmissionStatus;
  answers: SeriesAnswer[];
  total_words?: number;
  time_spent_minutes?: number;
  submitted_at?: string;
  created_at?: string;
  updated_at?: string;
  ai_grading?: SeriesAIGrading;
  questionnaire?: SeriesQuestionnaire;
  student_profile?: {
    username: string;
    email?: string;
  };
};

// AI评分详细反馈类型
export type SeriesAIDetailedFeedback = {
  question_id: string;
  question_title?: string;
  feedback: string;
  score?: number;
  strengths?: string[];
  improvements?: string[];
  suggestions?: string[];
};

// 系列问答AI评分类型
export type SeriesAIGrading = {
  id: string;
  submission_id: string;
  ai_score?: number;
  ai_feedback?: string;
  ai_detailed_feedback?: SeriesAIDetailedFeedback[];
  teacher_score?: number;
  teacher_feedback?: string;
  final_score?: number;
  grading_criteria_used?: string;
  graded_at?: string;
  teacher_reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
};

// 系列问答统计信息类型
export type SeriesQuestionnaireStats = {
  questionnaire_id: string;
  total_submissions: number;
  completed_submissions: number;
  average_score?: number;
  average_time_spent?: number;
  average_word_count?: number;
};
