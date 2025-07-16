#!/usr/bin/env node

/**
 * AI评分功能测试脚本
 * 用于测试系列问答的AI评分功能是否正常工作
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
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
const AIHUBMIX_API_KEY = process.env.VITE_AIHUBMIX_API_KEY;

// AI API 配置
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

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 初始化 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * 测试AI API连接
 */
async function testAIConnection() {
  info('测试AI API连接...');
  
  try {
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
            content: '你是一位专业的教育评估专家。'
          },
          {
            role: 'user',
            content: '请简单回复"连接测试成功"'
          }
        ],
        temperature: 0.3,
        max_tokens: 50,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      const aiContent = result.choices?.[0]?.message?.content;
      success(`AI API连接成功: ${aiContent}`);
      return true;
    } else {
      const errorText = await response.text();
      error(`AI API连接失败: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (err) {
    error(`AI API连接异常: ${err.message}`);
    return false;
  }
}

/**
 * 创建测试问卷
 */
async function createTestQuestionnaire() {
  info('创建测试问卷...');
  
  try {
    // 创建测试课程
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: 'AI评分测试课程',
        description: '用于测试AI评分功能的课程',
        author_id: '5f653446-5974-4c2b-96df-4390df1380d6' // 使用真实用户ID
      })
      .select()
      .single();

    if (courseError) {
      error(`创建测试课程失败: ${courseError.message}`);
      return null;
    }

    // 创建测试模块
    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .insert({
        title: 'AI评分测试模块',
        course_id: course.id,
        order_index: 1
      })
      .select()
      .single();

    if (moduleError) {
      error(`创建测试模块失败: ${moduleError.message}`);
      return null;
    }

    // 创建测试课时
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .insert({
        title: 'AI评分测试课时',
        module_id: module.id,
        order_index: 1,
        type: 'series_questionnaire'
      })
      .select()
      .single();

    if (lessonError) {
      error(`创建测试课时失败: ${lessonError.message}`);
      return null;
    }

    // 创建系列问答
    const { data: questionnaire, error: questionnaireError } = await supabase
      .from('series_questionnaires')
      .insert({
        title: 'AI评分测试问答',
        description: '测试AI评分功能的系列问答',
        lesson_id: lesson.id,
        ai_grading_prompt: '请根据学生的回答质量进行评分，重点关注内容的完整性、准确性和深度。',
        ai_grading_criteria: '评分标准：内容完整性(30%)、准确性(40%)、深度思考(30%)',
        max_score: 100,
        allow_save_draft: true
      })
      .select()
      .single();

    if (questionnaireError) {
      error(`创建系列问答失败: ${questionnaireError.message}`);
      return null;
    }

    // 创建测试问题
    const questions = [
      {
        title: '软件工程基础',
        question_text: '请简述什么是软件工程，以及它的主要特点。',
        questionnaire_id: questionnaire.id,
        order_index: 1,
        required: true,
        min_words: 50,
        max_words: 200
      },
      {
        title: '项目管理',
        question_text: '在软件开发过程中，项目管理的重要性体现在哪些方面？',
        questionnaire_id: questionnaire.id,
        order_index: 2,
        required: true,
        min_words: 30,
        max_words: 150
      }
    ];

    const { data: createdQuestions, error: questionsError } = await supabase
      .from('series_questions')
      .insert(questions)
      .select();

    if (questionsError) {
      error(`创建测试问题失败: ${questionsError.message}`);
      return null;
    }

    success(`测试问卷创建成功: ${questionnaire.id}`);
    return {
      questionnaire,
      questions: createdQuestions,
      lesson,
      module,
      course
    };
  } catch (err) {
    error(`创建测试问卷异常: ${err.message}`);
    return null;
  }
}

/**
 * 创建测试提交
 */
async function createTestSubmission(questionnaireId, questions) {
  info('创建测试提交...');
  
  try {
    const answers = {
      [questions[0].id]: '软件工程是一门应用计算机科学、数学及管理科学等原理，开发软件的工程学科。它的主要特点包括：系统性、规范性、可维护性和可重用性。软件工程强调使用工程化的方法来开发软件，确保软件质量和开发效率。',
      [questions[1].id]: '项目管理在软件开发中的重要性体现在：1）确保项目按时交付；2）控制开发成本；3）保证软件质量；4）协调团队合作；5）风险管理和控制。'
    };

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
async function testAIGrading(submission, questionnaire, questions) {
  info('测试AI评分功能...');
  
  try {
    // 构建评分数据
    const gradingData = {
      questionnaire: {
        title: questionnaire.title,
        description: questionnaire.description,
        ai_grading_prompt: questionnaire.ai_grading_prompt,
        ai_grading_criteria: questionnaire.ai_grading_criteria,
        max_score: questionnaire.max_score
      },
      questions: questions.map(q => ({
        id: q.id,
        title: q.title,
        content: q.question_text,
        required: q.required,
        word_limit: q.max_words
      })),
      answers: Object.entries(submission.answers).map(([questionId, answerText]) => ({
        question_id: questionId,
        answer_text: answerText,
        word_count: answerText.split(/\s+/).length
      }))
    };

    // 构建评分提示词
    const gradingPrompt = buildGradingPrompt(gradingData);
    
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
          info(`总分: ${gradingResult.overall_score}/${questionnaire.max_score}`);
          info(`总体反馈: ${gradingResult.overall_feedback}`);
          
          if (gradingResult.detailed_feedback) {
            info('详细反馈:');
            gradingResult.detailed_feedback.forEach((feedback, index) => {
              log(`  问题${index + 1}: ${feedback.score}分 - ${feedback.feedback}`, 'cyan');
            });
          }
          
          return gradingResult;
        } catch (parseError) {
          warning('AI返回内容解析失败，原始内容:');
          log(aiContent, 'yellow');
          return null;
        }
      } else {
        error('AI返回内容为空');
        return null;
      }
    } else {
      const errorText = await response.text();
      error(`AI评分请求失败: ${response.status} - ${errorText}`);
      return null;
    }
  } catch (err) {
    error(`AI评分异常: ${err.message}`);
    return null;
  }
}

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
 * 清理测试数据
 */
async function cleanupTestData(testData) {
  if (!testData) return;
  
  info('清理测试数据...');
  
  try {
    // 删除问题
    if (testData.questions) {
      await supabase
        .from('series_questions')
        .delete()
        .in('id', testData.questions.map(q => q.id));
    }
    
    // 删除问卷
    if (testData.questionnaire) {
      await supabase
        .from('series_questionnaires')
        .delete()
        .eq('id', testData.questionnaire.id);
    }
    
    // 删除课时
    if (testData.lesson) {
      await supabase
        .from('lessons')
        .delete()
        .eq('id', testData.lesson.id);
    }

    // 删除模块
    if (testData.module) {
      await supabase
        .from('course_modules')
        .delete()
        .eq('id', testData.module.id);
    }

    // 删除课程
    if (testData.course) {
      await supabase
        .from('courses')
        .delete()
        .eq('id', testData.course.id);
    }
    
    success('测试数据清理完成');
  } catch (err) {
    warning(`清理测试数据失败: ${err.message}`);
  }
}

/**
 * 主测试函数
 */
async function main() {
  log('🚀 开始AI评分功能测试', 'magenta');
  
  // 检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !AIHUBMIX_API_KEY) {
    error('缺少必要的环境变量，请检查 .env.local 文件');
    process.exit(1);
  }
  
  let testData = null;
  
  try {
    // 1. 测试AI连接
    const aiConnected = await testAIConnection();
    if (!aiConnected) {
      error('AI连接测试失败，终止测试');
      process.exit(1);
    }
    
    // 2. 创建测试数据
    testData = await createTestQuestionnaire();
    if (!testData) {
      error('创建测试数据失败，终止测试');
      process.exit(1);
    }
    
    // 3. 创建测试提交
    const submission = await createTestSubmission(testData.questionnaire.id, testData.questions);
    if (!submission) {
      error('创建测试提交失败，终止测试');
      await cleanupTestData(testData);
      process.exit(1);
    }
    
    // 4. 测试AI评分
    const gradingResult = await testAIGrading(submission, testData.questionnaire, testData.questions);
    if (gradingResult) {
      success('🎉 AI评分功能测试成功！');
    } else {
      error('AI评分功能测试失败');
    }
    
  } catch (err) {
    error(`测试过程异常: ${err.message}`);
  } finally {
    // 清理测试数据
    await cleanupTestData(testData);
  }
  
  log('测试完成', 'magenta');
}

// 运行测试
main().catch(console.error);
