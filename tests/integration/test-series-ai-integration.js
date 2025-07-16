#!/usr/bin/env node

/**
 * 系列问答AI评分集成测试脚本
 * 测试系列问答服务中的AI评分功能是否正常工作
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
 * 查找现有的系列问答
 */
async function findExistingQuestionnaire() {
  info('查找现有的系列问答...');
  
  try {
    const { data: questionnaires, error } = await supabase
      .from('series_questionnaires')
      .select(`
        *,
        questions:series_questions(*)
      `)
      .eq('ai_grading_prompt', '请根据学生的回答质量进行评分，重点关注内容的完整性、准确性和深度。')
      .limit(1);

    if (error) {
      error(`查询系列问答失败: ${error.message}`);
      return null;
    }

    if (questionnaires && questionnaires.length > 0) {
      const questionnaire = questionnaires[0];
      success(`找到现有问卷: ${questionnaire.title} (${questionnaire.id})`);
      return questionnaire;
    }

    warning('未找到现有问卷');
    return null;
  } catch (err) {
    error(`查找问卷异常: ${err.message}`);
    return null;
  }
}

/**
 * 创建测试提交
 */
async function createTestSubmission(questionnaireId, questions) {
  info('创建测试提交...');
  
  try {
    const answers = {};
    
    // 为每个问题创建答案
    questions.forEach((question, index) => {
      if (index === 0) {
        answers[question.id] = '软件工程是一门应用计算机科学、数学及管理科学等原理，开发软件的工程学科。它的主要特点包括：系统性、规范性、可维护性和可重用性。软件工程强调使用工程化的方法来开发软件，确保软件质量和开发效率。';
      } else if (index === 1) {
        answers[question.id] = '项目管理在软件开发中的重要性体现在：1）确保项目按时交付；2）控制开发成本；3）保证软件质量；4）协调团队合作；5）风险管理和控制。';
      } else {
        answers[question.id] = `这是对问题"${question.title}"的测试回答。内容包含了基本的要点和分析，展示了学生的理解能力。`;
      }
    });

    const { data: submission, error: submissionError } = await supabase
      .from('series_submissions')
      .insert({
        questionnaire_id: questionnaireId,
        student_id: '5f653446-5974-4c2b-96df-4390df1380d6', // 使用真实用户ID
        answers: answers,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (submissionError) {
      error(`创建测试提交失败: ${submissionError.message}`);
      return null;
    }

    success(`测试提交创建成功: ${submission.id}`);
    return submission;
  } catch (err) {
    error(`创建测试提交异常: ${err.message}`);
    return null;
  }
}

/**
 * 测试AI评分功能
 */
async function testAIGradingFunction(submissionId) {
  info('测试AI评分功能...');
  
  try {
    // 调用AI评分函数
    const { data, error } = await supabase.rpc('trigger_ai_grading', {
      submission_id: submissionId,
      force_regrade: true
    });

    if (error) {
      error(`AI评分函数调用失败: ${error.message}`);
      return false;
    }

    success('AI评分函数调用成功');
    
    // 等待一段时间让AI评分完成
    info('等待AI评分完成...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 查询评分结果
    const { data: grading, error: gradingError } = await supabase
      .from('series_ai_gradings')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (gradingError) {
      warning(`查询评分结果失败: ${gradingError.message}`);
      return false;
    }

    if (grading) {
      success('AI评分完成！');
      log(`总分: ${grading.ai_score}/${grading.final_score || 100}`, 'cyan');
      log(`反馈: ${grading.ai_feedback}`, 'cyan');
      
      if (grading.ai_detailed_feedback) {
        log('详细反馈:', 'magenta');
        if (Array.isArray(grading.ai_detailed_feedback)) {
          grading.ai_detailed_feedback.forEach((feedback, index) => {
            log(`  问题${index + 1}: ${feedback.score}分 - ${feedback.feedback}`, 'yellow');
          });
        } else {
          log(JSON.stringify(grading.ai_detailed_feedback, null, 2), 'yellow');
        }
      }
      
      return true;
    } else {
      warning('未找到评分结果');
      return false;
    }
  } catch (err) {
    error(`AI评分测试异常: ${err.message}`);
    return false;
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData(submissionId) {
  if (!submissionId) return;
  
  info('清理测试数据...');
  
  try {
    // 删除AI评分记录
    await supabase
      .from('series_ai_gradings')
      .delete()
      .eq('submission_id', submissionId);
    
    // 删除提交记录
    await supabase
      .from('series_submissions')
      .delete()
      .eq('id', submissionId);
    
    success('测试数据清理完成');
  } catch (err) {
    warning(`清理测试数据失败: ${err.message}`);
  }
}

/**
 * 主测试函数
 */
async function main() {
  log('🚀 开始系列问答AI评分集成测试', 'magenta');
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    error('缺少必要的环境变量，请检查 .env.local 文件');
    process.exit(1);
  }
  
  let submissionId = null;
  
  try {
    // 1. 查找现有问卷
    const questionnaire = await findExistingQuestionnaire();
    if (!questionnaire) {
      warning('未找到合适的测试问卷，请先运行完整的AI评分测试创建问卷');
      process.exit(1);
    }
    
    if (!questionnaire.questions || questionnaire.questions.length === 0) {
      error('问卷没有问题，无法进行测试');
      process.exit(1);
    }
    
    // 2. 创建测试提交
    const submission = await createTestSubmission(questionnaire.id, questionnaire.questions);
    if (!submission) {
      error('创建测试提交失败，终止测试');
      process.exit(1);
    }
    
    submissionId = submission.id;
    
    // 3. 测试AI评分
    const gradingSuccess = await testAIGradingFunction(submissionId);
    if (gradingSuccess) {
      success('🎉 系列问答AI评分集成测试成功！');
    } else {
      error('系列问答AI评分集成测试失败');
    }
    
  } catch (err) {
    error(`测试过程异常: ${err.message}`);
  } finally {
    // 清理测试数据
    await cleanupTestData(submissionId);
  }
  
  log('测试完成', 'magenta');
}

// 运行测试
main().catch(console.error);
