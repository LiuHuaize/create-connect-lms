import { supabase } from '@/integrations/supabase/client';

/**
 * 修复提交状态错误的脚本
 * 将错误的 SIGNED_IN 状态更新为正确的 submitted 状态
 */
export async function fixSubmissionStatus() {
  try {
    console.log('开始修复提交状态...');
    
    // 查询所有状态为 SIGNED_IN 的提交记录
    const { data: wrongSubmissions, error: queryError } = await supabase
      .from('series_submissions')
      .select('*')
      .eq('status', 'SIGNED_IN');
    
    if (queryError) {
      console.error('查询错误提交记录失败:', queryError);
      return { success: false, error: queryError };
    }
    
    if (!wrongSubmissions || wrongSubmissions.length === 0) {
      console.log('没有找到需要修复的提交记录');
      return { success: true, fixedCount: 0 };
    }
    
    console.log(`找到 ${wrongSubmissions.length} 条需要修复的记录`);
    
    // 批量更新状态
    const { data: updatedData, error: updateError } = await supabase
      .from('series_submissions')
      .update({ 
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'SIGNED_IN')
      .select();
    
    if (updateError) {
      console.error('更新提交状态失败:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log(`成功修复 ${updatedData?.length || 0} 条记录`);
    
    // 对于已有 submitted_at 时间的记录，确保状态正确
    const { data: submittedRecords, error: submittedError } = await supabase
      .from('series_submissions')
      .select('*')
      .not('submitted_at', 'is', null)
      .in('status', ['draft', 'SIGNED_IN']);
    
    if (!submittedError && submittedRecords && submittedRecords.length > 0) {
      console.log(`发现 ${submittedRecords.length} 条有提交时间但状态不正确的记录`);
      
      const { data: fixedSubmitted, error: fixError } = await supabase
        .from('series_submissions')
        .update({ 
          status: 'submitted',
          updated_at: new Date().toISOString()
        })
        .not('submitted_at', 'is', null)
        .in('status', ['draft', 'SIGNED_IN'])
        .select();
      
      if (!fixError) {
        console.log(`修复了 ${fixedSubmitted?.length || 0} 条有提交时间的记录`);
      }
    }
    
    return { 
      success: true, 
      fixedCount: (updatedData?.length || 0) + (submittedRecords?.length || 0),
      details: {
        wrongStatus: updatedData?.length || 0,
        wrongWithTime: submittedRecords?.length || 0
      }
    };
    
  } catch (error) {
    console.error('修复提交状态时发生错误:', error);
    return { success: false, error };
  }
}

/**
 * 检查并诊断状态问题
 */
export async function diagnoseSubmissionStatus(submissionId?: string) {
  try {
    let query = supabase
      .from('series_submissions')
      .select('*');
    
    if (submissionId) {
      query = query.eq('id', submissionId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('诊断查询失败:', error);
      return { success: false, error };
    }
    
    const analysis = {
      total: data?.length || 0,
      byStatus: {} as Record<string, number>,
      invalidStatuses: [] as string[],
      inconsistent: [] as any[]
    };
    
    const validStatuses = ['draft', 'submitted', 'graded'];
    
    data?.forEach(submission => {
      // 统计各状态数量
      analysis.byStatus[submission.status] = (analysis.byStatus[submission.status] || 0) + 1;
      
      // 检查无效状态
      if (!validStatuses.includes(submission.status)) {
        if (!analysis.invalidStatuses.includes(submission.status)) {
          analysis.invalidStatuses.push(submission.status);
        }
      }
      
      // 检查状态一致性
      if (submission.submitted_at && submission.status === 'draft') {
        analysis.inconsistent.push({
          id: submission.id,
          status: submission.status,
          submitted_at: submission.submitted_at,
          issue: '有提交时间但状态为draft'
        });
      }
      
      if (!submission.submitted_at && submission.status === 'submitted') {
        analysis.inconsistent.push({
          id: submission.id,
          status: submission.status,
          submitted_at: submission.submitted_at,
          issue: '状态为submitted但没有提交时间'
        });
      }
    });
    
    console.log('诊断结果:', analysis);
    
    return { success: true, analysis };
    
  } catch (error) {
    console.error('诊断时发生错误:', error);
    return { success: false, error };
  }
}