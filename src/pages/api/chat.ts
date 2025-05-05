// 使用标准Web API而不是Next.js API
// import { NextRequest } from 'next/server';

// 移除Next.js特定配置
// export const config = {
//   runtime: 'edge',
// };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { messages, courseName } = body;

    // 构建发送到aihubmix的请求
    const aihubmixMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 添加系统消息（如果没有）
    if (!aihubmixMessages.some(msg => msg.role === 'system')) {
      aihubmixMessages.unshift({
        role: 'system',
        content: `你是一个友好、有帮助的学习助手，类似于Khanmigo。你的目标是帮助学生理解${courseName || '当前课程'}的概念和解答题目。

重要提示：
1. 你正在帮助学生解答测验或课程题目。永远不要直接给出答案！
2. 用苏格拉底式方法引导学生思考，通过提问帮助他们自己发现答案
3. 如果学生问你答案，不要告诉他们，而是引导他们分析选项
4. 当学生问你类似"这道题选什么"的问题时，应该帮助他们理解题目而不是告诉他们答案
5. 每次回复中保持只有一个提问，让学生有思考空间
6. 如果学生提问的就是测验中的题目内容，一定要认识到这一点

保持回复简洁、清晰，使用友好的对话风格。

几个例子：
学生:狗是从哪种动物演化而来的?
助手:这是个很有趣的题目！你觉得狗最可能和哪种现存的野生动物有亲缘关系呢？它们的外形或行为有什么相似之处？

学生:选A还是选B？
助手:我看到这是个选择题。让我们思考一下每个选项的含义。A选项说的是什么？这与我们学过的内容有什么联系？

学生:这道题的答案是什么？
助手:与其直接告诉你答案，不如我们一起分析一下这个问题。你能告诉我你对这个题目的理解吗？或者你认为哪个选项可能是正确的，为什么？
假如学生回答出正确答案，你就不要一直继续提问了，肯定学生正确答案`,
      });
    }

    // 调用aihubmix API
    const response = await fetch('https://aihubmix.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_AIHUBMIX_API_KEY}`, // 使用import.meta.env而不是process.env
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1', // 或其他适合的模型
        messages: aihubmixMessages,
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: `aihubmix API error: ${error}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 直接转发流式响应
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 