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

// AIHubMix API 配置（用于系列问答评分）
// 使用 Gemini 2.5 Pro 模型
const AIHUBMIX_API_KEY = import.meta.env.VITE_AIHUBMIX_API_KEY || '';
const AIHUBMIX_API_URL = 'https://aihubmix.com/v1/chat/completions';
const AIHUBMIX_MODEL_NAME = 'gemini-2.5-pro';

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
    console.log('🚀 开始AI评分...');
    console.log('API配置:', {
      url: AIHUBMIX_API_URL,
      model: AIHUBMIX_MODEL_NAME,
      hasApiKey: !!AIHUBMIX_API_KEY,
      apiKeyPreview: AIHUBMIX_API_KEY ? `${AIHUBMIX_API_KEY.substring(0, 10)}...` : '未设置'
    });
    console.log('评分数据:', {
      questionnaire: data.questionnaire.title,
      questionsCount: data.questions.length,
      answersCount: data.answers.length,
      answers: data.answers.map(a => ({ id: a.question_id, text: a.answer_text?.substring(0, 50) + '...' }))
    });
    
    try {
      console.log('📤 发送评分请求到AI服务...');
      const response = await fetch(AIHUBMIX_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIHUBMIX_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: AIHUBMIX_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的教育评估专家，擅长对学生的问答进行客观、公正、建设性的评分和反馈。请专注于内容质量和理解深度，而非语法细节。'
            },
            {
              role: 'user',
              content: gradingPrompt
            }
          ],
          temperature: 0.3, // 较低的温度确保评分的一致性
          max_tokens: 4000, // Gemini 2.5 Pro 支持更长的输出
        }),
      });

      console.log('📥 收到响应，状态码:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API调用成功，响应数据:', result);
        
        const aiContent = result.choices?.[0]?.message?.content;

        if (aiContent) {
          console.log('📝 AI返回内容长度:', aiContent.length);
          console.log('📝 AI返回原始内容:', aiContent);
          
          // 尝试提取JSON部分（AI可能返回的内容包含额外的文字）
          let jsonContent = aiContent;
          
          // 如果内容包含```json标记，提取其中的JSON
          const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
            console.log('📝 提取到JSON代码块:', jsonContent);
          }
          
          // 尝试找到JSON对象的开始和结束
          const jsonStartIndex = jsonContent.indexOf('{');
          const jsonEndIndex = jsonContent.lastIndexOf('}');
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
            console.log('📝 提取到JSON对象:', jsonContent);
          }
          
          try {
            const gradingResult = JSON.parse(jsonContent);
            console.log('✅ 成功解析AI评分结果:', gradingResult);
            return validateGradingResult(gradingResult, data.questionnaire.max_score);
          } catch (parseError) {
            console.error('❌ 解析AI评分结果失败:', parseError);
            console.log('尝试解析的内容:', jsonContent);
            console.log('原始AI响应:', aiContent);
            // 如果解析失败，回退到模拟评分
          }
        } else {
          console.error('❌ AI响应中没有内容');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ AI API调用失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
      }
    } catch (apiError) {
      console.error('❌ AI API连接失败:', apiError);
    }
    
    console.log('⚠️ 使用模拟评分作为备用方案');

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
      const answerText = answer.answer_text.trim().toLowerCase();

      // 检测低质量内容
      const lowQualityPatterns = [
        /^[啊哦嗯呃额呀哈嘿哟噢嗨]+$/,  // 只有语气词
        /^[不知道|不清楚|不懂|不会|没想法|随便|乱写|乱答|胡说|瞎写]+.*$/,  // 明确表示不知道或随意
        /^[\d\w\s!@#$%^&*()_+\-=\[\]{}|;':".,<>?\/~`]+$/,  // 只有数字、字母、符号
        /^(.)\1{4,}$/,  // 同一字符重复4次以上
        /^[。，！？；：""''（）【】]+$/,  // 只有标点符号
        /^[\s\t\n\r]+$/,  // 只有空白字符
      ];

      // 检测是否为低质量内容
      const isLowQuality = lowQualityPatterns.some(pattern => pattern.test(answerText));
      
      // 检测字符重复度
      const uniqueChars = new Set(answerText.split('')).size;
      const repetitionRatio = uniqueChars / answerText.length;
      const highRepetition = repetitionRatio < 0.3 && answerText.length > 10;

      // 检测是否包含有意义的内容
      const meaningfulChars = answerText.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').length;
      const meaningfulRatio = meaningfulChars / answerText.length;
      const lowMeaning = meaningfulRatio < 0.5 && answerText.length > 5;

      if (isLowQuality || highRepetition || lowMeaning) {
        // 低质量回答，给低分
        questionScore = Math.floor(maxScore * 0.05); // 5%
        feedback = `你的回答"${answer.answer_text}"看起来不够认真。学习需要你诚实地表达想法，即使不确定答案，也请尝试基于你的理解来回答，而不是随意填写。请重新认真思考"${question.title}"这个问题。`;
        strengths = [];
        improvements = [
          '请认真阅读和理解问题要求',
          '基于你的知识和经验诚实回答',
          '如果不确定，可以说出你的思考过程',
          '避免随意填写或敷衍的回答',
          '学习态度决定学习效果，请保持认真'
        ];
      } else if (wordCount < 20) {
        questionScore = Math.floor(maxScore * 0.3); // 30%
        feedback = `你的回答比较简短（${wordCount}字），虽然触及了问题的表面，但缺少必要的展开和说明。对于"${question.title}"这个问题，仅用简单的一两句话是不够的。`;
        strengths = ['能够识别问题的基本方向'];
        improvements = [
          '建议增加具体的例子来支撑你的观点',
          '可以从多个角度来分析这个问题',
          '尝试解释"为什么"而不仅仅是"是什么"',
          `建议将答案扩展到至少50字以上，充分展现你的理解`
        ];
      } else if (wordCount < 50) {
        questionScore = Math.floor(maxScore * 0.5); // 50%
        feedback = `你的回答抓住了问题的核心要点，这很好。但是对于"${question.title}"这样的问题，还有很多可以深入探讨的空间。你目前的答案像是一个概要，需要更多的细节来充实。`;
        strengths = ['正确理解了问题的主要内容', '回答方向正确'];
        improvements = [
          '可以加入1-2个具体的例子来说明你的观点',
          '尝试解释这个概念的实际应用或重要性',
          '考虑加入一些相关的背景知识',
          '可以对比不同的观点或情况'
        ];
      } else if (wordCount < 100) {
        questionScore = Math.floor(maxScore * 0.7); // 70%
        feedback = `不错的回答！你展现了对"${question.title}"较好的理解。答案有一定的深度，逻辑也比较清晰。如果能在某些关键点上再深入一些，会让你的答案更有说服力。`;
        strengths = [
          '答案结构清晰，逻辑连贯',
          '包含了问题的主要方面',
          '有自己的思考和理解'
        ];
        improvements = [
          '可以在关键概念上提供更详细的解释',
          '考虑加入一些前沿的观点或最新的发展',
          '如果能联系实际生活会更生动'
        ];
      } else {
        questionScore = Math.floor(maxScore * 0.85); // 85%
        feedback = `优秀的回答！你对"${question.title}"的理解非常深入，不仅回答了问题本身，还展现了良好的知识储备和思维能力。答案详实、有理有据，表达也很清晰。`;
        strengths = [
          '答案全面深入，覆盖了问题的各个方面',
          '逻辑严密，论述充分',
          '能够灵活运用相关知识',
          '表达清晰流畅'
        ];
        improvements = [
          '这样的回答质量请继续保持',
          '可以尝试提出一些创新性的见解',
          '如果有机会，可以探讨一些更深层次的含义'
        ];
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
  const answeredCount = answers.filter(a => a.answer_text.trim() !== '').length;
  const completionRate = (answeredCount / questions.length) * 100;
  
  if (averageScore >= maxScore * 0.8) {
    overallFeedback = `非常出色的表现！你完成了${answeredCount}/${questions.length}道题（完成率${completionRate.toFixed(0)}%），平均得分${averageScore}分。你的答案展现了扎实的知识基础和良好的思维能力。特别值得肯定的是，你能够从多个角度分析问题，并且表达清晰有条理。继续保持这种学习态度，你会在这个领域取得更大的进步！`;
  } else if (averageScore >= maxScore * 0.6) {
    overallFeedback = `良好的表现！你完成了${answeredCount}/${questions.length}道题，平均得分${averageScore}分。你对大部分概念都有正确的理解，这是一个很好的开始。从你的答案可以看出，你已经掌握了基础知识，但在深度和广度上还有提升的空间。建议你在回答问题时，多思考"为什么"和"怎么样"，而不仅仅是"是什么"。加入更多的例子和实际应用，会让你的答案更有说服力。`;
  } else if (averageScore >= maxScore * 0.4) {
    overallFeedback = `你完成了${answeredCount}/${questions.length}道题，平均得分${averageScore}分，这表明你对相关知识有了初步的了解。从你的答案来看，你能够识别问题的基本方向，但在具体内容的展开上还需要加强。建议你：1）仔细阅读每个问题，确保理解问题的核心；2）在回答时提供更多的细节和例子；3）尝试建立不同知识点之间的联系。记住，学习是一个循序渐进的过程，继续努力！`;
  } else {
    overallFeedback = `你完成了${answeredCount}/${questions.length}道题，平均得分${averageScore}分。看起来你对这些问题的理解还处于初级阶段，这很正常，每个人的学习都是从这里开始的。建议你：1）先确保理解每个问题在问什么；2）尝试用自己的话重新表述问题；3）从最基础的概念开始，逐步建立知识体系；4）不要害怕犯错，每次尝试都是进步的机会。相信通过持续的学习，你一定能够掌握这些知识！`;
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
    suggestions: generatePersonalizedSuggestions(averageScore, answeredCount, questions.length, maxScore)
  };
};

/**
 * 生成个性化的学习建议
 */
const generatePersonalizedSuggestions = (
  averageScore: number, 
  answeredCount: number, 
  totalQuestions: number, 
  maxScore: number
): string[] => {
  const suggestions: string[] = [];
  const scorePercentage = (averageScore / maxScore) * 100;
  
  // 基于完成度的建议
  if (answeredCount < totalQuestions) {
    suggestions.push(`你还有${totalQuestions - answeredCount}道题未完成，建议先完成所有题目，这样能够全面展示你的知识掌握情况`);
  }
  
  // 基于分数的建议
  if (scorePercentage >= 80) {
    suggestions.push('你的基础很扎实！建议尝试一些拓展性的学习，比如阅读相关的前沿研究或探索实际应用案例');
    suggestions.push('可以尝试成为其他同学的"小老师"，通过教别人来进一步巩固和深化自己的理解');
    suggestions.push('挑战自己：尝试从不同的角度重新思考这些问题，或者寻找这些知识在其他领域的应用');
  } else if (scorePercentage >= 60) {
    suggestions.push('建议重点复习那些得分较低的题目，找出知识盲点并针对性地学习');
    suggestions.push('多做类似的练习题，通过反复练习来加深理解和记忆');
    suggestions.push('尝试用思维导图整理知识点，帮助建立知识体系的整体框架');
    suggestions.push('找一个学习伙伴，互相讨论和解答疑惑，往往能有新的收获');
  } else if (scorePercentage >= 40) {
    suggestions.push('建议先回到教材或课程视频，系统地复习基础概念');
    suggestions.push('每学完一个知识点，试着用自己的话总结出来，这样能检验是否真正理解');
    suggestions.push('不要急于求成，把大的学习目标分解成小步骤，逐个击破');
    suggestions.push('准备一个错题本，记录不懂的地方，定期回顾和请教老师');
  } else {
    suggestions.push('从最基础的概念开始，不要跳过任何一个知识点，打好基础很重要');
    suggestions.push('建议制定一个学习计划，每天学习一点点，保持连续性');
    suggestions.push('多利用网上的教学资源，如视频教程、互动练习等，找到适合自己的学习方式');
    suggestions.push('记住：每个专家都曾是初学者，保持耐心和信心，你一定可以进步的！');
  }
  
  // 通用建议
  suggestions.push('定期回顾和总结学过的内容，避免遗忘');
  suggestions.push('将理论知识与实际生活联系起来，这样学习会更有趣也更有效');
  
  return suggestions;
};

/**
 * 构建AI评分的提示词
 */
const buildGradingPrompt = (data: SeriesQuestionnaireData): string => {
  const { questionnaire, questions, answers } = data;

  let prompt = `请对以下系列问答进行详细评分。你是一位经验丰富的教育专家，请提供深入、具体、有启发性的反馈。

## 问答信息
**标题**: ${questionnaire.title}
**描述**: ${questionnaire.description || '无'}
**总分**: ${questionnaire.max_score}分

## 评分标准
${questionnaire.ai_grading_criteria || '请根据答案的完整性、准确性、逻辑性和深度进行评分'}

## 老师的评分要求
${questionnaire.ai_grading_prompt || '请客观公正地评分，并提供建设性的反馈'}

## 评分指导原则
1. **严格评分**：请务必严格按照评分标准执行，不要过于宽松。低质量、敷衍、乱写的答案应该给低分
2. **内容质量检测**：如果发现以下情况，应该给予很低的分数（0-10分）：
   - 只有语气词（如"啊啊啊"、"嗯嗯嗯"）
   - 明确表示不知道或随意回答（如"不知道"、"随便写"、"乱答"）
   - 重复字符或无意义符号
   - 明显与问题无关的内容
3. **深度分析**：对于有意义的回答，要具体指出哪些观点很好，哪些地方可以深化
4. **知识拓展**：指出学生可能遗漏的重要知识点，或者可以进一步探索的相关概念
5. **思维引导**：帮助学生建立更完整的知识体系，指出不同概念之间的联系
6. **具体建议**：提供可操作的改进建议，比如"可以从XX角度思考"、"建议补充YY方面的例子"
7. **鼓励性反馈**：在指出不足的同时，充分肯定学生的亮点，激发学习热情
8. **学习态度**：如果答案明显不认真，要在反馈中强调学习态度的重要性

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
请严格按照以下JSON格式返回评分结果，不要包含任何其他文字或说明：

\`\`\`json
{
  "overall_score": 总分(0-${questionnaire.max_score}),
  "overall_feedback": "详细的总体评价和反馈（至少100字）",
  "detailed_feedback": [
    {
      "question_id": "问题ID",
      "score": 该问题得分,
      "feedback": "针对该问题的详细具体反馈（至少50字）",
      "strengths": ["具体的优点1", "具体的优点2", "具体的优点3"],
      "improvements": ["具体的改进建议1", "具体的改进建议2", "具体的改进建议3"]
    }
  ],
  "criteria_scores": {
    "完整性": 分数,
    "准确性": 分数,
    "逻辑性": 分数,
    "深度": 分数
  },
  "suggestions": ["详细的总体改进建议1", "详细的总体改进建议2", "详细的总体改进建议3", "详细的总体改进建议4"]
}
\`\`\`

重要：
1. 必须返回标准的JSON格式，用\`\`\`json和\`\`\`包裹
2. overall_feedback要详细具体，包含对学生整体表现的深入分析
3. 每个问题的feedback要具体指出答案的优缺点，不要泛泛而谈
4. strengths和improvements各至少提供3条具体的内容
5. suggestions至少提供4条有针对性的学习建议
6. 所有反馈都要有教育意义，能够真正帮助学生提升`;

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