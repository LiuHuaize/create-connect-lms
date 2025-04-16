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

// AI Hub Mix API 配置
// 从环境变量读取API密钥，确保在 .env.local 或类似文件中设置 VITE_AIHUBMIX_API_KEY (Vite)
// const API_KEY = import.meta.env.VITE_AIHUBMIX_API_KEY; // Removed environment variable usage
const API_KEY = 'sk-ysF0SA6kJ7C1I2wG2f901fD6Fe8443Df8f75C92a0aF1Ce2b'; // Directly hardcoded API Key
const BASE_URL = 'https://aihubmix.com/v1'; // AI Hub Mix API 地址
const MODEL_NAME = 'kimi-latest'; // 指定的 Gemini 模型名称
const API_URL = 'https://aihubmix.com/v1/chat/completions';

// 创建 axios 实例
const aiApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}` // 使用环境变量中的 API Key
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
  // 使用硬编码的 API KEY，不再从环境变量获取
  const apiKey = API_KEY;

  try {
    // 确保消息格式正确 - 将 'ai' 转换为 'assistant'
    const formattedMessages = formatMessages(messages);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: formattedMessages, // 使用格式化后的消息
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

// 使用 stream 模式获取响应 (注意: AI Hub Mix 是否支持 stream 需要确认)
// 如果不支持，这个函数可能需要调整或移除
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
    const requestData: ChatCompletionRequest = {
      model: MODEL_NAME,
      messages: formattedMessages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: true
    };

    const response = await aiApi.post('/chat/completions', requestData, {
      responseType: 'stream'
    });

    const reader = response.data.getReader();
    const decoder = new TextDecoder('utf-8');

    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // 注意：流式响应的格式可能与 DeepSeek 不同，需要根据 AI Hub Mix 的实际响应格式调整解析逻辑
      const lines = chunk.split('\\n').filter(line => line.trim() !== '');

      for (const line of lines) {
          // 假设 AI Hub Mix 的流格式与 OpenAI/DeepSeek 类似 (data: {...})
         if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsedData = JSON.parse(data);
              // 这里的路径可能需要根据 AI Hub Mix 的具体响应调整
              const content = parsedData.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('解析流数据失败:', e, '原始行:', line);
            }
         } else if (line.trim()) {
             // 处理非 'data:' 开头的行，可能是错误或其他信息
             console.warn('收到非标准流数据行:', line);
         }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('流式调用 AI Hub Mix API 失败:', error);
    throw new Error('与 AI 服务通信时出错');
  }
}; 