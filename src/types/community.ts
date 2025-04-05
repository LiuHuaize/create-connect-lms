
import { Database } from "@/integrations/supabase/types";

export type Topic = Database["public"]["Tables"]["topics"]["Row"];
export type Discussion = Database["public"]["Tables"]["discussions"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type DiscussionLike = Database["public"]["Tables"]["discussion_likes"]["Row"];
export type CommentLike = Database["public"]["Tables"]["comment_likes"]["Row"];

export type DiscussionWithProfile = Discussion & {
  profile: {
    username: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
};

export type CommentWithProfile = Comment & {
  profile: {
    username: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
};
