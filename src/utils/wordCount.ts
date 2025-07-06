/**
 * 字数统计工具函数
 */

/**
 * 计算文本的字数（中英文混合）
 * @param text 要统计的文本
 * @returns 字数
 */
export const countWords = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }

  // 移除首尾空白字符
  const trimmedText = text.trim();
  
  if (trimmedText.length === 0) {
    return 0;
  }

  // 分别统计中文字符和英文单词
  const chineseChars = trimmedText.match(/[\u4e00-\u9fff]/g) || [];
  const englishWords = trimmedText
    .replace(/[\u4e00-\u9fff]/g, ' ') // 将中文字符替换为空格
    .split(/\s+/) // 按空白字符分割
    .filter(word => word.length > 0); // 过滤空字符串

  return chineseChars.length + englishWords.length;
};

/**
 * 计算文本的字符数（包括空格和标点）
 * @param text 要统计的文本
 * @returns 字符数
 */
export const countCharacters = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.length;
};

/**
 * 计算文本的字符数（不包括空格）
 * @param text 要统计的文本
 * @returns 字符数（不含空格）
 */
export const countCharactersNoSpaces = (text: string): number => {
  if (!text || typeof text !== 'string') {
    return 0;
  }
  return text.replace(/\s/g, '').length;
};

/**
 * 验证文本是否符合字数要求
 * @param text 要验证的文本
 * @param minWords 最小字数要求
 * @param maxWords 最大字数要求
 * @returns 验证结果
 */
export const validateWordCount = (
  text: string, 
  minWords?: number, 
  maxWords?: number
): {
  isValid: boolean;
  wordCount: number;
  message?: string;
} => {
  const wordCount = countWords(text);
  
  if (minWords && wordCount < minWords) {
    return {
      isValid: false,
      wordCount,
      message: `字数不足，最少需要 ${minWords} 字，当前 ${wordCount} 字`
    };
  }
  
  if (maxWords && wordCount > maxWords) {
    return {
      isValid: false,
      wordCount,
      message: `字数超限，最多允许 ${maxWords} 字，当前 ${wordCount} 字`
    };
  }
  
  return {
    isValid: true,
    wordCount
  };
};

/**
 * 格式化字数显示
 * @param wordCount 字数
 * @param minWords 最小字数要求
 * @param maxWords 最大字数要求
 * @returns 格式化的字数显示文本
 */
export const formatWordCount = (
  wordCount: number,
  minWords?: number,
  maxWords?: number
): string => {
  let result = `${wordCount} 字`;
  
  if (minWords || maxWords) {
    result += ' (';
    if (minWords && maxWords) {
      result += `要求: ${minWords}-${maxWords} 字`;
    } else if (minWords) {
      result += `最少: ${minWords} 字`;
    } else if (maxWords) {
      result += `最多: ${maxWords} 字`;
    }
    result += ')';
  }
  
  return result;
};

/**
 * 获取字数状态（正常、警告、错误）
 * @param wordCount 当前字数
 * @param minWords 最小字数要求
 * @param maxWords 最大字数要求
 * @returns 状态类型
 */
export const getWordCountStatus = (
  wordCount: number,
  minWords?: number,
  maxWords?: number
): 'normal' | 'warning' | 'error' => {
  if (minWords && wordCount < minWords) {
    return 'error';
  }
  
  if (maxWords && wordCount > maxWords) {
    return 'error';
  }
  
  // 警告状态：接近限制
  if (minWords && wordCount < minWords * 1.2) {
    return 'warning';
  }
  
  if (maxWords && wordCount > maxWords * 0.9) {
    return 'warning';
  }
  
  return 'normal';
};

/**
 * 计算阅读时间估计（基于平均阅读速度）
 * @param text 文本内容
 * @param wordsPerMinute 每分钟阅读字数，默认200字/分钟
 * @returns 阅读时间（分钟）
 */
export const estimateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  const wordCount = countWords(text);
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * 计算写作时间估计（基于平均写作速度）
 * @param targetWords 目标字数
 * @param wordsPerMinute 每分钟写作字数，默认30字/分钟
 * @returns 写作时间（分钟）
 */
export const estimateWritingTime = (targetWords: number, wordsPerMinute: number = 30): number => {
  return Math.ceil(targetWords / wordsPerMinute);
};

/**
 * 实时字数统计Hook的类型定义
 */
export interface WordCountHookResult {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  isValid: boolean;
  status: 'normal' | 'warning' | 'error';
  message?: string;
  formattedCount: string;
}

/**
 * 创建实时字数统计的辅助函数
 * @param text 文本内容
 * @param minWords 最小字数
 * @param maxWords 最大字数
 * @returns 字数统计结果
 */
export const createWordCountResult = (
  text: string,
  minWords?: number,
  maxWords?: number
): WordCountHookResult => {
  const wordCount = countWords(text);
  const characterCount = countCharacters(text);
  const characterCountNoSpaces = countCharactersNoSpaces(text);
  const validation = validateWordCount(text, minWords, maxWords);
  const status = getWordCountStatus(wordCount, minWords, maxWords);
  const formattedCount = formatWordCount(wordCount, minWords, maxWords);

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    isValid: validation.isValid,
    status,
    message: validation.message,
    formattedCount
  };
};
