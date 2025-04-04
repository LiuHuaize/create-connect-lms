export interface Course {
  id?: string;
  created_at?: string;
  title: string;
  short_description?: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: string;
  language?: string;
  user_id?: string;
  price?: number;
  discount?: number;
  start_date?: string;
  end_date?: string;
  status?: 'draft' | 'published' | 'archived';
  cover_image?: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id?: string;
  created_at?: string;
  title: string;
  description?: string;
  course_id?: string;
  order?: number;
  lessons?: CourseLesson[];
}

export interface CourseLesson {
  id?: string;
  title: string;
  type: string;
  content?: string;
  module_id?: string;
  order?: number;
  duration?: number;
  status?: 'draft' | 'published';
  video_url?: string;
  completed?: boolean;
}
