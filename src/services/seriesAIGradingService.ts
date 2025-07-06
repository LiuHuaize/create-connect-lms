import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from '@/utils/userSession';

/**
 * 专门处理系列问答AI评分数据保存的服务
 * 使用简化的逻辑避免RLS权限问题
 */
export const seriesAIGradingService = {
  /**
   * 保存AI评分结果 - 使用删除重插的安全策略
   */
  async saveAIGrading(submissionId: string, gradingResult: any) {
    try {
      console.log('🚀 开始保存AI评分结果:', { submissionId, gradingResult });
      
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 准备保存的数据
      const gradingData = {
        submission_id: submissionId,
        ai_score: gradingResult.overall_score || gradingResult.ai_score || 0,
        ai_feedback: typeof gradingResult.ai_feedback === 'string' 
          ? gradingResult.ai_feedback 
          : JSON.stringify(gradingResult),
        ai_detailed_feedback: gradingResult.ai_detailed_feedback || gradingResult.detailed_feedback || null,
        final_score: gradingResult.final_score || gradingResult.overall_score || gradingResult.ai_score || 0,
        grading_criteria_used: gradingResult.grading_criteria_used || null,
        graded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 准备保存的数据:', gradingData);

      // 安全策略：先删除现有记录，避免唯一约束冲突
      console.log('🗑️ 删除可能存在的旧评分记录...');
      await (supabase as any)
        .from('series_ai_gradings')
        .delete()
        .eq('submission_id', submissionId);

      // 插入新记录
      console.log('✨ 插入新的AI评分记录...');
      const { data: newGrading, error: insertError } = await (supabase as any)
        .from('series_ai_gradings')
        .insert(gradingData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ 插入AI评分记录失败:', insertError);
        throw insertError;
      }

      console.log('✅ AI评分记录保存成功:', newGrading.id);

      // 更新提交状态
      console.log('📊 更新提交状态为已评分...');
      const { error: statusError } = await (supabase as any)
        .from('series_submissions')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (statusError) {
        console.warn('⚠️ 更新提交状态失败(但评分已保存):', statusError);
      } else {
        console.log('✅ 提交状态更新成功');
      }

      return {
        success: true,
        data: newGrading
      };

    } catch (error) {
      console.error('💥 保存AI评分结果失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存AI评分结果失败'
      };
    }
  },

  /**
   * 获取AI评分结果
   */
  async getAIGrading(submissionId: string) {
    try {
      console.log('🔍 查询AI评分结果:', submissionId);
      
      const { data, error } = await supabase
        .from('series_ai_gradings' as any)
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ 查询AI评分失败:', error);
        throw error;
      }

      console.log('✅ 查询AI评分结果:', data);
      return data;

    } catch (error) {
      console.error('💥 获取AI评分结果失败:', error);
      throw error;
    }
  }
};