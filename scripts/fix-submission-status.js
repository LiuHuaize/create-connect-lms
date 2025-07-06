#!/usr/bin/env node

/**
 * 修复提交状态脚本
 * 将有AI评分但状态仍为submitted的提交更新为graded状态
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

// 配置
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 初始化 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * 查找需要修复的提交
 */
async function findSubmissionsToFix() {
  info('查找需要修复状态的提交...');
  
  try {
    // 查找状态为submitted但有AI评分的提交
    const { data: submissions, error } = await supabase
      .from('series_submissions')
      .select(`
        id,
        status,
        submitted_at,
        questionnaire_id,
        student_id,
        series_ai_gradings!inner(
          id,
          ai_score,
          created_at
        )
      `)
      .eq('status', 'submitted');

    if (error) {
      error(`查询提交失败: ${error.message}`);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      success('没有找到需要修复的提交');
      return [];
    }

    log(`\n📋 找到 ${submissions.length} 个需要修复的提交:`, 'magenta');
    submissions.forEach((sub, index) => {
      log(`${index + 1}. 提交ID: ${sub.id}`, 'cyan');
      log(`   状态: ${sub.status} (应该是 graded)`, 'yellow');
      log(`   AI评分: ${sub.series_ai_gradings[0]?.ai_score}分`, 'green');
      log(`   提交时间: ${sub.submitted_at}`, 'reset');
      log('');
    });

    return submissions;
  } catch (err) {
    error(`查找提交异常: ${err.message}`);
    return [];
  }
}

/**
 * 修复单个提交的状态
 */
async function fixSubmissionStatus(submissionId) {
  try {
    const { error } = await supabase
      .from('series_submissions')
      .update({
        status: 'graded',
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) {
      error(`修复提交 ${submissionId} 失败: ${error.message}`);
      return false;
    }

    success(`提交 ${submissionId} 状态已修复为 graded`);
    return true;
  } catch (err) {
    error(`修复提交 ${submissionId} 异常: ${err.message}`);
    return false;
  }
}

/**
 * 验证修复结果
 */
async function verifyFix() {
  info('验证修复结果...');
  
  try {
    // 检查是否还有submitted状态但有AI评分的提交
    const { data: remainingSubmissions, error } = await supabase
      .from('series_submissions')
      .select(`
        id,
        status,
        series_ai_gradings!inner(id)
      `)
      .eq('status', 'submitted');

    if (error) {
      error(`验证失败: ${error.message}`);
      return false;
    }

    if (!remainingSubmissions || remainingSubmissions.length === 0) {
      success('✨ 所有提交状态已正确修复！');
      return true;
    } else {
      warning(`仍有 ${remainingSubmissions.length} 个提交需要修复`);
      return false;
    }
  } catch (err) {
    error(`验证异常: ${err.message}`);
    return false;
  }
}

/**
 * 检查修复后的数据
 */
async function checkFixedData() {
  info('检查修复后的数据...');
  
  try {
    const { data: gradedSubmissions, error } = await supabase
      .from('series_submissions')
      .select(`
        id,
        status,
        questionnaire_id,
        series_ai_gradings(
          id,
          ai_score,
          final_score
        )
      `)
      .eq('status', 'graded');

    if (error) {
      error(`查询已评分提交失败: ${error.message}`);
      return;
    }

    if (!gradedSubmissions || gradedSubmissions.length === 0) {
      warning('没有找到已评分的提交');
      return;
    }

    log(`\n📊 已评分提交概览 (${gradedSubmissions.length} 个):`, 'magenta');
    gradedSubmissions.forEach((sub, index) => {
      const grading = sub.series_ai_gradings[0];
      log(`${index + 1}. 提交ID: ${sub.id}`, 'cyan');
      log(`   状态: ${sub.status}`, 'green');
      log(`   AI评分: ${grading?.ai_score || '未知'}分`, 'green');
      log(`   最终分数: ${grading?.final_score || grading?.ai_score || '未知'}分`, 'green');
      log('');
    });
  } catch (err) {
    error(`检查修复后数据异常: ${err.message}`);
  }
}

/**
 * 主函数
 */
async function main() {
  log('🔧 开始修复提交状态', 'magenta');
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    error('缺少必要的环境变量，请检查 .env.local 文件');
    process.exit(1);
  }

  // 1. 查找需要修复的提交
  const submissionsToFix = await findSubmissionsToFix();
  
  if (submissionsToFix.length === 0) {
    log('🎉 没有需要修复的提交', 'green');
    return;
  }

  // 2. 逐个修复提交状态
  let fixedCount = 0;
  for (const submission of submissionsToFix) {
    const success = await fixSubmissionStatus(submission.id);
    if (success) {
      fixedCount++;
    }
  }

  log(`\n📈 修复统计:`, 'magenta');
  log(`总计: ${submissionsToFix.length} 个提交`, 'cyan');
  log(`成功: ${fixedCount} 个`, 'green');
  log(`失败: ${submissionsToFix.length - fixedCount} 个`, 'red');

  // 3. 验证修复结果
  const verifySuccess = await verifyFix();
  
  // 4. 检查修复后的数据
  await checkFixedData();

  if (verifySuccess) {
    log('\n🎉 提交状态修复完成！', 'green');
    log('现在学生应该能够看到AI评分结果了', 'green');
  } else {
    log('\n⚠️  修复可能不完整，请检查日志', 'yellow');
  }
}

// 运行修复
main().catch(console.error);
