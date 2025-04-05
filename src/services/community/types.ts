
import { User } from '@supabase/supabase-js';

export interface Discussion {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  tags: string[] | null;
  // 扩展属性
  username?: string;
}

export interface Comment {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  // 扩展属性
  username?: string;
}

export interface Topic {
  id: string;
  name: string;
  posts_count: number;
}

// Re-export the types for backward compatibility
export * from './types';
