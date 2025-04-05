
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
  user_info?: {
    username: string;
  };
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
  user_info?: {
    username: string;
  };
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
        .select(`
          *,
          profiles:profiles(username)
        `);
      
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
      
      // 处理用户信息
      return data.map(item => ({
        ...item,
        user_info: {
          username: item.profiles?.username || '未知用户'
        }
      })) as Discussion[];
    } catch (error) {
      console.error('获取讨论列表出错:', error);
      return [];
    }
  },
  
  // 获取热门话题
  async getTopics(): Promise<Topic[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('posts_count', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('获取热门话题失败:', error);
        throw error;
      }
      
      return data as Topic[];
    } catch (error) {
      console.error('获取热门话题出错:', error);
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
      const { data: existingLike } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (existingLike) {
        // 已点赞，取消点赞
        const { error: deleteError } = await supabase
          .from('discussion_likes')
          .delete()
          .eq('discussion_id', discussionId)
          .eq('user_id', userData.user.id);
        
        if (deleteError) {
          console.error('取消点赞失败:', deleteError);
          return false;
        }
        
        // 更新讨论的点赞计数
        await supabase.rpc('decrement_discussion_like', { discussion_id_param: discussionId });
        
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
        await supabase.rpc('increment_discussion_like', { discussion_id_param: discussionId });
        
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
      
      const { data } = await supabase
        .from('discussion_likes')
        .select('*')
        .eq('discussion_id', discussionId)
        .eq('user_id', userData.user.id)
        .single();
      
      return !!data;
    } catch (error) {
      console.error('检查点赞状态出错:', error);
      return false;
    }
  }
};
