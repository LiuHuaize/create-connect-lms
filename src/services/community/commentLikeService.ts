
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// 点赞评论
export async function likeComment(commentId: string): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      toast({
        title: "操作失败",
        description: "您需要登录才能点赞评论。",
        variant: "destructive"
      });
      return false;
    }
    
    // 检查是否已点赞
    const { data: existingLike, error: checkError } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    if (checkError) {
      console.error('检查评论点赞状态失败:', checkError);
      return false;
    }
    
    if (existingLike) {
      // 已点赞，取消点赞
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userData.user.id);
      
      if (deleteError) {
        console.error('取消评论点赞失败:', deleteError);
        return true; // 返回当前状态，仍然是已点赞
      }
      
      // 更新评论的点赞计数
      await supabase.rpc('decrement', { 
        row_id: commentId, 
        table_name: 'comments', 
        column_name: 'likes_count' 
      });
      
      return false; // 返回新状态：未点赞
    } else {
      // 未点赞，添加点赞
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userData.user.id
        });
      
      if (insertError) {
        console.error('评论点赞失败:', insertError);
        return false;
      }
      
      // 更新评论的点赞计数
      await supabase.rpc('increment', { 
        row_id: commentId, 
        table_name: 'comments', 
        column_name: 'likes_count' 
      });
      
      return true; // 返回新状态：已点赞
    }
  } catch (error) {
    console.error('评论点赞操作出错:', error);
    return false;
  }
}

// 检查用户是否已点赞某评论
export async function hasLikedComment(commentId: string): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return false;
    }
    
    const { data, error } = await supabase
      .from('comment_likes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('检查评论点赞状态失败:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('检查评论点赞状态出错:', error);
    return false;
  }
}
