import axios, { AxiosError } from 'axios';
// 移除导入的 ChatMessage，使用本地定义
// import { ChatMessage } from '@/components/xiyouji/AIChatBox';

// 本地定义 ChatMessage 接口
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 定义组件使用的消息类型
export interface AppChatMessage {
  role: 'user' | 'ai' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// OpenRouter API 配置
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || 'your-api-key-here'; // 从环境变量获取API密钥
const BASE_URL = 'https://openrouter.ai/api/v1';
const MODEL_NAME = 'google/gemini-2.5-pro-preview-03-25'; // Google Gemini 模型
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://yibu-platform.com'; // 网站URL，用于OpenRouter统计
const SITE_NAME = 'YiBu Learning Platform'; // 网站名称改为英文，避免编码问题

// 创建 axios 实例
const aiApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'HTTP-Referer': SITE_URL, // OpenRouter需要的标头
    'X-Title': SITE_NAME, // OpenRouter需要的标头
  },
  timeout: 60000 // 设置60秒超时
});

// 最大重试次数
const MAX_RETRIES = 3;
// 重试延迟（毫秒）
const RETRY_DELAY = 1000;

// 带重试逻辑的请求函数
const requestWithRetry = async (fn: () => Promise<any>, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // 检查错误类型，决定是否重试
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;

    // 如果是服务器错误(5xx)或超时，则重试
    const shouldRetry =
      !status || // 网络错误
      (status >= 500 && status < 600) || // 服务器错误
      axiosError.code === 'ECONNABORTED'; // 超时

    if (!shouldRetry) {
      throw error;
    }

    // 等待一段时间后重试
    await new Promise(resolve => setTimeout(resolve, delay));

    // 递增重试延迟
    return requestWithRetry(fn, retries - 1, delay * 1.5);
  }
};

// 格式化消息为 API 接受的格式
export const formatMessages = (messages: AppChatMessage[]): ChatMessage[] => {
  return messages.map(msg => ({
    // 将 'ai' 角色转换为 'assistant'
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content
  }));
};

// 发送消息到 AI 服务并获取回复
export const sendMessageToAI = async (messages: AppChatMessage[]): Promise<string> => {
  try {
    // 确保消息格式正确 - 将 'ai' 转换为 'assistant'
    const formattedMessages = formatMessages(messages);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: formattedMessages, // 使用格式化后的消息
        // 请求返回Markdown格式
        response_format: {
          type: "text"
        }
      }),
    });

    if (!response.ok) {
      // 处理 HTTP 错误（如 429 请求过多）
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`API Error: ${response.status} ${response.statusText}`, errorData);
      throw new Error(`请求失败，状态码: ${response.status}. ${errorData.message || ''}`);
    }

    const data = await response.json();

    // 提取 AI 的响应内容
    const aiContent = data.choices?.[0]?.message?.content; 
    
    if (!aiContent) {
        console.error('未能从 API 响应中提取内容:', data);
        throw new Error('API 响应格式不正确或内容为空');
    }

    // 返回Markdown格式的内容
    return aiContent.trim();

  } catch (error) {
    console.error('调用 AI 服务失败:', error);
    if (error instanceof Error) {
       throw new Error(`调用 AI 服务出错: ${error.message}`);
    } else {
       throw new Error('调用 AI 服务时发生未知错误');
    }
  }
};

// ==================== 系列问答AI评分服务 ====================

// 4.1mini API 配置（用于系列问答评分）
// 优先使用环境变量，如果没有则使用默认值
const MINI_API_KEY = import.meta.env.VITE_AIHUBMIX_API_KEY || 'sk-LVuSMVbv6rcXN9BF555dC39001Ad46D28610D76b62285595';
const MINI_API_URL = 'https://aihubmix.com/v1/chat/completions';
const MINI_MODEL_NAME = 'gpt-4.1';

// 系列问答评分相关类型定义
export interface SeriesQuestionnaireData {
  questionnaire: {
    title: string;
    description?: string;
    ai_grading_prompt?: string;
    ai_grading_criteria?: string;
    max_score: number;
  };
  questions: Array<{
    id: string;
    title: string;
    content: string;
    required: boolean;
    word_limit?: number;
  }>;
  answers: Array<{
    question_id: string;
    answer_text: string;
    word_count?: number;
  }>;
}

export interface AIGradingResult {
  overall_score: number;
  overall_feedback: string;
  detailed_feedback: Array<{
    question_id: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  criteria_scores: Record<string, number>;
  suggestions: string[];
}

/**
 * 使用4.1mini模型对系列问答进行AI评分
 */
export const gradeSeriesQuestionnaire = async (
  data: SeriesQuestionnaireData
): Promise<AIGradingResult> => {
  try {
    // 构建评分提示词
    const gradingPrompt = buildGradingPrompt(data);

    // 首先尝试真实API调用
    try {
      const response = await fetch(MINI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MINI_MODEL_NAME,
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
          temperature: 0.3, // 较低的温度确保评分的一致性
          max_tokens: 2000,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const aiContent = result.choices?.[0]?.message?.content;

        if (aiContent) {
          // 解析AI返回的JSON格式评分结果
          try {
            const gradingResult = JSON.parse(aiContent);
            return validateGradingResult(gradingResult, data.questionnaire.max_score);
          } catch (parseError) {
            console.warn('解析AI评分结果失败，使用模拟评分:', parseError);
            // 如果解析失败，回退到模拟评分
          }
        }
      } else {
        console.warn('AI API调用失败，使用模拟评分');
      }
    } catch (apiError) {
      console.warn('AI API连接失败，使用模拟评分:', apiError);
    }

    // 如果API调用失败，使用智能模拟评分
    return generateMockGrading(data);

  } catch (error) {
    console.error('AI评分失败:', error);
    if (error instanceof Error) {
      throw new Error(`AI评分服务出错: ${error.message}`);
    } else {
      throw new Error('AI评分时发生未知错误');
    }
  }
};

/**
 * 生成智能模拟评分（当API不可用时使用）
 */
const generateMockGrading = (data: SeriesQuestionnaireData): AIGradingResult => {
  const { questionnaire, questions, answers } = data;
  const maxScore = questionnaire.max_score;

  // 基于答案质量的智能评分算法
  let totalScore = 0;
  const detailedFeedback = [];

  for (const question of questions) {
    const answer = answers.find(a => a.question_id === question.id);
    let questionScore = 0;
    let feedback = '';
    let strengths = [];
    let improvements = [];

    if (!answer || !answer.answer_text.trim()) {
      // 未回答
      questionScore = 0;
      feedback = '未提供答案，建议认真思考问题并给出完整回答。';
      improvements = ['请提供答案', '仔细阅读问题要求'];
    } else {
      const answerLength = answer.answer_text.length;
      const wordCount = answer.word_count || answerLength;

      // 基于字数和内容质量评分
      if (wordCount < 20) {
        questionScore = Math.floor(maxScore * 0.3); // 30%
        feedback = '答案过于简短，缺乏详细说明。';
        improvements = ['增加答案的详细程度', '提供更多具体例子'];
      } else if (wordCount < 50) {
        questionScore = Math.floor(maxScore * 0.5); // 50%
        feedback = '答案基本回答了问题，但可以更加详细。';
        strengths = ['回答了基本问题'];
        improvements = ['增加更多细节', '提供具体例子'];
      } else if (wordCount < 100) {
        questionScore = Math.floor(maxScore * 0.7); // 70%
        feedback = '答案较为完整，有一定的深度。';
        strengths = ['回答比较完整', '有一定深度'];
        improvements = ['可以进一步深入分析'];
      } else {
        questionScore = Math.floor(maxScore * 0.85); // 85%
        feedback = '答案详细完整，显示了良好的理解。';
        strengths = ['答案详细完整', '理解深入', '表达清晰'];
        improvements = ['继续保持这种回答质量'];
      }

      // 检查是否超出字数限制
      if (question.word_limit && wordCount > question.word_limit) {
        questionScore = Math.floor(questionScore * 0.9); // 扣10%
        improvements.push('注意字数限制');
      }
    }

    totalScore += questionScore;
    detailedFeedback.push({
      question_id: question.id,
      score: questionScore,
      feedback,
      strengths,
      improvements
    });
  }

  // 计算平均分
  const averageScore = Math.floor(totalScore / questions.length);

  // 生成总体反馈
  let overallFeedback = '';
  if (averageScore >= maxScore * 0.8) {
    overallFeedback = '整体回答质量很好，显示了对问题的深入理解。';
  } else if (averageScore >= maxScore * 0.6) {
    overallFeedback = '整体回答基本正确，但还有提升空间。';
  } else if (averageScore >= maxScore * 0.4) {
    overallFeedback = '回答了基本问题，但需要更多的深入思考和详细说明。';
  } else {
    overallFeedback = '回答不够完整，建议重新思考问题并提供更详细的答案。';
  }

  return {
    overall_score: averageScore,
    overall_feedback: overallFeedback + ' (注：此为模拟评分结果)',
    detailed_feedback: detailedFeedback,
    criteria_scores: {
      '完整性': Math.floor(averageScore * 0.25),
      '准确性': Math.floor(averageScore * 0.25),
      '逻辑性': Math.floor(averageScore * 0.25),
      '深度': Math.floor(averageScore * 0.25)
    },
    suggestions: [
      '继续保持认真的学习态度',
      '多思考问题的深层含义',
      '注意答案的逻辑结构'
    ]
  };
};

/**
 * 构建AI评分的提示词
 */
const buildGradingPrompt = (data: SeriesQuestionnaireData): string => {
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
};

/**
 * 验证和标准化AI评分结果
 */
const validateGradingResult = (result: any, maxScore: number): AIGradingResult => {
  // 确保基本字段存在
  if (!result || typeof result !== 'object') {
    throw new Error('评分结果格式不正确');
  }

  // 验证和修正总分
  let overallScore = Number(result.overall_score) || 0;
  if (overallScore < 0) overallScore = 0;
  if (overallScore > maxScore) overallScore = maxScore;

  // 验证详细反馈
  const detailedFeedback = Array.isArray(result.detailed_feedback)
    ? result.detailed_feedback.map((item: any) => ({
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
};

/**
 * 批量评分多个系列问答提交
 */
export const batchGradeSeriesQuestionnaires = async (
  submissions: SeriesQuestionnaireData[]
): Promise<AIGradingResult[]> => {
  const results: AIGradingResult[] = [];

  // 为了避免API限制，我们逐个处理而不是并发
  for (const submission of submissions) {
    try {
      const result = await gradeSeriesQuestionnaire(submission);
      results.push(result);

      // 添加短暂延迟以避免API限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('批量评分中的单个评分失败:', error);
      // 为失败的评分创建默认结果
      results.push({
        overall_score: 0,
        overall_feedback: '评分失败，请稍后重试',
        detailed_feedback: [],
        criteria_scores: {},
        suggestions: ['评分服务暂时不可用，请稍后重试']
      });
    }
  }

  return results;
};

/**
 * 重新评分（强制重新评分已有结果）
 */
export const regradeSeriesQuestionnaire = async (
  data: SeriesQuestionnaireData,
  previousResult?: AIGradingResult
): Promise<AIGradingResult> => {
  try {
    // 在提示词中包含之前的评分结果作为参考
    let enhancedData = { ...data };

    if (previousResult) {
      enhancedData.questionnaire.ai_grading_prompt =
        `${data.questionnaire.ai_grading_prompt || ''}

## 之前的评分结果（仅供参考）
总分: ${previousResult.overall_score}
总体反馈: ${previousResult.overall_feedback}

请重新进行独立评分，可以参考但不必完全依照之前的结果。`;
    }

    return await gradeSeriesQuestionnaire(enhancedData);
  } catch (error) {
    console.error('重新评分失败:', error);
    throw error;
  }
};

// 使用 stream 模式获取响应
// 流式输出Markdown格式的内容
export const streamMessageFromAI = async (
  messages: AppChatMessage[],
  onChunk: (chunk: string) => void,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
) => {
  try {
    const formattedMessages = formatMessages(messages);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': SITE_URL,
        'X-Title': SITE_NAME,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: formattedMessages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 2000,
        stream: true,
        // 请求返回Markdown格式
        response_format: {
          type: "text"
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`流式请求失败，状态码: ${response.status}. ${errorData.message || ''}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // 将新块附加到缓冲区
      buffer += decoder.decode(value, { stream: true });

      // 处理缓冲区中的完整行
      while (true) {
        const lineEnd = buffer.indexOf('\n');
        if (lineEnd === -1) break;

        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);

        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            console.error('解析流数据失败:', e, '原始行:', line);
          }
        }
      }
    }

    // 处理缓冲区中的剩余数据
    if (buffer.trim() !== '') {
      if (buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]') {
          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            console.error('解析剩余流数据失败:', e);
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('流式调用 OpenRouter API 失败:', error);
    throw new Error('与 AI 服务通信时出错');
  }
}; 