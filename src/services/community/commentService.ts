
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Comment } from './types';

// 获取讨论的评论
export async function getComments(discussionId: string): Promise<Comment[]> {
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
}

// 添加评论
export async function addComment(discussionId: string, content: string): Promise<Comment | null> {
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
