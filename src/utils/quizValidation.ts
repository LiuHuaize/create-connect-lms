import { QuizQuestion, MultipleChoiceScoringMode } from '@/types/course';

/**
 * 答案验证结果
 */
export interface ValidationResult {
  isCorrect: boolean;
  score: number; // 0-1之间的分数，1表示完全正确
  partialScore?: number; // 部分给分的详细分数
}

/**
 * 验证单个问题的答案
 * @param question 问题对象
 * @param userAnswer 用户答案
 * @returns 验证结果
 */
export function validateAnswer(
  question: QuizQuestion, 
  userAnswer: string | string[]
): ValidationResult {
  if (question.type === 'single_choice' || question.type === 'true_false') {
    // 单选题和判断题：严格匹配
    const isCorrect = question.correctOption === userAnswer;
    return {
      isCorrect,
      score: isCorrect ? 1 : 0
    };
  } 
  
  if (question.type === 'multiple_choice') {
    // 多选题：支持严格模式和部分给分模式
    if (!Array.isArray(userAnswer) || !Array.isArray(question.correctOptions)) {
      return {
        isCorrect: false,
        score: 0
      };
    }

    const userAnswerSet = new Set(userAnswer);
    const correctAnswerSet = new Set(question.correctOptions);
    
    // 计算正确选择和错误选择
    const correctSelections = userAnswer.filter(answer => correctAnswerSet.has(answer));
    const wrongSelections = userAnswer.filter(answer => !correctAnswerSet.has(answer));
    const missedCorrectAnswers = question.correctOptions.filter(answer => !userAnswerSet.has(answer));
    
    // 严格模式：必须完全匹配
    const isStrictlyCorrect = correctSelections.length === question.correctOptions.length && 
                             wrongSelections.length === 0 && 
                             missedCorrectAnswers.length === 0;
    
    // 获取评分模式，默认为严格模式
    const scoringMode: MultipleChoiceScoringMode = question.scoringMode || 'strict';
    
    if (scoringMode === 'strict') {
      return {
        isCorrect: isStrictlyCorrect,
        score: isStrictlyCorrect ? 1 : 0
      };
    } else {
      // 部分给分模式：基于正确率计算分数
      const totalCorrectAnswers = question.correctOptions.length;
      const totalOptions = question.options?.length || question.correctOptions.length;
      
      // 计算部分分数：(正确选择数 - 错误选择数) / 总正确答案数
      // 但是分数不能低于0
      const rawScore = Math.max(0, 
        (correctSelections.length - wrongSelections.length) / totalCorrectAnswers
      );
      
      // 确保分数在0-1范围内
      const partialScore = Math.min(1, Math.max(0, rawScore));
      
      return {
        isCorrect: isStrictlyCorrect,
        score: partialScore,
        partialScore: partialScore
      };
    }
  }
  
  if (question.type === 'short_answer') {
    // 简答题：有回答就算正确
    const hasAnswer = typeof userAnswer === 'string' && userAnswer.trim() !== '';
    return {
      isCorrect: hasAnswer,
      score: hasAnswer ? 1 : 0
    };
  }
  
  // 默认情况
  return {
    isCorrect: false,
    score: 0
  };
}

/**
 * 计算整个测验的分数
 * @param questions 问题列表
 * @param userAnswers 用户答案映射
 * @returns 测验结果
 */
export function calculateQuizScore(
  questions: QuizQuestion[], 
  userAnswers: { [key: string]: string | string[] }
) {
  let totalScore = 0;
  let strictCorrectCount = 0;
  const questionResults: { [key: string]: ValidationResult } = {};
  
  questions.forEach((question) => {
    const userAnswer = userAnswers[question.id];
    
    if (!userAnswer) {
      questionResults[question.id] = {
        isCorrect: false,
        score: 0
      };
      return;
    }
    
    const result = validateAnswer(question, userAnswer);
    questionResults[question.id] = result;
    
    totalScore += result.score;
    if (result.isCorrect) {
      strictCorrectCount++;
    }
  });
  
  const averageScore = questions.length > 0 ? totalScore / questions.length : 0;
  const percentageScore = Math.round(averageScore * 100);
  
  return {
    score: percentageScore,
    strictCorrectCount,
    totalQuestions: questions.length,
    averageScore,
    questionResults
  };
}

/**
 * 检查是否所有问题都已回答
 * @param questions 问题列表
 * @param userAnswers 用户答案映射
 * @returns 是否全部回答
 */
export function allQuestionsAnswered(
  questions: QuizQuestion[], 
  userAnswers: { [key: string]: string | string[] }
): boolean {
  if (!questions || questions.length === 0) return false;
  
  return questions.every((question) => {
    const answer = userAnswers[question.id];
    
    if (question.type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0;
    } else {
      return typeof answer === 'string' && answer.trim() !== '';
    }
  });
} 