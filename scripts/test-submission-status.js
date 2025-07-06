#!/usr/bin/env node

/**
 * 测试学生提交状态API
 * 用于验证 can_submit 字段是否正确返回
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSubmissionStatus() {
  console.log('🚀 测试学生提交状态API...\n');

  try {
    // 1. 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ 用户未登录，请先登录');
      return;
    }

    console.log(`✅ 当前用户: ${user.email}`);

    // 2. 查找系列问答
    const { data: questionnaires, error: questionnaireError } = await supabase
      .from('series_questionnaires')
      .select('id, title')
      .limit(5);

    if (questionnaireError) {
      throw new Error(`查询问卷失败: ${questionnaireError.message}`);
    }

    if (!questionnaires || questionnaires.length === 0) {
      console.log('❌ 没有找到系列问答');
      return;
    }

    console.log(`✅ 找到 ${questionnaires.length} 个问卷`);

    // 3. 测试每个问卷的提交状态
    for (const questionnaire of questionnaires) {
      console.log(`\n📋 测试问卷: ${questionnaire.title} (ID: ${questionnaire.id})`);

      // 查询提交状态
      const { data: submission, error } = await supabase
        .from('series_submissions')
        .select(`
          id,
          status,
          answers,
          total_words,
          time_spent_minutes,
          submitted_at,
          updated_at
        `)
        .eq('questionnaire_id', questionnaire.id)
        .eq('student_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log(`   ❌ 查询失败: ${error.message}`);
        continue;
      }

      // 构建状态数据（模拟服务方法的逻辑）
      const statusData = {
        submission: submission || null,
        has_submission: !!submission,
        can_submit: !submission || submission.status === 'draft',
        time_remaining: null
      };

      console.log('   📊 提交状态:');
      console.log(`      - 有提交记录: ${statusData.has_submission}`);
      console.log(`      - 可以提交: ${statusData.can_submit}`);
      console.log(`      - 提交状态: ${submission?.status || '无'}`);
      console.log(`      - 提交时间: ${submission?.submitted_at || '无'}`);

      // 检查缓存键
      const cacheKey = `submission_status_${questionnaire.id}_${user.id}`;
      console.log(`   🔑 缓存键: ${cacheKey}`);

      // 清理缓存
      localStorage.removeItem(cacheKey);
      console.log('   🧹 已清理缓存');
    }

    console.log('\n🎉 测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testSubmissionStatus().then(() => {
  console.log('\n测试结束');
  process.exit(0);
}).catch((error) => {
  console.error('测试异常:', error);
  process.exit(1);
});
