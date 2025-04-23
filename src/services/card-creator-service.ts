import { supabase } from '@/integrations/supabase/client';
import { CardCreatorTask, CardSubmission, CardTemplatePreset } from '@/types/card-creator';

const CARD_TASKS_TABLE = 'card_creator_tasks';
const CARD_SUBMISSIONS_TABLE = 'card_creator_submissions';
const CARD_PRESETS_TABLE = 'card_template_presets';

export const CardCreatorService = {
  // 任务相关
  async createTask(task: CardCreatorTask): Promise<CardCreatorTask | null> {
    const { data, error } = await supabase
      .from(CARD_TASKS_TABLE)
      .insert(task)
      .select()
      .single();
    
    if (error) {
      console.error('创建卡片任务失败:', error);
      return null;
    }
    
    return data;
  },
  
  async updateTask(id: string, updates: Partial<CardCreatorTask>): Promise<CardCreatorTask | null> {
    const { data, error } = await supabase
      .from(CARD_TASKS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('更新卡片任务失败:', error);
      return null;
    }
    
    return data;
  },
  
  async getTaskById(id: string): Promise<CardCreatorTask | null> {
    const { data, error } = await supabase
      .from(CARD_TASKS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('获取卡片任务失败:', error);
      return null;
    }
    
    return data;
  },
  
  async getTasksByCourse(courseId: string): Promise<CardCreatorTask[]> {
    const { data, error } = await supabase
      .from(CARD_TASKS_TABLE)
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取课程卡片任务失败:', error);
      return [];
    }
    
    return data || [];
  },
  
  async deleteTask(id: string): Promise<boolean> {
    const { error } = await supabase
      .from(CARD_TASKS_TABLE)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('删除卡片任务失败:', error);
      return false;
    }
    
    return true;
  },
  
  // 提交相关
  async createSubmission(submission: CardSubmission): Promise<CardSubmission | null> {
    const { data, error } = await supabase
      .from(CARD_SUBMISSIONS_TABLE)
      .insert(submission)
      .select()
      .single();
    
    if (error) {
      console.error('创建卡片提交失败:', error);
      return null;
    }
    
    return data;
  },
  
  async updateSubmission(id: string, updates: Partial<CardSubmission>): Promise<CardSubmission | null> {
    const { data, error } = await supabase
      .from(CARD_SUBMISSIONS_TABLE)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('更新卡片提交失败:', error);
      return null;
    }
    
    return data;
  },
  
  async getSubmissionsByTaskId(taskId: string): Promise<CardSubmission[]> {
    const { data, error } = await supabase
      .from(CARD_SUBMISSIONS_TABLE)
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取任务提交失败:', error);
      return [];
    }
    
    return data || [];
  },
  
  async getUserSubmissionsByTaskId(taskId: string, studentId: string): Promise<CardSubmission[]> {
    const { data, error } = await supabase
      .from(CARD_SUBMISSIONS_TABLE)
      .select('*')
      .eq('task_id', taskId)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取用户任务提交失败:', error);
      return [];
    }
    
    return data || [];
  },
  
  // 模板预设相关
  async createPreset(preset: CardTemplatePreset): Promise<CardTemplatePreset | null> {
    const { data, error } = await supabase
      .from(CARD_PRESETS_TABLE)
      .insert(preset)
      .select()
      .single();
    
    if (error) {
      console.error('创建模板预设失败:', error);
      return null;
    }
    
    return data;
  },
  
  async getPresets(userId: string): Promise<CardTemplatePreset[]> {
    const { data, error } = await supabase
      .from(CARD_PRESETS_TABLE)
      .select('*')
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('获取模板预设失败:', error);
      return [];
    }
    
    return data || [];
  }
}; 