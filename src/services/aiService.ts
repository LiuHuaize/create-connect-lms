import axios, { AxiosError } from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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

// DeepSeek API 配置
const API_KEY = 'sk-ysF0SA6kJ7C1I2wG2f901fD6Fe8443Df8f75C92a0aF1Ce2b';
const BASE_URL = 'https://aihubmix.com/v1';
const MODEL_NAME = 'gpt-4.1-mini';

// 创建 axios 实例
const aiApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
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

// 发送消息到 DeepSeek-V3 模型
export const sendMessageToAI = async (
  messages: ChatMessage[],
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
) => {
  try {
    const requestData: ChatCompletionRequest = {
      model: MODEL_NAME,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: options.stream || false
    };

    const response = await requestWithRetry(() => 
      aiApi.post<ChatCompletionResponse>('/chat/completions', requestData)
    );
    
    return response.data.choices[0].message.content;
  } catch (error) {
    const axiosError = error as AxiosError;
    let errorMessage = '与 AI 服务通信时出错';
    
    if (axiosError.response) {
      // 服务器返回了错误状态码
      const status = axiosError.response.status;
      const data = axiosError.response.data as any;
      
      if (status === 401) {
        errorMessage = 'API密钥无效或已过期';
      } else if (status === 429) {
        errorMessage = '请求过于频繁，请稍后再试';
      } else if (data?.error?.message) {
        errorMessage = `API错误: ${data.error.message}`;
      }
    } else if (axiosError.request) {
      // 请求已发出但没有收到响应
      errorMessage = '无法连接到 AI 服务，请检查网络连接';
    }
    
    console.error('调用 DeepSeek API 失败:', error);
    throw new Error(errorMessage);
  }
};

// 使用 stream 模式获取响应
export const streamMessageFromAI = async (
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
) => {
  try {
    const requestData: ChatCompletionRequest = {
      model: MODEL_NAME,
      messages,
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
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
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
            console.error('解析流数据失败:', e);
          }
        }
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error('流式调用 DeepSeek API 失败:', error);
    throw new Error('与 AI 服务通信时出错');
  }
};

// 格式化消息为 AI 服务需要的格式
export const formatMessages = (messages: {role: 'user' | 'ai' | 'system', content: string}[]): ChatMessage[] => {
  return messages.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content
  }));
}; 