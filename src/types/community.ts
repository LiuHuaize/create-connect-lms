
// Define the types explicitly instead of relying on the Supabase generated types

export interface Topic {
  id: string;
  name: string;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface DiscussionLike {
  id: string;
  discussion_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface DiscussionWithProfile extends Discussion {
  profile: {
    username: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
}

export interface CommentWithProfile extends Comment {
  profile: {
    username: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
}
