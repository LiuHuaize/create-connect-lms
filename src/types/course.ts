
// Define all possible lesson content types
export type VideoLessonContent = {
  videoUrl: string;
  description?: string;
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

export type Lesson = {
  id: string;
  type: LessonType;
  title: string;
  content: LessonContent;
};

// Module type
export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
};

// Yoopta Editor types (optional for better type safety)
export type YooptaBlockType = 
  | 'paragraph'
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'blockquote'
  | 'code'
  | 'image'
  | 'divider'
  | 'ordered-list'
  | 'unordered-list'
  | 'list-item';

export type YooptaBlock = {
  id: string;
  type: YooptaBlockType;
  children?: any[];
  content?: string;
  url?: string;
  alt?: string;
};

export type YooptaContent = YooptaBlock[];
