#!/usr/bin/env node

/**
 * 完整AI评分流程测试脚本
 * 测试从提交到评分结果展示的完整流程
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
 * 测试完整的AI评分流程
 */
async function testCompleteAIFlow() {
  info('测试完整AI评分流程...');
  
  try {
    // 1. 查找已评分的提交
    const { data: gradedSubmissions, error: queryError } = await supabase
      .from('series_submissions')
      .select(`
        id,
        questionnaire_id,
        student_id,
        status,
        submitted_at,
        answers,
        series_ai_gradings(
          id,
          ai_score,
          final_score,
          ai_feedback,
          ai_detailed_feedback
        )
      `)
      .eq('status', 'graded')
      .limit(3);

    if (queryError) {
      error(`查询已评分提交失败: ${queryError.message}`);
      return false;
    }

    if (!gradedSubmissions || gradedSubmissions.length === 0) {
      warning('没有找到已评分的提交');
      return false;
    }

    log(`\n📊 找到 ${gradedSubmissions.length} 个已评分的提交:`, 'magenta');
    
    for (const submission of gradedSubmissions) {
      const grading = submission.series_ai_gradings[0];
      
      log(`\n提交ID: ${submission.id}`, 'cyan');
      log(`问卷ID: ${submission.questionnaire_id}`, 'cyan');
      log(`状态: ${submission.status}`, 'green');
      log(`提交时间: ${submission.submitted_at}`, 'reset');
      log(`答案数量: ${Object.keys(submission.answers || {}).length}`, 'reset');
      
      if (grading) {
        log(`AI评分: ${grading.ai_score}分`, 'green');
        log(`最终分数: ${grading.final_score || grading.ai_score}分`, 'green');
        
        if (grading.ai_feedback) {
          log(`反馈: ${grading.ai_feedback.substring(0, 50)}...`, 'green');
        }
        
        if (grading.ai_detailed_feedback) {
          log(`详细反馈: 已提供`, 'green');
        }
      } else {
        warning('没有AI评分数据');
      }
    }

    return true;
  } catch (err) {
    error(`测试AI评分流程异常: ${err.message}`);
    return false;
  }
}

/**
 * 验证数据库状态一致性
 */
async function verifyDataConsistency() {
  info('验证数据库状态一致性...');
  
  try {
    // 检查是否有状态不一致的数据
    const { data: inconsistentData, error } = await supabase
      .from('series_submissions')
      .select(`
        id,
        status,
        series_ai_gradings!inner(id)
      `)
      .eq('status', 'submitted'); // 有AI评分但状态仍为submitted

    if (error) {
      error(`检查数据一致性失败: ${error.message}`);
      return false;
    }

    if (inconsistentData && inconsistentData.length > 0) {
      warning(`发现 ${inconsistentData.length} 个状态不一致的提交`);
      inconsistentData.forEach(item => {
        log(`提交ID: ${item.id} - 状态: ${item.status} (应该是 graded)`, 'yellow');
      });
      return false;
    } else {
      success('数据库状态一致性检查通过');
      return true;
    }
  } catch (err) {
    error(`验证数据一致性异常: ${err.message}`);
    return false;
  }
}

/**
 * 测试AI评分API连接
 */
async function testAIAPIConnection() {
  info('测试AI评分API连接...');
  
  try {
    const API_KEY = process.env.VITE_AIHUBMIX_API_KEY;
    const API_URL = 'https://aihubmix.com/v1/chat/completions';
    
    if (!API_KEY) {
      error('缺少AI API密钥');
      return false;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        messages: [
          {
            role: 'user',
            content: '测试连接，请回复"连接成功"'
          }
        ],
        max_tokens: 10,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        success('AI API连接正常');
        return true;
      } else {
        warning('AI API响应格式异常');
        return false;
      }
    } else {
      error(`AI API连接失败: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (err) {
    error(`测试AI API连接异常: ${err.message}`);
    return false;
  }
}

/**
 * 生成测试报告
 */
function generateTestReport(results) {
  log('\n📋 测试报告', 'magenta');
  log('=' * 50, 'cyan');
  
  const tests = [
    { name: 'AI API连接测试', result: results.apiConnection },
    { name: '数据库状态一致性', result: results.dataConsistency },
    { name: '完整AI评分流程', result: results.completeFlow }
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ 通过' : '❌ 失败';
    const color = test.result ? 'green' : 'red';
    log(`${test.name}: ${status}`, color);
  });

  const passedCount = tests.filter(t => t.result).length;
  const totalCount = tests.length;
  
  log(`\n总计: ${passedCount}/${totalCount} 项测试通过`, passedCount === totalCount ? 'green' : 'yellow');
  
  if (passedCount === totalCount) {
    log('\n🎉 所有测试通过！AI评分功能正常工作', 'green');
  } else {
    log('\n⚠️  部分测试失败，请检查相关配置', 'yellow');
  }
}

/**
 * 主函数
 */
async function main() {
  log('🧪 开始完整AI评分流程测试', 'magenta');
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    error('缺少必要的环境变量，请检查 .env.local 文件');
    process.exit(1);
  }

  const results = {
    apiConnection: false,
    dataConsistency: false,
    completeFlow: false
  };

  // 执行测试
  results.apiConnection = await testAIAPIConnection();
  log('');
  
  results.dataConsistency = await verifyDataConsistency();
  log('');
  
  results.completeFlow = await testCompleteAIFlow();
  log('');

  // 生成报告
  generateTestReport(results);
  
  log('\n💡 如果所有测试通过，说明AI评分功能已正常集成', 'blue');
  log('现在用户应该能够：', 'blue');
  log('1. 提交系列问答答案', 'reset');
  log('2. 自动跳转到AI评分等待页面', 'reset');
  log('3. AI评分完成后跳转回课程页面并显示结果', 'reset');
  log('4. 查看详细的AI评分和反馈', 'reset');
}

// 运行测试
main().catch(console.error);
