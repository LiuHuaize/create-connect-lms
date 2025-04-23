export interface CardCreatorTask {
  id?: string;
  course_id: string;
  title: string;
  instructions: string;
  template_type: 'image' | 'text';
  template_image_url?: string;
  template_description?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
}

export interface CardSubmission {
  id?: string;
  task_id: string;
  student_id: string;
  content: string;
  card_image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CardTemplatePreset {
  id?: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
} 