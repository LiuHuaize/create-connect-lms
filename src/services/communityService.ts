
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Discussion, Topic, Comment, DiscussionWithProfile, CommentWithProfile } from "@/types/community";

export const fetchDiscussions = async (filter: 'trending' | 'latest' | 'popular' | 'following' = 'trending') => {
  try {
    let query = supabase
      .from('discussions')
      .select(`
        *,
        profile:profiles(username)
      `)
      .order('created_at', { ascending: false });
    
    if (filter === 'popular') {
      query = query.order('likes_count', { ascending: false });
    } else if (filter === 'trending') {
      // 混合热度和时间排序
      query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
    }
    // 'following' 过滤需要用户登录和关注功能，后续实现
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data as unknown as DiscussionWithProfile[];
  } catch (error) {
    console.error('Error fetching discussions:', error);
    toast({
      title: "获取讨论失败",
      description: "请稍后再试",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchTopics = async () => {
  try {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('posts_count', { ascending: false });
    
    if (error) throw error;
    return data as unknown as Topic[];
  } catch (error) {
    console.error('Error fetching topics:', error);
    return [];
  }
};

export const createDiscussion = async (title: string, content: string, tags: string[] = []) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('discussions')
      .insert({
        title,
        content,
        tags,
        user_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "发布成功",
      description: "您的讨论已成功发布",
    });
    
    return data as unknown as Discussion;
  } catch (error) {
    console.error('Error creating discussion:', error);
    toast({
      title: "发布失败",
      description: "请检查您的输入并稍后再试",
      variant: "destructive"
    });
    return null;
  }
};

export const fetchComments = async (discussionId: string) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(username)
      `)
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as unknown as CommentWithProfile[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const createComment = async (discussionId: string, content: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { data, error } = await supabase
      .from('comments')
      .insert({
        discussion_id: discussionId,
        content,
        user_id: userData.user.id
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // 更新讨论的评论计数 - 使用原始SQL方式
    await supabase.rpc('increment', { 
      table_name: 'discussions',
      column_name: 'comments_count',
      row_id: discussionId
    });
    
    toast({
      title: "评论成功",
      description: "您的评论已发布",
    });
    
    return data as unknown as Comment;
  } catch (error) {
    console.error('Error creating comment:', error);
    toast({
      title: "评论失败",
      description: "请稍后再试",
      variant: "destructive"
    });
    return null;
  }
};

export const likeDiscussion = async (discussionId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    const { error } = await supabase
      .from('discussion_likes')
      .insert({
        discussion_id: discussionId,
        user_id: userData.user.id
      });
    
    if (error) {
      // 如果是唯一约束错误，说明用户已经点赞
      if (error.code === '23505') {
        // 移除点赞
        await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', userData.user.id);
        
        // 减少点赞计数 - 使用原始SQL方式
        await supabase.rpc('decrement', { 
          table_name: 'discussions',
          column_name: 'likes_count',
          row_id: discussionId
        });
        
        return { action: 'unliked' };
      } else {
        throw error;
      }
    } else {
      // 增加点赞计数 - 使用原始SQL方式
      await supabase.rpc('increment', { 
        table_name: 'discussions',
        column_name: 'likes_count',
        row_id: discussionId
      });
      
      return { action: 'liked' };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    toast({
      title: "操作失败",
      description: "请稍后再试",
      variant: "destructive"
    });
    return { action: 'error' };
  }
};

export const checkDiscussionLiked = async (discussionId: string) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return false;
    
    const { data, error } = await supabase
      .from('discussion_likes')
      .select('id')
      .eq('discussion_id', discussionId)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    if (error) throw error;
    return data !== null;
  } catch (error) {
    console.error('Error checking discussion like:', error);
    return false;
  }
};

// 辅助函数 - 获取用户信息
export const getUserProfile = async () => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// 辅助函数 - 生成用户头像缩写
export const getInitials = (username: string) => {
  if (!username) return 'U';
  return username.substring(0, 2).toUpperCase();
};

// 随机颜色生成，用于用户头像背景
export const getRandomColorClass = (userId: string) => {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-indigo-100 text-indigo-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];
  
  // 使用用户ID的最后一个字符作为索引
  const lastChar = userId.charAt(userId.length - 1);
  const index = parseInt(lastChar, 16) % colors.length;
  return colors[index];
};
