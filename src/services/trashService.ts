import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export type TrashItemType = 'module' | 'lesson' | 'course';

export interface TrashItem {
  id: string;
  original_id: string;
  item_type: TrashItemType;
  title: string;
  content: any;
  parent_id?: string;
  course_id?: string;
  user_id: string;
  deleted_at: string;
  expires_at: string;
  metadata?: any;
}

// 将项目移到回收站
export const moveToTrash = async (
  originalId: string,
  itemType: TrashItemType,
  title: string,
  content: any,
  parentId?: string,
  courseId?: string,
  metadata?: any
) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('trash_items')
      .insert({
        original_id: originalId,
        item_type: itemType,
        title,
        content,
        parent_id: parentId || null,
        course_id: courseId || null,
        user_id: user.user.id,
        metadata,
      })
      .select();

    if (error) {
      console.error('移动到回收站失败:', error);
      throw error;
    }

    return data[0];
  } catch (error: any) {
    console.error('移动到回收站失败:', error);
    toast({
      title: '移动到回收站失败',
      description: error.message,
      variant: 'destructive',
    });
    return null;
  }
};

// 获取回收站项目列表
export const getTrashItems = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('trash_items')
      .select('*')
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('获取回收站项目失败:', error);
      throw error;
    }

    return data as TrashItem[];
  } catch (error: any) {
    console.error('获取回收站项目失败:', error);
    toast({
      title: '获取回收站项目失败',
      description: error.message,
      variant: 'destructive',
    });
    return [];
  }
};

// 恢复回收站项目
export const restoreTrashItem = async (trashItemId: string) => {
  try {
    // 首先获取回收站项目
    const { data: trashItems, error: fetchError } = await supabase
      .from('trash_items')
      .select('*')
      .eq('id', trashItemId)
      .limit(1);

    if (fetchError || !trashItems || trashItems.length === 0) {
      console.error('获取回收站项目失败:', fetchError);
      throw fetchError || new Error('未找到回收站项目');
    }
    
    const trashItem = trashItems[0] as TrashItem;
    
    // 根据不同类型执行不同的恢复逻辑
    switch (trashItem.item_type) {
      case 'course':
        await restoreCourse(trashItem);
        break;
      case 'module':
        await restoreModule(trashItem);
        break;
      case 'lesson':
        await restoreLesson(trashItem);
        break;
      default:
        throw new Error(`不支持的项目类型: ${trashItem.item_type}`);
    }
    
    // 删除回收站项目
    const { error: deleteError } = await supabase
      .from('trash_items')
      .delete()
      .eq('id', trashItemId);
      
    if (deleteError) {
      console.error('删除回收站项目失败:', deleteError);
      throw deleteError;
    }
    
    toast({
      title: '项目已恢复',
      description: `${trashItem.title} 已成功恢复`,
    });
    
    return true;
  } catch (error: any) {
    console.error('恢复项目失败:', error);
    toast({
      title: '恢复项目失败',
      description: error.message,
      variant: 'destructive',
    });
    return false;
  }
};

// 永久删除回收站项目
export const deleteTrashItemPermanently = async (trashItemId: string) => {
  try {
    const { error } = await supabase
      .from('trash_items')
      .delete()
      .eq('id', trashItemId);
      
    if (error) {
      console.error('永久删除项目失败:', error);
      throw error;
    }
    
    toast({
      title: '项目已永久删除',
    });
    
    return true;
  } catch (error: any) {
    console.error('永久删除项目失败:', error);
    toast({
      title: '永久删除项目失败',
      description: error.message,
      variant: 'destructive',
    });
    return false;
  }
};

// 清空过期项目
export const cleanupExpiredItems = async () => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('用户未登录');
    }

    const { error } = await supabase
      .from('trash_items')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .eq('user_id', user.user.id);
      
    if (error) {
      console.error('清理过期项目失败:', error);
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('清理过期项目失败:', error);
    return false;
  }
};

// 私有辅助函数 - 恢复课程
const restoreCourse = async (trashItem: TrashItem) => {
  // 这里实现课程恢复逻辑
  const { error } = await supabase
    .from('courses')
    .update({ deleted_at: null })
    .eq('id', trashItem.original_id);
    
  if (error) {
    throw error;
  }
};

// 私有辅助函数 - 恢复模块
const restoreModule = async (trashItem: TrashItem) => {
  // 这里实现模块恢复逻辑
  const { error } = await supabase
    .from('modules')
    .update({ deleted_at: null })
    .eq('id', trashItem.original_id);
    
  if (error) {
    throw error;
  }
};

// 私有辅助函数 - 恢复课时
const restoreLesson = async (trashItem: TrashItem) => {
  // 这里实现课时恢复逻辑
  const { error } = await supabase
    .from('lessons')
    .update({ deleted_at: null })
    .eq('id', trashItem.original_id);
    
  if (error) {
    throw error;
  }
}; 