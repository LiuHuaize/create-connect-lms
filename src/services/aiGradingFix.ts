import { supabase } from "@/integrations/supabase/client";

/**
 * 修复AI评分唯一约束冲突的工具函数
 */
export const aiGradingFix = {
  /**
   * 安全地保存或更新AI评分记录
   */
  async saveOrUpdateAIGrading(submissionId: string, gradingData: any) {
    try {
      console.log('🔧 开始安全保存AI评分记录:', submissionId);
      
      // 首先删除可能存在的旧记录
      console.log('🗑️ 删除旧的评分记录...');
      await (supabase as any)
        .from('series_ai_gradings')
        .delete()
        .eq('submission_id', submissionId);

      // 插入新记录
      console.log('✨ 插入新的评分记录...');
      const insertData = {
        submission_id: submissionId,
        ai_score: gradingData.ai_score || gradingData.overall_score || 0,
        ai_feedback: typeof gradingData.ai_feedback === 'string' 
          ? gradingData.ai_feedback 
          : JSON.stringify(gradingData),
        ai_detailed_feedback: gradingData.ai_detailed_feedback || gradingData.detailed_feedback || null,
        final_score: gradingData.final_score || gradingData.ai_score || gradingData.overall_score || 0,
        grading_criteria_used: gradingData.grading_criteria_used || null,
        graded_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newGrading, error: insertError } = await (supabase as any)
        .from('series_ai_gradings')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ 插入评分记录失败:', insertError);
        throw insertError;
      }

      console.log('✅ AI评分记录保存成功:', newGrading.id);

      // 更新提交状态
      await (supabase as any)
        .from('series_submissions')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      return {
        success: true,
        data: newGrading
      };

    } catch (error) {
      console.error('💥 保存AI评分失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存AI评分失败'
      };
    }
  },

  /**
   * 安全地保存或更新教师评分记录
   */
  async saveOrUpdateTeacherGrading(submissionId: string, teacherData: any) {
    try {
      console.log('🔧 开始安全保存教师评分记录:', submissionId);
      
      // 获取现有记录
      const { data: existingGrading } = await (supabase as any)
        .from('series_ai_gradings')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      const gradingData = {
        submission_id: submissionId,
        teacher_score: teacherData.teacher_score,
        teacher_feedback: teacherData.teacher_feedback || null,
        final_score: teacherData.teacher_score,
        teacher_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 保留现有的AI评分数据
        ...(existingGrading && {
          ai_score: existingGrading.ai_score,
          ai_feedback: existingGrading.ai_feedback,
          ai_detailed_feedback: existingGrading.ai_detailed_feedback,
          grading_criteria_used: existingGrading.grading_criteria_used,
          graded_at: existingGrading.graded_at
        })
      };

      let result;
      if (existingGrading) {
        // 更新现有记录
        const { data: updatedGrading, error: updateError } = await (supabase as any)
          .from('series_ai_gradings')
          .update(gradingData)
          .eq('id', existingGrading.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        result = updatedGrading;
      } else {
        // 创建新记录
        gradingData.created_at = new Date().toISOString();
        
        const { data: newGrading, error: insertError } = await (supabase as any)
          .from('series_ai_gradings')
          .insert(gradingData)
          .select()
          .single();
        
        if (insertError) throw insertError;
        result = newGrading;
      }

      // 更新提交状态
      await (supabase as any)
        .from('series_submissions')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      console.error('💥 保存教师评分失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存教师评分失败'
      };
    }
  }
};