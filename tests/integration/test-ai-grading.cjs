#!/usr/bin/env node

/**
 * AI评分服务测试脚本
 * 测试4.1mini模型的AI评分功能
 */

const https = require('https');

// 4.1mini API配置
const MINI_API_KEY = 'sk-LVuSMVbv6rcXN9BF555dC39001Ad46D28610D76b62285595';
const MINI_API_URL = 'https://api.gptapi.us/v1/chat/completions';
const MINI_MODEL_NAME = 'gpt-4.1-mini';

// 测试数据
const testData = {
  questionnaire: {
    title: '软件工程基础问答',
    description: '测试学生对软件工程基本概念的理解',
    ai_grading_prompt: '请根据答案的完整性、准确性、逻辑性和深度进行评分，并提供建设性的反馈',
    ai_grading_criteria: '完整性(25分)：答案是否完整回答了问题；准确性(25分)：答案是否准确无误；逻辑性(25分)：答案是否逻辑清晰；深度(25分)：答案是否有深度思考',
    max_score: 100
  },
  questions: [
    {
      id: 'q1',
      title: '什么是软件工程？',
      content: '请简述软件工程的定义和主要特点',
      required: true,
      word_limit: 200
    },
    {
      id: 'q2', 
      title: '软件开发生命周期',
      content: '请描述软件开发生命周期的主要阶段',
      required: true,
      word_limit: 300
    }
  ],
  answers: [
    {
      question_id: 'q1',
      answer_text: '软件工程是一门应用计算机科学、数学及管理科学等原理，开发软件的工程学科。它强调用工程化的方法来开发和维护软件，包括需求分析、设计、编码、测试和维护等阶段。主要特点包括：1)系统性方法；2)质量保证；3)成本控制；4)团队协作。',
      word_count: 98
    },
    {
      question_id: 'q2',
      answer_text: '软件开发生命周期主要包括以下阶段：1)需求分析：明确用户需求和系统功能；2)系统设计：设计系统架构和模块；3)编码实现：根据设计编写代码；4)测试：验证软件功能和质量；5)部署：将软件发布到生产环境；6)维护：持续改进和修复问题。每个阶段都有明确的输入、输出和质量标准。',
      word_count: 125
    }
  ]
};

/**
 * 构建AI评分的提示词
 */
function buildGradingPrompt(data) {
  const { questionnaire, questions, answers } = data;
  
  let prompt = `请对以下系列问答进行评分：

## 问答信息
**标题**: ${questionnaire.title}
**描述**: ${questionnaire.description || '无'}
**总分**: ${questionnaire.max_score}分

## 评分标准
${questionnaire.ai_grading_criteria || '请根据答案的完整性、准确性、逻辑性和深度进行评分'}

## 评分提示
${questionnaire.ai_grading_prompt || '请客观公正地评分，并提供建设性的反馈'}

## 问题和答案
`;

  // 添加每个问题和对应答案
  questions.forEach((question, index) => {
    const answer = answers.find(a => a.question_id === question.id);
    prompt += `
### 问题 ${index + 1}: ${question.title}
**问题内容**: ${question.content}
**是否必答**: ${question.required ? '是' : '否'}
${question.word_limit ? `**字数限制**: ${question.word_limit}字` : ''}

**学生答案**: ${answer?.answer_text || '未回答'}
${answer?.word_count ? `**答案字数**: ${answer.word_count}字` : ''}
`;
  });

  prompt += `

## 评分要求
请以JSON格式返回评分结果，包含以下字段：
{
  "overall_score": 总分(0-${questionnaire.max_score}),
  "overall_feedback": "总体评价和反馈",
  "detailed_feedback": [
    {
      "question_id": "问题ID",
      "score": 该问题得分,
      "feedback": "针对该问题的具体反馈",
      "strengths": ["优点1", "优点2"],
      "improvements": ["改进建议1", "改进建议2"]
    }
  ],
  "criteria_scores": {
    "完整性": 分数,
    "准确性": 分数,
    "逻辑性": 分数,
    "深度": 分数
  },
  "suggestions": ["总体改进建议1", "总体改进建议2"]
}

请确保返回的是有效的JSON格式，分数合理，反馈具体且建设性。`;

  return prompt;
}

/**
 * 调用4.1mini API进行评分
 */
async function callAIGradingAPI(prompt) {
  const postData = JSON.stringify({
    model: MINI_MODEL_NAME,
    messages: [
      {
        role: 'system',
        content: '你是一位专业的教育评估专家，擅长对学生的问答进行客观、公正、建设性的评分和反馈。'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const options = {
    hostname: 'api.gptapi.us',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINI_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(`API错误: ${res.statusCode} - ${JSON.stringify(response)}`));
          }
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`请求失败: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 验证和标准化AI评分结果
 */
function validateGradingResult(result, maxScore) {
  if (!result || typeof result !== 'object') {
    throw new Error('评分结果格式不正确');
  }

  // 验证和修正总分
  let overallScore = Number(result.overall_score) || 0;
  if (overallScore < 0) overallScore = 0;
  if (overallScore > maxScore) overallScore = maxScore;

  // 验证详细反馈
  const detailedFeedback = Array.isArray(result.detailed_feedback) 
    ? result.detailed_feedback.map((item) => ({
        question_id: String(item.question_id || ''),
        score: Math.max(0, Math.min(Number(item.score) || 0, maxScore)),
        feedback: String(item.feedback || ''),
        strengths: Array.isArray(item.strengths) ? item.strengths.map(String) : [],
        improvements: Array.isArray(item.improvements) ? item.improvements.map(String) : []
      }))
    : [];

  // 验证标准分数
  const criteriaScores = result.criteria_scores && typeof result.criteria_scores === 'object'
    ? result.criteria_scores
    : {};

  // 验证建议
  const suggestions = Array.isArray(result.suggestions) 
    ? result.suggestions.map(String)
    : [];

  return {
    overall_score: overallScore,
    overall_feedback: String(result.overall_feedback || ''),
    detailed_feedback: detailedFeedback,
    criteria_scores: criteriaScores,
    suggestions: suggestions
  };
}

/**
 * 主测试函数
 */
async function testAIGrading() {
  console.log('🚀 开始测试AI评分服务...\n');

  try {
    // 1. 构建提示词
    console.log('📝 构建评分提示词...');
    const prompt = buildGradingPrompt(testData);
    console.log('✅ 提示词构建完成\n');

    // 2. 调用API
    console.log('🤖 调用4.1mini API进行评分...');
    const startTime = Date.now();
    const response = await callAIGradingAPI(prompt);
    const endTime = Date.now();
    
    console.log(`✅ API调用成功，耗时: ${endTime - startTime}ms`);
    console.log(`📊 Token使用情况:`, response.usage);
    console.log('');

    // 3. 解析结果
    console.log('🔍 解析AI评分结果...');
    const aiContent = response.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error('AI响应内容为空');
    }

    console.log('📄 AI原始响应:');
    console.log(aiContent);
    console.log('');

    // 4. 验证JSON格式
    console.log('✅ 验证评分结果格式...');
    let gradingResult;
    try {
      gradingResult = JSON.parse(aiContent);
    } catch (parseError) {
      throw new Error(`JSON解析失败: ${parseError.message}`);
    }

    // 5. 标准化结果
    const validatedResult = validateGradingResult(gradingResult, testData.questionnaire.max_score);
    
    console.log('🎯 最终评分结果:');
    console.log('=====================================');
    console.log(`总分: ${validatedResult.overall_score}/${testData.questionnaire.max_score}`);
    console.log(`总体反馈: ${validatedResult.overall_feedback}`);
    console.log('');
    
    console.log('📋 详细反馈:');
    validatedResult.detailed_feedback.forEach((feedback, index) => {
      console.log(`问题${index + 1} (${feedback.question_id}):`);
      console.log(`  得分: ${feedback.score}`);
      console.log(`  反馈: ${feedback.feedback}`);
      console.log(`  优点: ${feedback.strengths.join(', ')}`);
      console.log(`  改进: ${feedback.improvements.join(', ')}`);
      console.log('');
    });

    console.log('📊 各项标准得分:');
    Object.entries(validatedResult.criteria_scores).forEach(([criteria, score]) => {
      console.log(`  ${criteria}: ${score}`);
    });
    console.log('');

    console.log('💡 改进建议:');
    validatedResult.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });

    console.log('\n🎉 AI评分测试完成！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testAIGrading();
}

module.exports = {
  testAIGrading,
  buildGradingPrompt,
  callAIGradingAPI,
  validateGradingResult
};
