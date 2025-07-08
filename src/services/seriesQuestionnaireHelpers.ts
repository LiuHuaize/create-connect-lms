import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from '@/utils/userSession';
import {
  CreateSeriesQuestionnaireRequest,
  UpdateSeriesQuestionnaireRequest,
  CreateSeriesQuestionRequest,
  UpdateSeriesQuestionRequest
} from "@/types/series-questionnaire";
import { SeriesQuestion, SeriesAnswer } from "@/types/course";

/**
 * 通用验证错误类
 */
export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(errors.join(', '));
    this.name = 'ValidationError';
  }
}

/**
 * 验证系列问答数据
 */
export function validateQuestionnaireData(
  data: CreateSeriesQuestionnaireRequest | UpdateSeriesQuestionnaireRequest
): string[] {
  const errors: string[] = [];

  if ('title' in data && (!data.title || data.title.trim().length === 0)) {
    errors.push('标题不能为空');
  }

  if ('title' in data && data.title && data.title.length > 200) {
    errors.push('标题长度不能超过200字符');
  }

  if (data.description && data.description.length > 1000) {
    errors.push('描述长度不能超过1000字符');
  }

  if (data.max_score && (data.max_score < 1 || data.max_score > 1000)) {
    errors.push('最高分数必须在1-1000之间');
  }

  if (data.time_limit_minutes && (data.time_limit_minutes < 1 || data.time_limit_minutes > 1440)) {
    errors.push('时间限制必须在1-1440分钟之间');
  }

  return errors;
}

/**
 * 验证问题数据
 */
export function validateQuestionData(
  question: CreateSeriesQuestionRequest | UpdateSeriesQuestionRequest
): string[] {
  const errors: string[] = [];

  if ('title' in question && (!question.title || question.title.trim().length === 0)) {
    errors.push('问题标题不能为空');
  }

  if ('question_text' in question && (!question.question_text || question.question_text.trim().length === 0)) {
    errors.push('问题内容不能为空');
  }

  if (question.min_words && question.min_words < 0) {
    errors.push('最少字数不能小于0');
  }

  if (question.max_words && question.max_words < 1) {
    errors.push('最多字数不能小于1');
  }

  if (question.min_words && question.max_words && question.min_words > question.max_words) {
    errors.push('最少字数不能大于最多字数');
  }

  return errors;
}

/**
 * 验证答案数据
 */
export function validateAnswerData(answers: SeriesAnswer[], questions: SeriesQuestion[]): string[] {
  const errors: string[] = [];

  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.question_id);
    if (!question) {
      errors.push(`问题不存在: ${answer.question_id}`);
      continue;
    }

    if (question.required && (!answer.answer_text || answer.answer_text.trim().length === 0)) {
      errors.push(`必答题不能为空: ${question.title}`);
    }

    if (answer.answer_text) {
      const wordCount = answer.answer_text.split(/\s+/).filter(word => word.length > 0).length;

      if (question.min_words && wordCount < question.min_words) {
        errors.push(`"${question.title}" 答案字数不足，最少需要 ${question.min_words} 字`);
      }

      if (question.max_words && wordCount > question.max_words) {
        errors.push(`"${question.title}" 答案字数超限，最多允许 ${question.max_words} 字`);
      }
    }
  }

  return errors;
}

/**
 * 计算答案总字数
 */
export function calculateTotalWords(answers: SeriesAnswer[]): number {
  return answers.reduce((total, answer) => {
    return total + (answer.answer_text?.split(/\s+/).filter(word => word.length > 0).length || 0);
  }, 0);
}

/**
 * 将答案数组转换为对象格式（数据库期望的格式）
 */
export function answersArrayToObject(answers: SeriesAnswer[]): Record<string, string> {
  const answersObject: Record<string, string> = {};
  answers.forEach(answer => {
    answersObject[answer.question_id] = answer.answer_text;
  });
  return answersObject;
}

/**
 * 将答案对象转换为数组格式
 */
export function answersObjectToArray(answersObj: Record<string, string>): SeriesAnswer[] {
  return Object.entries(answersObj).map(([questionId, answerText]) => ({
    question_id: questionId,
    answer_text: answerText
  }));
}

/**
 * 权限检查助手
 */
export class PermissionChecker {
  /**
   * 检查用户是否是课程作者
   */
  static async checkCourseAuthor(lessonId: string, userId: string): Promise<boolean> {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        course_modules!inner(
          course_id,
          courses!inner(author_id)
        )
      `)
      .eq('id', lessonId)
      .single();

    if (error || !lesson) {
      return false;
    }

    const courseAuthorId = (lesson as any).course_modules?.courses?.author_id;
    return courseAuthorId === userId;
  }

  /**
   * 检查用户是否是系列问答的课程作者
   */
  static async checkQuestionnaireAuthor(questionnaireId: string, userId: string): Promise<boolean> {
    const { data: questionnaire, error } = await supabase
      .from('series_questionnaires')
      .select(`
        id,
        lesson_id,
        lessons!inner(
          module_id,
          course_modules!inner(
            course_id,
            courses!inner(author_id)
          )
        )
      `)
      .eq('id', questionnaireId)
      .single();

    if (error || !questionnaire) {
      return false;
    }

    const courseAuthorId = (questionnaire as any).lessons?.course_modules?.courses?.author_id;
    return courseAuthorId === userId;
  }

  /**
   * 通用权限验证，抛出错误
   */
  static async requireCourseAuthor(lessonId: string, userId: string): Promise<void> {
    const hasPermission = await this.checkCourseAuthor(lessonId, userId);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }
  }

  /**
   * 验证用户已登录
   */
  static async requireUser(): Promise<string> {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('用户未登录');
    }
    return user.id;
  }
}

/**
 * 问答类型检查助手
 */
export class QuestionnaireTypeChecker {
  /**
   * 检查是否为lesson类型的系列问答
   */
  static async isLessonType(questionnaireId: string): Promise<boolean> {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', questionnaireId)
      .eq('type', 'series_questionnaire')
      .single();

    return !!lessonData;
  }

  /**
   * 获取问答信息，支持两种类型
   */
  static async getQuestionnaireInfo(questionnaireId: string): Promise<{
    isLessonType: boolean;
    lessonId: string | null;
    questionnaire: any;
  }> {
    console.log('🔍 getQuestionnaireInfo - 开始查询问答信息:', questionnaireId);
    
    // 首先尝试从lessons表获取
    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id, content')
      .eq('id', questionnaireId)
      .eq('type', 'series_questionnaire')
      .single();

    console.log('📋 getQuestionnaireInfo - lessons表查询结果:', {
      hasData: !!lessonData,
      error: lessonError?.message,
      contentKeys: lessonData?.content ? Object.keys(lessonData.content) : null
    });

    if (lessonData && !lessonError) {
      // 解析content字段（可能是JSON字符串）
      let content = lessonData.content;
      console.log('📋 getQuestionnaireInfo - content类型:', typeof content);
      
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
          console.log('📋 getQuestionnaireInfo - 解析后的content:', content);
        } catch (e) {
          console.error('❌ getQuestionnaireInfo - 解析content失败:', e);
          content = {};
        }
      }
      
      const questionnaire = {
        id: lessonData.id,
        lesson_id: lessonData.id,
        title: content?.title || '',
        description: content?.description || '',
        instructions: content?.instructions || '',
        max_score: content?.max_score || 100,
        time_limit_minutes: content?.time_limit_minutes,
        allow_save_draft: content?.allow_save_draft !== false,
        skill_tags: content?.skill_tags || [],
        ai_grading_prompt: content?.ai_grading_prompt || '',
        ai_grading_criteria: content?.ai_grading_criteria || '',
        questions: content?.questions || []
      };
      
      console.log('✅ getQuestionnaireInfo - 返回lesson类型问答:', {
        title: questionnaire.title,
        questionsCount: questionnaire.questions.length,
        questions: questionnaire.questions
      });
      
      return {
        isLessonType: true,
        lessonId: lessonData.id,
        questionnaire
      };
    }

    console.log('📋 getQuestionnaireInfo - lesson类型查询失败，尝试从series_questionnaires表查询');
    
    // 如果不是lesson类型，从series_questionnaires表获取
    const { data: questionnaireData, error: questionnaireError } = await supabase
      .from('series_questionnaires')
      .select('*')
      .eq('id', questionnaireId)
      .single();

    console.log('📋 getQuestionnaireInfo - series_questionnaires表查询结果:', {
      hasData: !!questionnaireData,
      error: questionnaireError?.message,
      data: questionnaireData
    });

    if (questionnaireError || !questionnaireData) {
      console.error('❌ getQuestionnaireInfo - 系列问答不存在:', questionnaireError);
      throw new Error('系列问答不存在');
    }

    // 单独查询问题数据
    const { data: questions, error: questionsError } = await supabase
      .from('series_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('order_index', { ascending: true });

    console.log('📋 getQuestionnaireInfo - series_questions表查询结果:', {
      hasData: !!questions,
      count: questions?.length || 0,
      error: questionsError?.message,
      questions: questions
    });

    if (questionsError) {
      console.warn('⚠️ getQuestionnaireInfo - 获取问题数据失败:', questionsError.message);
    }

    const result = {
      isLessonType: false,
      lessonId: questionnaireData.lesson_id,
      questionnaire: {
        ...questionnaireData,
        questions: questions || []
      }
    };
    
    console.log('✅ getQuestionnaireInfo - 返回独立问答类型:', {
      title: result.questionnaire.title,
      questionsCount: result.questionnaire.questions.length,
      questions: result.questionnaire.questions
    });

    return result;
  }

  /**
   * 构建提交查询，根据类型使用不同的字段
   */
  static buildSubmissionQuery(
    queryBuilder: any,
    questionnaireId: string,
    isLessonType: boolean
  ) {
    if (isLessonType) {
      return queryBuilder
        .eq('lesson_id', questionnaireId)
        .is('questionnaire_id', null);
    } else {
      return queryBuilder
        .eq('questionnaire_id', questionnaireId);
    }
  }
}

/**
 * 构建错误响应
 */
export function buildErrorResponse(error: unknown, defaultMessage: string): {
  success: false;
  error: string;
} {
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage
  };
}

/**
 * 构建成功响应
 */
export function buildSuccessResponse<T>(data: T): {
  success: true;
  data: T;
} {
  return {
    success: true,
    data
  };
}

/**
 * 转换SeriesQuestion为AI评分格式
 */
export function transformQuestionsForAIGrading(questions: SeriesQuestion[]): Array<{
  id: string;
  title: string;
  content: string;
  required: boolean;
  word_limit?: number;
}> {
  return questions.map(q => ({
    id: q.id,
    title: q.title,
    content: q.question_text, // 转换 question_text 为 content
    required: q.required,
    word_limit: q.max_words
  }));
}

/**
 * 问题更新操作助手
 */
export class QuestionUpdateHelper {
  /**
   * 处理问题更新操作（创建、更新、删除）
   */
  static async processQuestionUpdates(
    questionnaireId: string,
    questions: Array<UpdateSeriesQuestionRequest & { _action?: string }>
  ): Promise<void> {
    for (const question of questions) {
      if (question._action === 'delete' && question.id) {
        // 删除问题
        await this.deleteQuestion(question.id, questionnaireId);
      } else if (question._action === 'create' || !question.id) {
        // 创建新问题
        await this.createQuestion(questionnaireId, question);
      } else if (question._action === 'update' || question.id) {
        // 更新现有问题
        await this.updateQuestion(question.id, questionnaireId, question);
      }
    }
  }

  /**
   * 删除单个问题
   */
  private static async deleteQuestion(questionId: string, questionnaireId: string): Promise<void> {
    const { error } = await supabase
      .from('series_questions')
      .delete()
      .eq('id', questionId)
      .eq('questionnaire_id', questionnaireId);

    if (error) {
      console.error('删除问题失败:', error);
      throw error;
    }
  }

  /**
   * 创建单个问题
   */
  private static async createQuestion(
    questionnaireId: string,
    question: CreateSeriesQuestionRequest
  ): Promise<void> {
    const { error } = await supabase
      .from('series_questions')
      .insert({
        questionnaire_id: questionnaireId,
        title: question.title!,
        description: question.description,
        question_text: question.question_text!,
        order_index: question.order_index!,
        required: question.required ?? true,
        min_words: question.min_words || 0,
        max_words: question.max_words,
        placeholder_text: question.placeholder_text
      });

    if (error) {
      console.error('创建问题失败:', error);
      throw error;
    }
  }

  /**
   * 更新单个问题
   */
  private static async updateQuestion(
    questionId: string,
    questionnaireId: string,
    updates: UpdateSeriesQuestionRequest
  ): Promise<void> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.question_text !== undefined) updateData.question_text = updates.question_text;
    if (updates.order_index !== undefined) updateData.order_index = updates.order_index;
    if (updates.required !== undefined) updateData.required = updates.required;
    if (updates.min_words !== undefined) updateData.min_words = updates.min_words;
    if (updates.max_words !== undefined) updateData.max_words = updates.max_words;
    if (updates.placeholder_text !== undefined) updateData.placeholder_text = updates.placeholder_text;

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('series_questions')
        .update(updateData)
        .eq('id', questionId)
        .eq('questionnaire_id', questionnaireId);

      if (error) {
        console.error('更新问题失败:', error);
        throw error;
      }
    }
  }
}