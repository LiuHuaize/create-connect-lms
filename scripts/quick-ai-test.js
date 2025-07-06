#!/usr/bin/env node

/**
 * 快速AI评分测试脚本
 * 直接测试AI API的评分功能，不涉及数据库操作
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../.env.local') });

// AI API 配置
const AIHUBMIX_API_KEY = process.env.VITE_AIHUBMIX_API_KEY;
const AI_API_URL = 'https://aihubmix.com/v1/chat/completions';
const AI_MODEL = 'gpt-4.1';

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

/**
 * 测试数据
 */
const testData = {
  questionnaire: {
    title: '软件工程基础问答',
    description: '测试学生对软件工程基础知识的理解',
    ai_grading_prompt: '请根据学生的回答质量进行评分，重点关注内容的完整性、准确性和深度。',
    ai_grading_criteria: '评分标准：内容完整性(30%)、准确性(40%)、深度思考(30%)',
    max_score: 100
  },
  questions: [
    {
      id: 'q1',
      title: '软件工程定义',
      content: '请简述什么是软件工程，以及它的主要特点。',
      required: true,
      word_limit: 200
    },
    {
      id: 'q2',
      title: '项目管理重要性',
      content: '在软件开发过程中，项目管理的重要性体现在哪些方面？',
      required: true,
      word_limit: 150
    }
  ],
  answers: [
    {
      question_id: 'q1',
      answer_text: '软件工程是一门应用计算机科学、数学及管理科学等原理，开发软件的工程学科。它的主要特点包括：系统性、规范性、可维护性和可重用性。软件工程强调使用工程化的方法来开发软件，确保软件质量和开发效率。',
      word_count: 78
    },
    {
      question_id: 'q2',
      answer_text: '项目管理在软件开发中的重要性体现在：1）确保项目按时交付；2）控制开发成本；3）保证软件质量；4）协调团队合作；5）风险管理和控制。',
      word_count: 52
    }
  ]
};

/**
 * 构建评分提示词
 */
function buildGradingPrompt(data) {
  const { questionnaire, questions, answers } = data;
  
  let prompt = `请对以下系列问答进行评分：

问卷信息：
- 标题：${questionnaire.title}
- 描述：${questionnaire.description || '无'}
- 最高分数：${questionnaire.max_score}分

评分标准：
${questionnaire.ai_grading_criteria || '请根据回答的完整性、准确性和深度进行评分'}

评分提示：
${questionnaire.ai_grading_prompt || '请客观公正地评分'}

问题和学生答案：
`;

  questions.forEach((question, index) => {
    const answer = answers.find(a => a.question_id === question.id);
    prompt += `
${index + 1}. ${question.title}
   问题：${question.content}
   ${question.required ? '(必答)' : '(选答)'}
   学生答案：${answer ? answer.answer_text : '未回答'}
   字数：${answer ? answer.word_count : 0}字
`;
  });

  prompt += `

请以JSON格式返回评分结果，格式如下：
{
  "overall_score": 总分(0-${questionnaire.max_score}),
  "overall_feedback": "总体评价反馈",
  "detailed_feedback": [
    {
      "question_id": "问题ID",
      "score": 单题分数,
      "feedback": "单题反馈",
      "strengths": ["优点1", "优点2"],
      "improvements": ["改进建议1", "改进建议2"]
    }
  ],
  "criteria_scores": {
    "完整性": 分数,
    "准确性": 分数,
    "深度": 分数
  },
  "suggestions": ["总体建议1", "总体建议2"]
}`;

  return prompt;
}

/**
 * 测试AI评分
 */
async function testAIGrading() {
  info('开始快速AI评分测试...');
  
  try {
    // 构建评分提示词
    const gradingPrompt = buildGradingPrompt(testData);
    
    info('发送AI评分请求...');
    
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIHUBMIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的教育评估专家，擅长对学生的问答进行客观、公正、建设性的评分和反馈。'
          },
          {
            role: 'user',
            content: gradingPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content;
      
      if (aiContent) {
        try {
          const gradingResult = JSON.parse(aiContent);
          success('AI评分成功！');
          
          log('\n📊 评分结果:', 'magenta');
          log(`总分: ${gradingResult.overall_score}/${testData.questionnaire.max_score}`, 'cyan');
          log(`总体反馈: ${gradingResult.overall_feedback}`, 'cyan');
          
          if (gradingResult.detailed_feedback) {
            log('\n📝 详细反馈:', 'magenta');
            gradingResult.detailed_feedback.forEach((feedback, index) => {
              log(`问题${index + 1}: ${feedback.score}分`, 'yellow');
              log(`反馈: ${feedback.feedback}`, 'reset');
              if (feedback.strengths && feedback.strengths.length > 0) {
                log(`优点: ${feedback.strengths.join(', ')}`, 'green');
              }
              if (feedback.improvements && feedback.improvements.length > 0) {
                log(`改进建议: ${feedback.improvements.join(', ')}`, 'yellow');
              }
              log('');
            });
          }
          
          if (gradingResult.criteria_scores) {
            log('📈 分项评分:', 'magenta');
            Object.entries(gradingResult.criteria_scores).forEach(([criteria, score]) => {
              log(`${criteria}: ${score}分`, 'cyan');
            });
          }
          
          if (gradingResult.suggestions && gradingResult.suggestions.length > 0) {
            log('\n💡 总体建议:', 'magenta');
            gradingResult.suggestions.forEach((suggestion, index) => {
              log(`${index + 1}. ${suggestion}`, 'yellow');
            });
          }
          
          return true;
        } catch (parseError) {
          error('AI返回内容解析失败');
          log('原始内容:', 'yellow');
          log(aiContent, 'reset');
          return false;
        }
      } else {
        error('AI返回内容为空');
        return false;
      }
    } else {
      const errorText = await response.text();
      error(`AI评分请求失败: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (err) {
    error(`AI评分异常: ${err.message}`);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  log('🚀 快速AI评分测试', 'magenta');
  
  // 检查API密钥
  if (!AIHUBMIX_API_KEY) {
    error('缺少AIHUBMIX API密钥，请检查 .env.local 文件');
    process.exit(1);
  }
  
  const success = await testAIGrading();
  
  if (success) {
    log('\n🎉 AI评分功能正常工作！', 'green');
  } else {
    log('\n❌ AI评分功能测试失败', 'red');
    process.exit(1);
  }
}

// 运行测试
main().catch(console.error);
