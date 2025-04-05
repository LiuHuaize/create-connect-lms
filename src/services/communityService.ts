
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

export const communityService = {
  // 获取讨论列表
  async getDiscussions(filter: 'trending' | 'latest' | 'popular' | 'following' = 'trending'): Promise<Discussion[]> {
    try {
      let query = supabase
        .from('discussions')
        .select('*');
      
      // 根据过滤条件排序
      switch (filter) {
        case 'latest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'trending':
        default:
          // 综合热度排序（结合点赞数和评论数）
          query = query.order('likes_count', { ascending: false }).order('comments_count', { ascending: false });
          break;
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) {
        console.error('获取讨论列表失败:', error);
        throw error;
      }
      
      // 如果成功获取讨论列表，再获取每个讨论作者的用户名
      const discussions = data as Discussion[];
      
      // 获取用户信息
      for (const discussion of discussions) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', discussion.user_id)
          .maybeSingle();
        
        if (!userError && userData) {
          discussion.username = userData.username;
        } else {
          discussion.username = '未知用户';
        }
      }
      
      return discussions;
    } catch (error) {
      console.error('获取讨论列表出错:', error);
      return [];
    }
  },
  
  // 发布新讨论
  async createDiscussion(title: string, content: string, tags: string[] = []): Promise<Discussion | null> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "操作失败",
          description: "您需要登录才能发布讨论。",
          variant: "destructive"
        });
        return null;
      }
      
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          user_id: userData.user.id,
          title,
          content,
          tags
        })
        .select()
        .single();
      
      if (error) {
        console.error('创建讨论失败:', error);
        toast({
          title: "发布失败",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "发布成功",
        description: "您的讨论已成功发布。"
      });
      
      return data as Discussion;
    } catch (error) {
      console.error('创建讨论出错:', error);
      return null;
    }
  },
  
  // 点赞讨论
  async likeDiscussion(discussionId: string): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "操作失败",
          description: "您需要登录才能点赞。",
          variant: "destructive"
        });
        return false;
      }
      
      // 检查是否已点赞
      const { data: existingLike, error: checkError } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('检查点赞状态失败:', checkError);
        return false;
      }
      
      if (existingLike) {
        // 已点赞，取消点赞
        const { error: deleteError } = await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', userData.user.id);
        
        if (deleteError) {
          console.error('取消点赞失败:', deleteError);
          return true; // 返回当前状态，仍然是已点赞
        }
        
        // 更新讨论的点赞计数
        const { error: rpcError } = await supabase.rpc('decrement_discussion_like', { discussion_id_param: discussionId });
        
        if (rpcError) {
          console.error('更新点赞计数失败:', rpcError);
        }
        
        return false; // 返回新状态：未点赞
      } else {
        // 未点赞，添加点赞
        const { error: insertError } = await supabase
          .from('discussion_likes')
          .insert({
            discussion_id: discussionId,
            user_id: userData.user.id
          });
        
        if (insertError) {
          console.error('点赞失败:', insertError);
          return false;
        }
        
        // 更新讨论的点赞计数
        const { error: rpcError } = await supabase.rpc('increment_discussion_like', { discussion_id_param: discussionId });
        
        if (rpcError) {
          console.error('更新点赞计数失败:', rpcError);
        }
        
        return true; // 返回新状态：已点赞
      }
    } catch (error) {
      console.error('点赞操作出错:', error);
      return false;
    }
  },
  
  // 检查用户是否已点赞某讨论
  async hasLikedDiscussion(discussionId: string): Promise<boolean> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      if (error) {
        console.error('检查点赞状态失败:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('检查点赞状态出错:', error);
      return false;
    }
  },

  // 获取讨论的评论
  async getComments(discussionId: string): Promise<Comment[]> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('获取评论失败:', error);
        throw error;
      }
      
      const comments = data as Comment[];
      
      // 获取评论用户的信息
      for (const comment of comments) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', comment.user_id)
          .maybeSingle();
        
        if (!userError && userData) {
          comment.username = userData.username;
        } else {
          comment.username = '未知用户';
        }
      }
      
      return comments;
    } catch (error) {
      console.error('获取评论出错:', error);
      return [];
    }
  },
  
  // 添加评论
  async addComment(discussionId: string, content: string): Promise<Comment | null> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        toast({
          title: "操作失败",
          description: "您需要登录才能发表评论。",
          variant: "destructive"
        });
        return null;
      }
      
      // 添加评论
      const { data, error } = await supabase
        .from('comments')
        .insert({
          discussion_id: discussionId,
          user_id: userData.user.id,
          content
        })
        .select()
        .single();
      
      if (error) {
        console.error('添加评论失败:', error);
        throw error;
      }
      
      // 更新讨论的评论计数
      const { error: rpcError } = await supabase.rpc('increment_discussion_comment', { discussion_id_param: discussionId });
      
      if (rpcError) {
        console.error('更新评论计数失败:', rpcError);
      }
      
      return data as Comment;
    } catch (error) {
      console.error('添加评论出错:', error);
      return null;
    }
  }
};
