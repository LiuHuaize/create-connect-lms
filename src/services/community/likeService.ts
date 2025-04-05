
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// 点赞讨论
export async function likeDiscussion(discussionId: string): Promise<boolean> {
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
}

// 检查用户是否已点赞某讨论
export async function hasLikedDiscussion(discussionId: string): Promise<boolean> {
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
}
