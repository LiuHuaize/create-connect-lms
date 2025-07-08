/**
 * 清理复制课程时误复制的用户状态数据
 * 
 * 这个脚本用于清理以下情况：
 * 1. series_submissions 中的无效记录（学生ID与当前用户不匹配）
 * 2. lesson_completions 中的无效记录
 * 3. 孤立的 series_ai_gradings 记录
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDuplicatedUserStates() {
  console.log('开始清理复制课程时误复制的用户状态数据...');

  try {
    // 1. 清理 series_submissions 中的无效记录
    // 找出所有提交记录，其中学生不是课程的实际注册者
    console.log('\n1. 检查并清理无效的系列问答提交记录...');
    
    const { data: invalidSubmissions, error: submissionsError } = await supabase
      .from('series_submissions')
      .select(`
        id,
        student_id,
        lesson_id,
        lessons!inner(
          module_id,
          course_modules!inner(
            course_id,
            courses!inner(
              id,
              title
            )
          )
        )
      `);

    if (submissionsError) {
      console.error('查询无效提交记录失败:', submissionsError);
      return;
    }

    console.log(`找到 ${invalidSubmissions?.length || 0} 条提交记录需要验证`);

    // 验证每条记录
    let cleanedCount = 0;
    for (const submission of invalidSubmissions || []) {
      // 检查学生是否真的注册了这门课
      const courseId = submission.lessons.course_modules.course_id;
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', submission.student_id)
        .single();

      if (!enrollment) {
        // 学生没有注册这门课，删除提交记录
        console.log(`删除无效提交记录: ${submission.id} (学生 ${submission.student_id} 未注册课程 ${courseId})`);
        
        // 先删除相关的AI评分记录
        await supabase
          .from('series_ai_gradings')
          .delete()
          .eq('submission_id', submission.id);

        // 再删除提交记录
        await supabase
          .from('series_submissions')
          .delete()
          .eq('id', submission.id);

        cleanedCount++;
      }
    }

    console.log(`清理了 ${cleanedCount} 条无效的提交记录`);

    // 2. 清理 lesson_completions 中的无效记录
    console.log('\n2. 检查并清理无效的课时完成记录...');
    
    const { data: invalidCompletions, error: completionsError } = await supabase
      .from('lesson_completions')
      .select(`
        id,
        student_id,
        lesson_id,
        lessons!inner(
          module_id,
          course_modules!inner(
            course_id
          )
        )
      `);

    if (completionsError) {
      console.error('查询无效完成记录失败:', completionsError);
      return;
    }

    console.log(`找到 ${invalidCompletions?.length || 0} 条完成记录需要验证`);

    // 验证每条记录
    let cleanedCompletions = 0;
    for (const completion of invalidCompletions || []) {
      // 检查学生是否真的注册了这门课
      const courseId = completion.lessons.course_modules.course_id;
      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('student_id', completion.student_id)
        .single();

      if (!enrollment) {
        // 学生没有注册这门课，删除完成记录
        console.log(`删除无效完成记录: ${completion.id} (学生 ${completion.student_id} 未注册课程 ${courseId})`);
        
        await supabase
          .from('lesson_completions')
          .delete()
          .eq('id', completion.id);

        cleanedCompletions++;
      }
    }

    console.log(`清理了 ${cleanedCompletions} 条无效的完成记录`);

    // 3. 清理孤立的 series_ai_gradings 记录
    console.log('\n3. 检查并清理孤立的AI评分记录...');
    
    const { data: orphanedGradings, error: gradingsError } = await supabase
      .from('series_ai_gradings')
      .select('id, submission_id')
      .is('submission_id', null);

    if (gradingsError) {
      console.error('查询孤立评分记录失败:', gradingsError);
      return;
    }

    if (orphanedGradings && orphanedGradings.length > 0) {
      console.log(`找到 ${orphanedGradings.length} 条孤立的AI评分记录`);
      
      const orphanedIds = orphanedGradings.map(g => g.id);
      const { error: deleteError } = await supabase
        .from('series_ai_gradings')
        .delete()
        .in('id', orphanedIds);

      if (deleteError) {
        console.error('删除孤立评分记录失败:', deleteError);
      } else {
        console.log(`成功删除 ${orphanedGradings.length} 条孤立的AI评分记录`);
      }
    } else {
      console.log('没有找到孤立的AI评分记录');
    }

    console.log('\n清理完成！');
    
  } catch (error) {
    console.error('清理过程中出错:', error);
  }
}

// 运行清理脚本
cleanDuplicatedUserStates();