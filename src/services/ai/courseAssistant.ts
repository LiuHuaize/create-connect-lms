// 从.env获取API密钥
const API_KEY = import.meta.env.VITE_AIHUBMIX_API_KEY || ''; // 使用aihubmix API密钥
const API_URL = 'https://aihubmix.com/v1/chat/completions'; // 更新为aihubmix API地址

// 重试配置
const MAX_RETRIES = 3; // 最大重试次数
const RETRY_DELAY = 1000; // 初始重试延迟（毫秒）
const RETRY_BACKOFF_RATE = 1.5; // 退避系数（每次重试延迟会乘以此系数）

// 日志函数
function logInfo(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [CourseAssistant-INFO] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logError(message: string, error: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [CourseAssistant-ERROR] ${message}`);
  console.error(error);
}

// 定义消息类型
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 定义组件使用的消息类型
export interface AppChatMessage {
  role: 'system' | 'user' | 'ai';
  content: string;
}

// 格式化消息为API接受的格式
export const formatMessages = (messages: AppChatMessage[]): ChatMessage[] => {
  return messages.map(msg => ({
    // 将 'ai' 角色转换为 'assistant'
    role: msg.role === 'ai' ? 'assistant' : msg.role,
    content: msg.content
  }));
};

/**
 * 判断错误是否可以重试
 * @param error 错误对象或状态码
 * @returns 是否可以重试
 */
const isRetryableError = (error: any): boolean => {
  // 如果是状态码
  if (typeof error === 'number') {
    // 5xx 服务器错误通常是临时的，可以重试
    return error >= 500 && error < 600;
  }
  
  // 网络错误（如DNS解析失败、连接断开等）
  if (error instanceof TypeError && error.message.includes('network')) {
    return true;
  }
  
  // 超时错误
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return true;
  }
  
  // 其他可能的临时错误
  return false;
};

/**
 * 带重试功能的API调用
 * @param apiCall 要执行的API调用函数
 * @param retries 剩余重试次数
 * @param delay 当前重试延迟（毫秒）
 * @returns API调用的结果
 */
const callWithRetry = async <T>(
  apiCall: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // 获取状态码（如果有）
    const statusCode = error.status || error.statusCode || (error.response && error.response.status);
    
    // 如果不能重试或已经没有重试次数，则抛出错误
    if (retries <= 0 || !isRetryableError(statusCode || error)) {
      throw error;
    }
    
    // 记录重试信息
    logInfo(`API调用失败，将在${delay}ms后重试，剩余重试次数: ${retries}`, {
      error: error.message,
      statusCode: statusCode
    });
    
    // 等待指定的延迟时间
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // 递归调用，减少重试次数并增加延迟时间
    return callWithRetry(apiCall, retries - 1, Math.floor(delay * RETRY_BACKOFF_RATE));
  }
};

/**
 * 使用流式输出获取AI回复
 * @param messages 聊天消息历史
 * @param onChunk 处理每个接收到的文本块的回调函数
 * @param options 额外选项(温度、最大token数等)
 */
export const streamCourseAssistant = async (
  messages: AppChatMessage[],
  onChunk: (chunk: string) => void,
  options: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  } = {}
) => {
  try {
    logInfo("开始流式AI对话", { 
      messageCount: messages.length,
      options 
    });
    
    const formattedMessages = formatMessages(messages);
    
    // 生成few-shot示例
    const fewShotExamples = `
以下是一些例子，说明你应该如何回应：

例子1:
学生:狗是从哪种动物演化而来的?
助手:这是个很有趣的题目！你觉得狗最可能和哪种现存的野生动物有亲缘关系呢？它们的外形或行为有什么相似之处？

例子2:
学生:选A还是选B？
助手:我看到这是个选择题。让我们思考一下每个选项的含义。A选项说的是什么？这与我们学过的内容有什么联系？

例子3:
学生:这道题的答案是什么？
助手:与其直接告诉你答案，不如我们一起分析一下这个问题。你能告诉我你对这个题目的理解吗？或者你认为哪个选项可能是正确的，为什么？
假如学生回答出正确答案，你就不要一直继续提问了，肯定学生正确答案
`;

    // 添加few-shot示例到系统消息中
    if (formattedMessages.length > 0 && formattedMessages[0].role === 'system') {
      formattedMessages[0].content += '\n\n' + fewShotExamples;
    } else {
      formattedMessages.unshift({
        role: 'system',
        content: fewShotExamples
      });
    }
    
    logInfo("准备调用AI API", { 
      messageCount: formattedMessages.length,
      firstUserMessage: formattedMessages.find(m => m.role === 'user')?.content.substring(0, 100) + '...'
    });

    // 使用重试机制调用API
    const response = await callWithRetry(async () => {
      const startTime = Date.now();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4.1', // 使用aihubmix模型
          messages: formattedMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 800,
          stream: true
        })
      });
      
      const apiTime = Date.now() - startTime;
      logInfo(`API连接响应时间: ${apiTime}ms`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logError("API错误响应", errorData);
        const error = new Error(`流式请求失败，状态码: ${response.status}. ${errorData.message || ''}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response;
    });

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    logInfo("开始接收流式响应");

    // 使用重试机制处理流式数据
    try {
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
                onChunk(content);
              }
            } catch (e) {
              console.error('解析流数据失败:', e, '原始行:', line);
            }
          }
        }
      }
    } catch (streamError) {
      logError("处理流数据时出错", streamError);
      // 如果在处理流数据时出错，尝试通知用户
      onChunk("\n\n[系统消息: 接收数据时出错，请重试]");
      throw streamError;
    }

    // 处理缓冲区中的剩余数据
    if (buffer.trim() !== '' && buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (data !== '[DONE]') {
        try {
          const parsedData = JSON.parse(data);
          const content = parsedData.choices[0]?.delta?.content || '';
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          console.error('解析流数据中的剩余内容失败:', e);
        }
      }
    }

    logInfo("流式响应完成");
  } catch (error) {
    logError("流式API调用失败", error);
    throw error;
  }
};

/**
 * 获取AI非流式回复
 * @param messages 聊天消息历史
 * @param options 额外选项(温度、最大token数等)
 * @returns AI回复文本
 */
export const getCourseAssistantResponse = async (
  messages: AppChatMessage[],
  options: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
  } = {}
): Promise<string> => {
  try {
    logInfo("开始非流式AI对话", { 
      messageCount: messages.length,
      options 
    });
    
    const formattedMessages = formatMessages(messages);
    
    // 使用重试机制调用API
    const response = await callWithRetry(async () => {
      const startTime = Date.now();
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model || 'gpt-4.1', // 使用aihubmix模型
          messages: formattedMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 800
        })
      });
      
      const apiTime = Date.now() - startTime;
      logInfo(`API连接响应时间: ${apiTime}ms`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        logError("API错误响应", errorData);
        const error = new Error(`请求失败，状态码: ${response.status}. ${errorData.message || ''}`);
        (error as any).status = response.status;
        throw error;
      }
      
      return response;
    });
    
    const data = await response.json();
    logInfo("获取AI回复完成", { 
      responseLength: data.choices[0].message.content.length
    });
    
    return data.choices[0].message.content;
  } catch (error: any) {
    logError("获取AI回复失败", error);
    throw error;
  }
};

// 为了兼容性，保留callCourseAssistant函数但使用getCourseAssistantResponse实现
export const callCourseAssistant = getCourseAssistantResponse; 