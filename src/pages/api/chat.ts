import { NextApiRequest, NextApiResponse } from 'next';
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

export const config = {
  runtime: 'edge',
};

export default async function handler(
  req: Request
) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { messages, courseName = '当前课程' } = await req.json();
    
    // 从环境变量获取API密钥
    const apiKey = process.env.OPENROUTER_API_KEY;
    // 创建OpenRouter实例
    const openrouter = createOpenRouter({ apiKey });

    // 使用streamText函数生成文本并流式传输
    const result = streamText({
      model: openrouter('google/gemini-2.5-flash-preview-04-17'), // 使用Gemini模型
      system: `你是一个专业、友善的${courseName}学习助手，由Gemini-2.5-Flash模型提供支持。
提供准确、有用的回答，解释复杂概念，并鼓励学生继续探索。
使用简洁清晰的语言，保持专业但友好的语气。
当不确定时，诚实承认，并提供可能的方向或资源供进一步学习。`,
      messages,
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 转换为流式响应
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 