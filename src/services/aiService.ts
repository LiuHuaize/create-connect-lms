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