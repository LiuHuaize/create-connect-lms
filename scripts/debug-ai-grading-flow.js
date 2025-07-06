#!/usr/bin/env node

/**
 * 调试AI评分流程脚本
 * 检查系列问答的完整流程：提交 -> AI评分 -> 状态更新 -> 结果展示
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
 * 检查现有的系列问答和提交
 */
async function checkExistingData() {
  info('检查现有的系列问答数据...');
  
  try {
    // 查询系列问答
    const { data: questionnaires, error: qError } = await supabase
      .from('series_questionnaires')
      .select(`
        id,
        title,
        ai_grading_prompt,
        ai_grading_criteria,
        max_score,
        questions:series_questions(id, title, question_text),
        submissions:series_submissions(
          id,
          student_id,
          status,
          submitted_at,
          answers,
          series_ai_gradings(
            id,
            ai_score,
            final_score,
            ai_feedback,
            created_at
          )
        )
      `)
      .limit(5);

    if (qError) {
      error(`查询系列问答失败: ${qError.message}`);
      return null;
    }

    if (!questionnaires || questionnaires.length === 0) {
      warning('没有找到系列问答数据');
      return null;
    }

    log('\n📊 系列问答数据概览:', 'magenta');
    questionnaires.forEach((q, index) => {
      log(`${index + 1}. ${q.title} (${q.id})`, 'cyan');
      log(`   问题数量: ${q.questions?.length || 0}`, 'reset');
      log(`   提交数量: ${q.submissions?.length || 0}`, 'reset');
      log(`   AI评分配置: ${q.ai_grading_prompt ? '✓' : '✗'}`, q.ai_grading_prompt ? 'green' : 'red');
      
      if (q.submissions && q.submissions.length > 0) {
        log(`   提交状态:`, 'yellow');
        q.submissions.forEach((sub, subIndex) => {
          const gradingInfo = sub.series_ai_gradings && sub.series_ai_gradings.length > 0 
            ? `评分: ${sub.series_ai_gradings[0].ai_score}分` 
            : '未评分';
          log(`     ${subIndex + 1}. ${sub.status} - ${gradingInfo}`, 'reset');
        });
      }
      log('');
    });

    return questionnaires;
  } catch (err) {
    error(`检查数据异常: ${err.message}`);
    return null;
  }
}

/**
 * 检查特定提交的AI评分状态
 */
async function checkSubmissionGradingStatus(submissionId) {
  info(`检查提交 ${submissionId} 的评分状态...`);
  
  try {
    const { data: submission, error } = await supabase
      .from('series_submissions')
      .select(`
        id,
        status,
        submitted_at,
        answers,
        questionnaire_id,
        series_ai_gradings(
          id,
          ai_score,
          final_score,
          ai_feedback,
          ai_detailed_feedback,
          created_at
        )
      `)
      .eq('id', submissionId)
      .single();

    if (error) {
      error(`查询提交失败: ${error.message}`);
      return null;
    }

    log('\n📋 提交详情:', 'magenta');
    log(`提交ID: ${submission.id}`, 'cyan');
    log(`状态: ${submission.status}`, 'cyan');
    log(`提交时间: ${submission.submitted_at}`, 'cyan');
    log(`答案数量: ${Object.keys(submission.answers || {}).length}`, 'cyan');

    if (submission.series_ai_gradings && submission.series_ai_gradings.length > 0) {
      const grading = submission.series_ai_gradings[0];
      log('\n🤖 AI评分结果:', 'magenta');
      log(`评分ID: ${grading.id}`, 'green');
      log(`AI分数: ${grading.ai_score}`, 'green');
      log(`最终分数: ${grading.final_score || grading.ai_score}`, 'green');
      log(`评分时间: ${grading.created_at}`, 'green');
      
      if (grading.ai_feedback) {
        log(`反馈: ${grading.ai_feedback.substring(0, 100)}...`, 'green');
      }
      
      if (grading.ai_detailed_feedback) {
        log(`详细反馈: ${JSON.stringify(grading.ai_detailed_feedback).substring(0, 100)}...`, 'green');
      }
    } else {
      warning('没有找到AI评分结果');
    }

    return submission;
  } catch (err) {
    error(`检查提交状态异常: ${err.message}`);
    return null;
  }
}

/**
 * 模拟触发AI评分
 */
async function simulateAIGrading(submissionId) {
  info(`模拟触发AI评分: ${submissionId}`);
  
  try {
    // 这里应该调用实际的AI评分服务
    // 为了测试，我们直接检查是否已有评分
    const { data: existingGrading } = await supabase
      .from('series_ai_gradings')
      .select('id, ai_score')
      .eq('submission_id', submissionId)
      .single();

    if (existingGrading) {
      success(`已存在AI评分: ${existingGrading.ai_score}分`);
      return true;
    } else {
      warning('没有找到AI评分，需要触发评分');
      return false;
    }
  } catch (err) {
    error(`模拟AI评分异常: ${err.message}`);
    return false;
  }
}

/**
 * 检查数据库表结构
 */
async function checkTableStructure() {
  info('检查数据库表结构...');
  
  const tables = [
    'series_questionnaires',
    'series_questions', 
    'series_submissions',
    'series_ai_gradings'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        error(`表 ${table} 查询失败: ${error.message}`);
      } else {
        success(`表 ${table} 正常 (${data?.length || 0} 条记录)`);
      }
    } catch (err) {
      error(`检查表 ${table} 异常: ${err.message}`);
    }
  }
}

/**
 * 主函数
 */
async function main() {
  log('🔍 开始调试AI评分流程', 'magenta');
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    error('缺少必要的环境变量，请检查 .env.local 文件');
    process.exit(1);
  }

  // 1. 检查数据库表结构
  await checkTableStructure();
  log('');

  // 2. 检查现有数据
  const questionnaires = await checkExistingData();
  if (!questionnaires) {
    warning('没有找到测试数据，请先运行 test-ai-grading.js 创建测试数据');
    return;
  }

  // 3. 检查具体的提交和评分状态
  for (const questionnaire of questionnaires) {
    if (questionnaire.submissions && questionnaire.submissions.length > 0) {
      for (const submission of questionnaire.submissions) {
        await checkSubmissionGradingStatus(submission.id);
        await simulateAIGrading(submission.id);
        log('');
      }
    }
  }

  log('🎯 调试完成', 'magenta');
  
  // 提供建议
  log('\n💡 问题排查建议:', 'yellow');
  log('1. 检查AI评分是否正确触发和完成', 'reset');
  log('2. 检查提交状态是否正确更新为 "graded"', 'reset');
  log('3. 检查前端是否正确处理评分结果展示', 'reset');
  log('4. 检查路由跳转和状态传递是否正常', 'reset');
}

// 运行调试
main().catch(console.error);
