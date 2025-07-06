/**
 * 测试 AIHubMix API 连接
 * 运行命令: npx tsx src/tests/testAIHubMixAPI.ts
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '../../.env.local') });

// API 配置
const API_KEY = process.env.VITE_AIHUBMIX_API_KEY || process.env.AIHUBMIX_API_KEY;
const API_URL = 'https://aihubmix.com/v1/chat/completions';
const MODEL_NAME = 'gemini-2.5-pro';

async function testBasicConnection() {
  console.log('🔍 测试基础API连接...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : '未设置');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: '你好，请简单介绍一下自己。'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API连接成功！');
      console.log('模型响应:', data.choices?.[0]?.message?.content);
      return true;
    } else {
      console.error('❌ API返回错误:', response.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ 连接失败:', error);
    return false;
  }
}

async function testGradingFunction() {
  console.log('\n🔍 测试评分功能...');
  
  const gradingPrompt = `请对以下学生答案进行评分（满分100分）：

问题：什么是光合作用？
学生答案：光合作用是植物利用阳光、水和二氧化碳制造养分的过程。

请以JSON格式返回评分结果，包含score（分数）和feedback（反馈）两个字段。`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的教育评估专家。'
          },
          {
            role: 'user',
            content: gradingPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 评分功能测试成功！');
      console.log('AI评分结果:', data.choices?.[0]?.message?.content);
      
      // 尝试解析JSON响应
      try {
        const gradingResult = JSON.parse(data.choices?.[0]?.message?.content);
        console.log('解析后的评分:', gradingResult);
      } catch (e) {
        console.log('（JSON解析失败，但AI响应正常）');
      }
      
      return true;
    } else {
      console.error('❌ 评分功能测试失败:', response.status, data);
      return false;
    }
  } catch (error) {
    console.error('❌ 评分测试出错:', error);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试 AIHubMix API...\n');
  
  const basicTest = await testBasicConnection();
  if (basicTest) {
    await testGradingFunction();
  }
  
  console.log('\n✨ 测试完成！');
}

// 执行测试
runTests().catch(console.error);