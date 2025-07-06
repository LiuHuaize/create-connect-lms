# AIHubMix API 文档

## 概述

AIHubMix 提供 OpenAI 兼容的 API 接口，支持多种先进的 AI 模型。本文档描述了如何在项目中集成和使用该 API。

## API 配置

### 基础信息
- **Base URL**: `https://aihubmix.com/v1`
- **API Key**: 存储在环境变量 `AIHUBMIX_API_KEY` 中
- **模型**: `gemini-2.5-pro` (Google Gemini 2.5 Pro)

### 环境变量配置
```bash
# .env.local
AIHUBMIX_API_KEY=your_api_key_here
VITE_AIHUBMIX_API_KEY=your_api_key_here  # 前端使用
```

## 使用示例

### Node.js/TypeScript
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://aihubmix.com/v1',
  apiKey: process.env.AIHUBMIX_API_KEY,
});

async function generateCompletion(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: "gemini-2.5-pro",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that evaluates student answers based on grading criteria."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000  // Gemini 2.5 Pro 支持更长的输出
  });

  return completion.choices[0].message.content;
}
```

### 在 Supabase Edge Functions 中使用
```typescript
import { OpenAI } from 'https://deno.land/x/openai@v4.20.1/mod.ts';

const openai = new OpenAI({
  baseURL: 'https://aihubmix.com/v1',
  apiKey: Deno.env.get('AIHUBMIX_API_KEY')!,
});
```

## 系列问答 AI 评分集成

### 评分提示词模板
```typescript
const generateGradingPrompt = (
  question: string,
  answer: string,
  gradingCriteria: string,
  minWords?: number,
  maxWords?: number
) => {
  return `
作为一名教育评估专家，请根据以下标准对学生的答案进行评分：

问题：${question}

学生答案：${answer}

评分标准：${gradingCriteria}

${minWords ? `最少字数要求：${minWords}字` : ''}
${maxWords ? `最多字数限制：${maxWords}字` : ''}

请提供：
1. 分数（0-100分）
2. 评价反馈（重点关注内容质量、理解深度和表达能力，而非语法错误）
3. 改进建议

注意：请专注于学生对问题的理解和内容表达，不要过分纠结于错别字或语法细节。
`;
};
```

### API 响应格式
```typescript
interface AIGradingResponse {
  score: number;           // 0-100
  feedback: string;        // 整体评价
  suggestions: string[];   // 改进建议列表
  strengths: string[];     // 优点列表
}
```

## 错误处理

### 常见错误码
- `401`: API Key 无效
- `429`: 请求频率超限
- `500`: 服务器内部错误

### 错误处理示例
```typescript
try {
  const result = await generateCompletion(prompt);
  return result;
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error(`API Error: ${error.status} - ${error.message}`);
    // 处理特定错误
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
}
```

## 最佳实践

1. **请求频率控制**: 实现请求限流，避免超出 API 限制
2. **缓存机制**: 对相同的评分请求实施缓存，减少重复调用
3. **超时设置**: 设置合理的超时时间（建议 30 秒）
4. **错误重试**: 实现指数退避的重试机制
5. **日志记录**: 记录所有 API 调用以便调试和监控

## 安全注意事项

1. **API Key 保护**: 
   - 永远不要在前端代码中暴露 API Key
   - 使用环境变量存储敏感信息
   - 通过后端代理所有 AI API 调用

2. **输入验证**:
   - 验证和清理用户输入
   - 限制输入长度
   - 防止提示词注入攻击

3. **成本控制**:
   - 监控 API 使用量
   - 设置使用限额
   - 实现用户级别的速率限制