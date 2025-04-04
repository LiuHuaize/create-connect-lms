
export interface Course {
  id?: string;
  created_at?: string;
  updated_at?: string;
  title: string;
  short_description?: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: string;
  language?: string;
  user_id?: string;
  author_id?: string;
  price?: number;
  discount?: number;
  start_date?: string;
  end_date?: string;
  status?: CourseStatus;
  cover_image?: string;
  modules?: CourseModule[];
}

export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseModule {
  id?: string;
  created_at?: string;
  updated_at?: string;
  title: string;
  description?: string;
  course_id?: string;
  order?: number;
  order_index?: number;
  lessons?: CourseLesson[] | Lesson[];
}

export interface CourseLesson {
  id?: string;
  title: string;
  type: string;
  content?: string | LessonContent;
  module_id?: string;
  order?: number;
  order_index?: number;
  duration?: number;
  status?: 'draft' | 'published';
  video_url?: string;
  video_file_path?: string | null;
  completed?: boolean;
}

// Add new types needed for the course creator and lesson editor
export interface Lesson {
  id?: string;
  created_at?: string;
  updated_at?: string;
  title: string;
  type: LessonType;
  content?: LessonContent;
  module_id?: string;
  order_index?: number;
  video_file_path?: string | null;
  completed?: boolean;
}

export type LessonType = 'video' | 'text' | 'quiz' | 'assignment';

export type LessonContent = 
  | VideoLessonContent 
  | TextLessonContent 
  | QuizLessonContent 
  | AssignmentLessonContent;

export interface VideoLessonContent {
  videoUrl?: string;
  videoFilePath?: string;
  description?: string;
}

export interface TextLessonContent {
  text: string;
}

export interface QuizLessonContent {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  text: string;
  options?: QuizOption[];
  correctOption?: string;
  sampleAnswer?: string;
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizOption {
  id: string;
  text: string;
}

export interface AssignmentLessonContent {
  instructions: string;
  criteria?: string;
  aiGradingPrompt?: string;
}

// Assignment submission types
export interface AssignmentSubmission {
  id: string;
  studentId: string;
  lessonId: string;
  content: string;
  submittedAt: string;
  aiGrading?: AIGradingResult;
  teacherGrading?: TeacherGradingResult;
}

export interface AIGradingResult {
  score: number;
  feedback: string;
  timestamp: string;
}

export interface TeacherGradingResult {
  score: number;
  feedback: string;
  timestamp: string;
}

export type StudentAssignmentStatus = 
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'ai_graded'
  | 'teacher_graded';
