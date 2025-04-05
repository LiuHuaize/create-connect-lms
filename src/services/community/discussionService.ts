
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Discussion } from './types';

// 获取讨论列表
export async function getDiscussions(filter: 'trending' | 'latest' | 'popular' | 'following' = 'trending'): Promise<Discussion[]> {
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
}

// 发布新讨论
export async function createDiscussion(title: string, content: string, tags: string[] = []): Promise<Discussion | null> {
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
}
