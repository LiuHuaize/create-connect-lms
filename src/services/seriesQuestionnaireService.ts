import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from '@/utils/userSession';
import {
  SeriesQuestionnaire,
  SeriesQuestion,
  SeriesSubmission,
  SeriesAIGrading,
  SeriesQuestionnaireStats,
  SeriesAnswer
} from "@/types/course";
import {
  CreateSeriesQuestionnaireRequest,
  UpdateSeriesQuestionnaireRequest,
  CreateSeriesQuestionRequest,
  UpdateSeriesQuestionRequest,
  SubmitSeriesAnswersRequest,
  SaveSeriesDraftRequest,
  AIGradeSeriesRequest,
  TeacherGradeSeriesRequest,
  CreateSeriesQuestionnaireResponse,
  GetSeriesQuestionnaireResponse,
  GetSeriesQuestionnairesResponse,
  SubmitSeriesAnswersResponse,
  AIGradeSeriesResponse,
  GetStudentSubmissionStatusResponse,
  GetSubmissionsResponse,
  GetSeriesQuestionnairesParams,
  GetSubmissionsParams
} from "@/types/series-questionnaire";
import { gradeSeriesQuestionnaire, SeriesQuestionnaireData } from '@/services/aiService';
import { gamificationService } from '@/services/gamificationService';

// 系列问答完成状态缓存
export const seriesQuestionnaireCache: Record<string, Record<string, any>> = {};

// 缓存管理
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5分钟缓存
const cacheTimestamps: Record<string, number> = {};

// 清除过期缓存
const clearExpiredCache = () => {
  const now = Date.now();
  Object.keys(cacheTimestamps).forEach(key => {
    if (now - cacheTimestamps[key] > CACHE_EXPIRY_TIME) {
      delete seriesQuestionnaireCache[key];
      delete cacheTimestamps[key];
    }
  });
};

// 设置缓存
const setCache = (key: string, data: any) => {
  clearExpiredCache();
  seriesQuestionnaireCache[key] = data;
  cacheTimestamps[key] = Date.now();
};

// 获取缓存
const getCache = (key: string) => {
  clearExpiredCache();
  return seriesQuestionnaireCache[key];
};

// 清除特定缓存
const clearCache = (pattern: string) => {
  Object.keys(seriesQuestionnaireCache).forEach(key => {
    if (key.includes(pattern)) {
      delete seriesQuestionnaireCache[key];
      delete cacheTimestamps[key];
    }
  });
};

// ==================== 数据验证辅助函数 ====================

/**
 * 验证系列问答数据
 */
function validateQuestionnaireData(data: CreateSeriesQuestionnaireRequest | UpdateSeriesQuestionnaireRequest): string[] {
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
function validateQuestionData(question: CreateSeriesQuestionRequest | UpdateSeriesQuestionRequest): string[] {
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
function validateAnswerData(answers: SeriesAnswer[], questions: SeriesQuestion[]): string[] {
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

export const seriesQuestionnaireService = {
  // ==================== 教师端API ====================

  /**
   * 创建系列问答
   */
  async createSeriesQuestionnaire(request: CreateSeriesQuestionnaireRequest): Promise<CreateSeriesQuestionnaireResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 验证数据
      const validationErrors = validateQuestionnaireData(request);
      if (validationErrors.length > 0) {
        throw new Error(`数据验证失败: ${validationErrors.join(', ')}`);
      }

      // 验证问题数据
      if (request.questions && request.questions.length > 0) {
        for (const question of request.questions) {
          const questionErrors = validateQuestionData(question);
          if (questionErrors.length > 0) {
            throw new Error(`问题验证失败: ${questionErrors.join(', ')}`);
          }
        }
      }

      // 验证用户是否有权限在该课时创建系列问答
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          module_id,
          course_modules!inner(
            course_id,
            courses!inner(author_id)
          )
        `)
        .eq('id', request.lesson_id)
        .single();

      if (lessonError || !lesson) {
        throw new Error('课时不存在或无权访问');
      }

      const courseAuthorId = (lesson as any).course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        throw new Error('无权在此课时创建系列问答');
      }

      // 使用事务处理确保数据一致性
      let questionnaire: any;
      let createdQuestions: any[] = [];

      try {
        // 开始事务：创建系列问答
        const { data: questionnaireData, error: questionnaireError } = await supabase
          .from('series_questionnaires')
          .insert({
            title: request.title,
            description: request.description,
            instructions: request.instructions,
            lesson_id: request.lesson_id,
            ai_grading_prompt: request.ai_grading_prompt,
            ai_grading_criteria: request.ai_grading_criteria,
            max_score: request.max_score || 100,
            time_limit_minutes: request.time_limit_minutes,
            allow_save_draft: request.allow_save_draft ?? true,
            skill_tags: request.skill_tags || []
          })
          .select()
          .single();

        if (questionnaireError) {
          console.error('创建系列问答失败:', questionnaireError);
          throw questionnaireError;
        }

        questionnaire = questionnaireData;

        // 创建问题
        if (request.questions && request.questions.length > 0) {
          const questionsToInsert = request.questions.map(q => ({
            questionnaire_id: questionnaire.id,
            title: q.title,
            description: q.description,
            question_text: q.question_text,
            order_index: q.order_index,
            required: q.required ?? true,
            min_words: q.min_words || 0,
            max_words: q.max_words,
            placeholder_text: q.placeholder_text
          }));

          const { data: questionsData, error: questionsError } = await supabase
            .from('series_questions')
            .insert(questionsToInsert)
            .select();

          if (questionsError) {
            console.error('创建问题失败:', questionsError);
            throw questionsError;
          }

          createdQuestions = questionsData || [];
        }

        // 清除相关缓存
        clearCache(`lesson_${request.lesson_id}`);
        clearCache(`questionnaire_`);

        console.log('系列问答创建成功:', questionnaire.id);

        // 返回完整数据
        const fullQuestionnaire = {
          ...questionnaire,
          questions: createdQuestions
        };

        return {
          success: true,
          data: fullQuestionnaire as SeriesQuestionnaire
        };

      } catch (error) {
        // 事务回滚：如果问答已创建但问题创建失败，删除问答
        if (questionnaire?.id) {
          console.log('执行事务回滚，删除已创建的问答:', questionnaire.id);
          await supabase
            .from('series_questionnaires')
            .delete()
            .eq('id', questionnaire.id);
        }
        throw error;
      }
    } catch (error) {
      console.error('创建系列问答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建系列问答失败'
      };
    }
  },

  /**
   * 更新系列问答
   */
  async updateSeriesQuestionnaire(request: UpdateSeriesQuestionnaireRequest): Promise<CreateSeriesQuestionnaireResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 验证数据
      const validationErrors = validateQuestionnaireData(request);
      if (validationErrors.length > 0) {
        throw new Error(`数据验证失败: ${validationErrors.join(', ')}`);
      }

      // 验证问题数据
      if (request.questions && request.questions.length > 0) {
        for (const question of request.questions) {
          const questionErrors = validateQuestionData(question);
          if (questionErrors.length > 0) {
            throw new Error(`问题验证失败: ${questionErrors.join(', ')}`);
          }
        }
      }

      // 验证权限
      const { data: questionnaire, error: checkError } = await supabase
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
        .eq('id', request.id)
        .single();

      if (checkError || !questionnaire) {
        throw new Error('系列问答不存在');
      }

      const courseAuthorId = (questionnaire as any).lessons?.course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        throw new Error('无权更新此系列问答');
      }

      // 更新系列问答基本信息
      const updateData: any = {};
      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.instructions !== undefined) updateData.instructions = request.instructions;
      if (request.ai_grading_prompt !== undefined) updateData.ai_grading_prompt = request.ai_grading_prompt;
      if (request.ai_grading_criteria !== undefined) updateData.ai_grading_criteria = request.ai_grading_criteria;
      if (request.max_score !== undefined) updateData.max_score = request.max_score;
      if (request.time_limit_minutes !== undefined) updateData.time_limit_minutes = request.time_limit_minutes;
      if (request.allow_save_draft !== undefined) updateData.allow_save_draft = request.allow_save_draft;
      if (request.skill_tags !== undefined) updateData.skill_tags = request.skill_tags;

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();

        const { error: updateError } = await supabase
          .from('series_questionnaires')
          .update(updateData)
          .eq('id', request.id);

        if (updateError) {
          console.error('更新系列问答失败:', updateError);
          throw updateError;
        }
      }

      // 处理问题更新
      if (request.questions && request.questions.length > 0) {
        for (const question of request.questions) {
          if (question._action === 'delete' && question.id) {
            // 删除问题
            const { error: deleteError } = await supabase
              .from('series_questions')
              .delete()
              .eq('id', question.id)
              .eq('questionnaire_id', request.id);

            if (deleteError) {
              console.error('删除问题失败:', deleteError);
              throw deleteError;
            }
          } else if (question._action === 'create' || !question.id) {
            // 创建新问题
            const { error: createError } = await supabase
              .from('series_questions')
              .insert({
                questionnaire_id: request.id,
                title: question.title!,
                description: question.description,
                question_text: question.question_text!,
                order_index: question.order_index!,
                required: question.required ?? true,
                min_words: question.min_words || 0,
                max_words: question.max_words,
                placeholder_text: question.placeholder_text
              });

            if (createError) {
              console.error('创建问题失败:', createError);
              throw createError;
            }
          } else if (question._action === 'update' || question.id) {
            // 更新现有问题
            const questionUpdateData: any = {};
            if (question.title !== undefined) questionUpdateData.title = question.title;
            if (question.description !== undefined) questionUpdateData.description = question.description;
            if (question.question_text !== undefined) questionUpdateData.question_text = question.question_text;
            if (question.order_index !== undefined) questionUpdateData.order_index = question.order_index;
            if (question.required !== undefined) questionUpdateData.required = question.required;
            if (question.min_words !== undefined) questionUpdateData.min_words = question.min_words;
            if (question.max_words !== undefined) questionUpdateData.max_words = question.max_words;
            if (question.placeholder_text !== undefined) questionUpdateData.placeholder_text = question.placeholder_text;

            if (Object.keys(questionUpdateData).length > 0) {
              questionUpdateData.updated_at = new Date().toISOString();

              const { error: updateQuestionError } = await supabase
                .from('series_questions')
                .update(questionUpdateData)
                .eq('id', question.id)
                .eq('questionnaire_id', request.id);

              if (updateQuestionError) {
                console.error('更新问题失败:', updateQuestionError);
                throw updateQuestionError;
              }
            }
          }
        }
      }

      // 获取更新后的完整数据
      const { data: updatedQuestionnaire, error: fetchError } = await supabase
        .from('series_questionnaires')
        .select(`
          *,
          questions:series_questions(*)
        `)
        .eq('id', request.id)
        .single();

      if (fetchError) {
        console.error('获取更新后的问答失败:', fetchError);
        throw fetchError;
      }

      return {
        success: true,
        data: updatedQuestionnaire as SeriesQuestionnaire
      };
    } catch (error) {
      console.error('更新系列问答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新系列问答失败'
      };
    }
  },

  /**
   * 获取系列问答详情
   */
  async getSeriesQuestionnaire(questionnaireId: string): Promise<GetSeriesQuestionnaireResponse> {
    try {
      // 首先尝试从lessons表获取（对于lesson类型的系列问答）
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', questionnaireId)
        .eq('type', 'series_questionnaire')
        .single();

      if (lessonData && !lessonError) {
        // 如果是lesson类型的系列问答，直接返回lesson的content
        const questionnaire = {
          id: lessonData.id,
          lesson_id: lessonData.id,
          title: lessonData.title,
          description: lessonData.content?.description || '',
          instructions: lessonData.content?.instructions || '',
          max_score: lessonData.content?.max_score || 100,
          time_limit_minutes: lessonData.content?.time_limit_minutes,
          allow_save_draft: lessonData.content?.allow_save_draft || true,
          skill_tags: lessonData.content?.skill_tags || [],
          ai_grading_prompt: lessonData.content?.ai_grading_prompt || '',
          ai_grading_criteria: lessonData.content?.ai_grading_criteria || '',
          questions: lessonData.content?.questions || [],
          created_at: lessonData.created_at,
          updated_at: lessonData.updated_at
        };

        return {
          success: true,
          data: questionnaire
        };
      }

      // 如果不是lesson类型，尝试从series_questionnaires表获取
      const { data, error } = await supabase.rpc('get_series_questionnaire_details', {
        p_questionnaire_id: questionnaireId
      });

      if (error) {
        console.error('获取系列问答详情失败:', error);
        return {
          success: false,
          error: error.message || '获取系列问答详情失败'
        };
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('获取系列问答详情失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取系列问答详情失败'
      };
    }
  },

  /**
   * 获取课时的系列问答列表（简化方法，用于学生端）
   */
  async getSeriesQuestionnairesByLesson(lessonId: string): Promise<GetSeriesQuestionnairesResponse> {
    return this.getSeriesQuestionnaires({ lesson_id: lessonId, limit: 10 });
  },

  /**
   * 获取课时的系列问答列表 - 优化版本，使用缓存
   */
  async getSeriesQuestionnaires(params: GetSeriesQuestionnairesParams): Promise<GetSeriesQuestionnairesResponse> {
    try {
      // 构建缓存键
      const cacheKey = `questionnaires_${params.lesson_id || 'all'}_${params.page || 1}_${params.limit || 10}_${params.search || ''}`;

      // 尝试从缓存获取
      const cachedData = getCache(cacheKey);
      if (cachedData) {
        return {
          success: true,
          ...cachedData
        };
      }

      let query = supabase
        .from('series_questionnaires')
        .select(`
          id,
          title,
          description,
          instructions,
          lesson_id,
          max_score,
          time_limit_minutes,
          allow_save_draft,
          skill_tags,
          created_at,
          updated_at,
          questions:series_questions(
            id,
            title,
            order_index,
            required
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // 添加筛选条件
      if (params.lesson_id) {
        query = query.eq('lesson_id', params.lesson_id);
      }

      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('获取系列问答列表失败:', error);
        return {
          success: false,
          error: error.message || '获取系列问答列表失败'
        };
      }

      const result = {
        data: data as SeriesQuestionnaire[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };

      // 缓存结果
      setCache(cacheKey, result);

      return {
        success: true,
        ...result
      };
    } catch (error) {
      console.error('获取系列问答列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取系列问答列表失败'
      };
    }
  },

  /**
   * 删除系列问答
   */
  async deleteSeriesQuestionnaire(questionnaireId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 检查权限
      const { data: questionnaire, error: checkError } = await supabase
        .from('series_questionnaires')
        .select('lesson_id, lessons!inner(module_id, course_modules!inner(course_id, courses!inner(author_id)))')
        .eq('id', questionnaireId)
        .single();

      if (checkError || !questionnaire) {
        throw new Error('系列问答不存在');
      }

      // 验证权限（通过课程作者）
      const courseAuthorId = (questionnaire as any).lessons?.course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        throw new Error('无权删除此系列问答');
      }

      // 删除系列问答（级联删除相关数据）
      const { error } = await supabase
        .from('series_questionnaires')
        .delete()
        .eq('id', questionnaireId);

      if (error) {
        console.error('删除系列问答失败:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('删除系列问答失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '删除系列问答失败'
      };
    }
  },

  // ==================== 学生端API ====================

  /**
   * 获取学生提交状态 - 优化版本，使用缓存
   */
  async getStudentSubmissionStatus(questionnaireId: string): Promise<GetStudentSubmissionStatusResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const cacheKey = `submission_status_${questionnaireId}_${user.id}`;

      // 尝试从缓存获取
      const cachedStatus = getCache(cacheKey);
      if (cachedStatus && cachedStatus.hasOwnProperty('can_submit')) {
        return {
          success: true,
          data: cachedStatus
        };
      }

      // 检查是否为lesson类型的系列问答
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', questionnaireId)
        .eq('type', 'series_questionnaire')
        .single();

      const isLessonType = !!lessonData;

      // 根据类型构建查询
      let queryBuilder = supabase
        .from('series_submissions')
        .select(`
          id,
          status,
          answers,
          total_words,
          time_spent_minutes,
          submitted_at,
          updated_at,
          series_ai_gradings(
            ai_score,
            ai_feedback,
            final_score
          )
        `)
        .eq('student_id', user.id);

      if (isLessonType) {
        // 对于lesson类型，使用lesson_id字段
        queryBuilder = queryBuilder.eq('lesson_id', questionnaireId).is('questionnaire_id', null);
      } else {
        // 对于独立系列问答，使用questionnaire_id字段
        queryBuilder = queryBuilder.eq('questionnaire_id', questionnaireId);
      }

      const { data: submission, error } = await queryBuilder.single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('获取学生提交状态失败:', error);
        return {
          success: false,
          error: error.message || '获取学生提交状态失败'
        };
      }

      // 如果有提交记录，转换答案格式从对象到数组
      let processedSubmission = submission;
      if (submission && submission.answers) {
        const answersArray: SeriesAnswer[] = [];
        const answersObj = submission.answers as Record<string, string>;

        Object.entries(answersObj).forEach(([questionId, answerText]) => {
          answersArray.push({
            question_id: questionId,
            answer_text: answerText
          });
        });

        processedSubmission = {
          ...submission,
          answers: answersArray
        };
      }

      // 构建状态数据
      const statusData = {
        submission: processedSubmission || null,
        has_submission: !!submission,
        can_submit: !submission || submission.status === 'draft', // 没有提交或状态为草稿时可以提交
        time_remaining: null // TODO: 如果需要时间限制，在这里计算
      };

      // 缓存结果
      setCache(cacheKey, statusData);

      return {
        success: true,
        data: statusData
      };
    } catch (error) {
      console.error('获取学生提交状态失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取学生提交状态失败'
      };
    }
  },

  /**
   * 保存草稿 - 重写版本，正确处理lesson类型和独立系列问答
   */
  async saveSeriesDraft(request: SaveSeriesDraftRequest): Promise<SubmitSeriesAnswersResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 验证问答是否存在并获取相关信息
      let allowSaveDraft = true;
      let isLessonType = false;
      let lessonId: string | null = null;

      // 首先尝试从lessons表查找
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('id, content')
        .eq('id', request.questionnaire_id)
        .eq('type', 'series_questionnaire')
        .single();

      if (lessonData && !lessonError) {
        // 这是lesson类型的系列问答
        isLessonType = true;
        lessonId = lessonData.id;
        allowSaveDraft = lessonData.content?.allow_save_draft !== false;
      } else {
        // 尝试从series_questionnaires表查找
        const { data: questionnaireData, error: questionnaireError } = await supabase
          .from('series_questionnaires')
          .select('id, allow_save_draft, lesson_id')
          .eq('id', request.questionnaire_id)
          .single();

        if (questionnaireError || !questionnaireData) {
          throw new Error('系列问答不存在');
        }

        isLessonType = false;
        lessonId = questionnaireData.lesson_id;
        allowSaveDraft = questionnaireData.allow_save_draft;
      }

      if (!allowSaveDraft) {
        throw new Error('此系列问答不允许保存草稿');
      }

      // 计算总字数
      const totalWords = request.answers.reduce((total, answer) => {
        return total + (answer.answer_text?.split(/\s+/).filter(word => word.length > 0).length || 0);
      }, 0);

      // 将答案数组转换为对象格式（数据库期望的格式）
      const answersObject: Record<string, string> = {};
      request.answers.forEach(answer => {
        answersObject[answer.question_id] = answer.answer_text;
      });

      // 构建查询条件 - 根据类型使用不同的字段
      let queryBuilder = supabase
        .from('series_submissions')
        .select('id, status')
        .eq('student_id', user.id);

      if (isLessonType) {
        // 对于lesson类型，使用lesson_id字段
        queryBuilder = queryBuilder.eq('lesson_id', request.questionnaire_id).is('questionnaire_id', null);
      } else {
        // 对于独立系列问答，使用questionnaire_id字段
        queryBuilder = queryBuilder.eq('questionnaire_id', request.questionnaire_id);
      }

      const { data: existingSubmission } = await queryBuilder.single();

      let submission;
      if (existingSubmission) {
        // 更新现有记录
        const { data: updatedSubmission, error: updateError } = await supabase
          .from('series_submissions')
          .update({
            answers: answersObject,
            total_words: totalWords,
            time_spent_minutes: request.time_spent_minutes || 0,
            status: 'draft', // 确保状态为草稿
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id)
          .select()
          .single();

        if (updateError) {
          console.error('更新草稿失败:', updateError);
          throw updateError;
        }
        submission = updatedSubmission;
      } else {
        // 创建新草稿 - 根据类型设置不同的字段
        const insertData: any = {
          student_id: user.id,
          status: 'draft',
          answers: answersObject,
          total_words: totalWords,
          time_spent_minutes: request.time_spent_minutes || 0
        };

        if (isLessonType) {
          // 对于lesson类型，设置lesson_id，questionnaire_id为null
          insertData.lesson_id = request.questionnaire_id;
          insertData.questionnaire_id = null;
        } else {
          // 对于独立系列问答，设置questionnaire_id，lesson_id可选
          insertData.questionnaire_id = request.questionnaire_id;
          if (lessonId) {
            insertData.lesson_id = lessonId;
          }
        }

        const { data: newSubmission, error: createError } = await supabase
          .from('series_submissions')
          .insert(insertData)
          .select()
          .single();

        if (createError) {
          console.error('创建草稿失败:', createError);
          throw createError;
        }
        submission = newSubmission;
      }

      return {
        success: true,
        data: {
          submission: submission as SeriesSubmission,
          redirect_to_grading: false
        }
      };
    } catch (error) {
      console.error('保存草稿失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '保存草稿失败'
      };
    }
  },

  /**
   * 提交答案 - 优化版本，使用缓存和性能优化
   */
  async submitSeriesAnswers(request: SubmitSeriesAnswersRequest): Promise<SubmitSeriesAnswersResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const cacheKey = `questionnaire_${request.questionnaire_id}_${user.id}`;

      // 尝试从缓存获取问答信息
      let questionnaire = getCache(`questionnaire_${request.questionnaire_id}`);

      if (!questionnaire) {
        // 首先尝试从lessons表获取（对于lesson类型的系列问答）
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('id, content')
          .eq('id', request.questionnaire_id)
          .eq('type', 'series_questionnaire')
          .single();

        if (lessonData && !lessonError) {
          // 如果是lesson类型的系列问答，从content中提取信息
          questionnaire = {
            id: lessonData.id,
            ai_grading_prompt: lessonData.content?.ai_grading_prompt || '',
            ai_grading_criteria: lessonData.content?.ai_grading_criteria || '',
            skill_tags: lessonData.content?.skill_tags || [],
            questions: lessonData.content?.questions || []
          };
        } else {
          // 如果不是lesson类型，从series_questionnaires表获取
          const { data: questionnaireData, error: questionnaireError } = await supabase
            .from('series_questionnaires')
            .select(`
              id,
              ai_grading_prompt,
              ai_grading_criteria,
              skill_tags,
              questions:series_questions(id, required, min_words, max_words, title)
            `)
            .eq('id', request.questionnaire_id)
            .single();

          if (questionnaireError || !questionnaireData) {
            throw new Error('系列问答不存在');
          }

          questionnaire = questionnaireData;
        }

        setCache(`questionnaire_${request.questionnaire_id}`, questionnaire);
      }

      // 验证答案数据
      const questions = (questionnaire as any).questions || [];
      const answerValidationErrors = validateAnswerData(request.answers, questions);
      if (answerValidationErrors.length > 0) {
        throw new Error(`答案验证失败: ${answerValidationErrors.join(', ')}`);
      }

      // 计算总字数
      const totalWords = request.answers.reduce((total, answer) => {
        return total + (answer.answer_text?.split(/\s+/).filter(word => word.length > 0).length || 0);
      }, 0);

      // 检查是否已有提交记录 - 根据类型使用不同的查询
      // 首先检查是否为lesson类型
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('id')
        .eq('id', request.questionnaire_id)
        .eq('type', 'series_questionnaire')
        .single();

      const isLessonType = !!lessonData;

      let queryBuilder = supabase
        .from('series_submissions')
        .select('id, status')
        .eq('student_id', user.id);

      if (isLessonType) {
        // 对于lesson类型，使用lesson_id字段
        queryBuilder = queryBuilder.eq('lesson_id', request.questionnaire_id).is('questionnaire_id', null);
      } else {
        // 对于独立系列问答，使用questionnaire_id字段
        queryBuilder = queryBuilder.eq('questionnaire_id', request.questionnaire_id);
      }

      const { data: existingSubmission, error: checkError } = await queryBuilder.single();

      if (existingSubmission && existingSubmission.status === 'submitted') {
        throw new Error('已经提交过答案，不能重复提交');
      }

      // 将答案数组转换为对象格式（数据库期望的格式）
      const answersObject: Record<string, string> = {};
      request.answers.forEach(answer => {
        answersObject[answer.question_id] = answer.answer_text;
      });

      let submission;
      const submissionData = {
        answers: answersObject, // 使用对象格式而不是数组
        status: request.status,
        total_words: totalWords,
        time_spent_minutes: request.time_spent_minutes || 0,
        submitted_at: request.status === 'submitted' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      try {
        if (existingSubmission) {
          // 更新现有提交
          const { data: updatedSubmission, error: updateError } = await supabase
            .from('series_submissions')
            .update(submissionData)
            .eq('id', existingSubmission.id)
            .select()
            .single();

          if (updateError) {
            console.error('更新提交失败:', updateError);
            throw updateError;
          }
          submission = updatedSubmission;
        } else {
          // 创建新提交 - 根据类型设置不同的字段
          const insertData: any = {
            student_id: user.id,
            ...submissionData
          };

          if (isLessonType) {
            // 对于lesson类型，设置lesson_id，questionnaire_id为null
            insertData.lesson_id = request.questionnaire_id;
            insertData.questionnaire_id = null;
          } else {
            // 对于独立系列问答，设置questionnaire_id
            insertData.questionnaire_id = request.questionnaire_id;
          }

          const { data: newSubmission, error: createError } = await supabase
            .from('series_submissions')
            .insert(insertData)
            .select()
            .single();

          if (createError) {
            console.error('创建提交失败:', createError);
            throw createError;
          }
          submission = newSubmission;
        }

        // 如果是正式提交，处理游戏化奖励
        if (request.status === 'submitted') {
          try {
            // 获取问卷标题用于游戏化记录
            const { data: questionnaireInfo } = await supabase
              .from('series_questionnaires')
              .select('title')
              .eq('id', request.questionnaire_id)
              .single();

            const questionnaireTitle = questionnaireInfo?.title || '系列问答';

            // 处理系列问答完成的游戏化奖励
            await gamificationService.handleSeriesQuestionnaireComplete(
              user.id,
              request.questionnaire_id,
              questionnaireTitle,
              questionnaire.skill_tags || [],
              totalWords
            );
          } catch (expError) {
            console.warn('处理游戏化奖励失败:', expError);
            // 不影响主流程，继续执行
          }
        }

        // 清除相关缓存
        clearCache(cacheKey);
        clearCache(`submission_status_${request.questionnaire_id}_${user.id}`);

        // 判断是否需要自动AI评分
        const shouldAutoGrade = request.status === 'submitted' &&
                               questionnaire.ai_grading_prompt &&
                               questionnaire.ai_grading_criteria;

        console.log('答案提交成功:', submission.id, shouldAutoGrade ? '(将进行AI评分)' : '');

        return {
          success: true,
          data: {
            submission: submission as SeriesSubmission,
            redirect_to_grading: shouldAutoGrade
          }
        };

      } catch (error) {
        // 如果提交失败，清除可能的缓存
        clearCache(cacheKey);
        throw error;
      }
    } catch (error) {
      console.error('提交答案失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交答案失败'
      };
    }
  },

  // ==================== AI评分API ====================

  /**
   * 触发AI评分 - 优化版本，使用缓存和性能优化
   */
  async triggerAIGrading(request: AIGradeSeriesRequest): Promise<AIGradeSeriesResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      const cacheKey = `ai_grading_${request.submission_id}`;

      // 如果不是强制重新评分，先检查缓存
      if (!request.force_regrade) {
        const cachedGrading = getCache(cacheKey);
        if (cachedGrading) {
          return {
            success: true,
            data: cachedGrading
          };
        }
      }

      // 获取提交信息和问答配置 - 优化查询
      const { data: submission, error: submissionError } = await supabase
        .from('series_submissions')
        .select(`
          id,
          student_id,
          status,
          answers,
          questionnaire:series_questionnaires(
            id,
            title,
            description,
            ai_grading_prompt,
            ai_grading_criteria,
            max_score,
            lesson_id,
            lessons!inner(
              course_modules!inner(
                courses!inner(author_id)
              )
            )
          )
        `)
        .eq('id', request.submission_id)
        .single();

      if (submissionError || !submission) {
        throw new Error('提交记录不存在');
      }

      // 验证权限（教师或学生本人）
      const courseAuthorId = (submission as any).questionnaire?.lessons?.course_modules?.courses?.author_id;
      const isTeacher = courseAuthorId === user.id;
      const isStudent = submission.student_id === user.id;

      if (!isTeacher && !isStudent) {
        throw new Error('无权访问此提交');
      }

      if (submission.status !== 'submitted') {
        throw new Error('只能对已提交的答案进行评分');
      }

      const questionnaire = (submission as any).questionnaire;
      if (!questionnaire?.ai_grading_prompt || !questionnaire?.ai_grading_criteria) {
        throw new Error('此问答未配置AI评分');
      }

      // 检查是否已有AI评分且不强制重新评分
      let previousGrading = null;
      if (!request.force_regrade) {
        const { data: existingGrading } = await supabase
          .from('series_ai_gradings')
          .select('*')
          .eq('submission_id', request.submission_id)
          .single();

        if (existingGrading) {
          // 缓存现有评分结果
          setCache(cacheKey, existingGrading);
          return {
            success: true,
            data: existingGrading as SeriesAIGrading
          };
        }
      } else {
        // 如果是强制重新评分，获取之前的评分结果作为参考
        const { data: existingGrading } = await supabase
          .from('series_ai_gradings')
          .select('*')
          .eq('submission_id', request.submission_id)
          .single();

        previousGrading = existingGrading;
      }

      // 获取问答的问题列表 - 使用缓存
      const questionsKey = `questions_${questionnaire.id}`;
      let questions = getCache(questionsKey);

      if (!questions) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('series_questions')
          .select('id, title, question_text, order_index, required, min_words, max_words')
          .eq('questionnaire_id', questionnaire.id)
          .order('order_index');

        if (questionsError) {
          throw new Error('获取问题列表失败');
        }

        questions = questionsData || [];
        setCache(questionsKey, questions);
      }

      // 调用AI评分服务
      const aiGradingData: SeriesQuestionnaireData = {
        questionnaire: {
          title: questionnaire.title,
          description: questionnaire.description,
          ai_grading_prompt: questionnaire.ai_grading_prompt,
          ai_grading_criteria: questionnaire.ai_grading_criteria,
          max_score: questionnaire.max_score || 100
        },
        questions: questions,
        answers: submission.answers || []
      };

      console.log('开始AI评分:', request.submission_id);

      // 根据是否强制重新评分选择不同的评分方法
      let aiResult;
      try {
        if (request.force_regrade && previousGrading) {
          // 构建之前的评分结果用于参考
          const previousResult = {
            overall_score: previousGrading.ai_score || 0,
            overall_feedback: previousGrading.ai_feedback || '',
            detailed_feedback: previousGrading.ai_detailed_feedback || [],
            criteria_scores: {},
            suggestions: []
          };
          aiResult = await gradeSeriesQuestionnaire(aiGradingData);
        } else {
          aiResult = await gradeSeriesQuestionnaire(aiGradingData);
        }
      } catch (aiError) {
        console.error('AI评分失败:', aiError);
        throw new Error('AI评分服务暂时不可用，请稍后重试');
      }

      // 保存或更新AI评分结果
      const gradingData = {
        submission_id: request.submission_id,
        ai_score: aiResult.overall_score,
        ai_feedback: aiResult.overall_feedback,
        ai_detailed_feedback: aiResult.detailed_feedback,
        final_score: aiResult.overall_score, // 如果没有教师评分，AI评分就是最终分数
        grading_criteria_used: questionnaire.ai_grading_criteria,
        graded_at: new Date().toISOString()
      };

      const { data: grading, error: gradingError } = await supabase
        .from('series_ai_gradings')
        .upsert(gradingData, {
          onConflict: 'submission_id'
        })
        .select()
        .single();

      if (gradingError) {
        console.error('保存AI评分失败:', gradingError);
        throw gradingError;
      }

      // 更新提交状态为已评分
      const { error: updateError } = await supabase
        .from('series_submissions')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.submission_id);

      if (updateError) {
        console.error('更新提交状态失败:', updateError);
        // 不抛出错误，因为评分已经保存成功
      }

      // 缓存评分结果
      setCache(cacheKey, grading);

      // 清除相关缓存
      clearCache(`submission_status_${questionnaire.id}_${submission.student_id}`);

      // 处理评分完成的游戏化奖励
      try {
        await gamificationService.handleSeriesQuestionnaireGraded(
          submission.student_id,
          questionnaire.id,
          questionnaire.title || '系列问答',
          aiResult.overall_score,
          questionnaire.max_score || 100
        );
      } catch (expError) {
        console.warn('处理评分游戏化奖励失败:', expError);
        // 不影响主流程，继续执行
      }

      console.log('AI评分完成:', grading.id, '分数:', grading.ai_score);

      return {
        success: true,
        data: grading as SeriesAIGrading
      };
    } catch (error) {
      console.error('AI评分失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI评分失败'
      };
    }
  },

  /**
   * 批量AI评分（用于教师批量处理多个提交）
   */
  async batchAIGrading(request: {
    questionnaire_id: string;
    submission_ids?: string[];
    force_regrade?: boolean;
  }): Promise<{
    success: boolean;
    data?: {
      total_processed: number;
      successful_gradings: number;
      failed_gradings: number;
      results: Array<{
        submission_id: string;
        success: boolean;
        grading?: SeriesAIGrading;
        error?: string;
      }>;
    };
    error?: string;
  }> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 获取问答配置和验证权限
      const { data: questionnaire, error: questionnaireError } = await supabase
        .from('series_questionnaires')
        .select(`
          *,
          lesson:lessons!inner(
            module_id,
            course_modules!inner(
              course_id,
              courses!inner(author_id)
            )
          )
        `)
        .eq('id', request.questionnaire_id)
        .single();

      if (questionnaireError || !questionnaire) {
        throw new Error('问答不存在');
      }

      // 验证权限（只有教师可以批量评分）
      const courseAuthorId = (questionnaire as any).lesson?.course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        throw new Error('只有课程作者可以进行批量评分');
      }

      if (!questionnaire.ai_grading_prompt || !questionnaire.ai_grading_criteria) {
        throw new Error('此问答未配置AI评分');
      }

      // 获取需要评分的提交
      let submissionsQuery = supabase
        .from('series_submissions')
        .select('*')
        .eq('questionnaire_id', request.questionnaire_id)
        .eq('status', 'submitted');

      if (request.submission_ids && request.submission_ids.length > 0) {
        submissionsQuery = submissionsQuery.in('id', request.submission_ids);
      }

      const { data: submissions, error: submissionsError } = await submissionsQuery;

      if (submissionsError) {
        throw new Error('获取提交列表失败');
      }

      if (!submissions || submissions.length === 0) {
        return {
          success: true,
          data: {
            total_processed: 0,
            successful_gradings: 0,
            failed_gradings: 0,
            results: []
          }
        };
      }

      const results = [];
      let successfulGradings = 0;
      let failedGradings = 0;

      // 逐个处理提交（避免API限制）
      for (const submission of submissions) {
        try {
          // 检查是否已有评分
          if (!request.force_regrade) {
            const { data: existingGrading } = await supabase
              .from('series_ai_gradings')
              .select('id')
              .eq('submission_id', submission.id)
              .single();

            if (existingGrading) {
              results.push({
                submission_id: submission.id,
                success: false,
                error: '已存在评分结果'
              });
              failedGradings++;
              continue;
            }
          }

          // 调用单个AI评分
          const gradingResult = await this.triggerAIGrading({
            submission_id: submission.id,
            force_regrade: request.force_regrade
          });

          if (gradingResult.success) {
            results.push({
              submission_id: submission.id,
              success: true,
              grading: gradingResult.data
            });
            successfulGradings++;
          } else {
            results.push({
              submission_id: submission.id,
              success: false,
              error: gradingResult.error
            });
            failedGradings++;
          }

          // 添加延迟避免API限制
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`批量评分失败 - 提交ID: ${submission.id}`, error);
          results.push({
            submission_id: submission.id,
            success: false,
            error: error instanceof Error ? error.message : '评分失败'
          });
          failedGradings++;
        }
      }

      return {
        success: true,
        data: {
          total_processed: submissions.length,
          successful_gradings: successfulGradings,
          failed_gradings: failedGradings,
          results: results
        }
      };

    } catch (error) {
      console.error('批量AI评分失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量AI评分失败'
      };
    }
  },

  /**
   * 教师评分
   */
  async teacherGradeSeries(request: TeacherGradeSeriesRequest): Promise<AIGradeSeriesResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 获取提交信息并验证权限
      const { data: submission, error: submissionError } = await supabase
        .from('series_submissions')
        .select(`
          *,
          questionnaire:series_questionnaires(
            max_score,
            lesson_id,
            lessons!inner(
              module_id,
              course_modules!inner(
                course_id,
                courses!inner(author_id)
              )
            )
          )
        `)
        .eq('id', request.submission_id)
        .single();

      if (submissionError || !submission) {
        throw new Error('提交记录不存在');
      }

      // 验证教师权限
      const courseAuthorId = (submission as any).questionnaire?.lessons?.course_modules?.courses?.author_id;
      if (courseAuthorId !== user.id) {
        throw new Error('无权评分此提交');
      }

      if (submission.status !== 'submitted' && submission.status !== 'graded') {
        throw new Error('只能对已提交的答案进行评分');
      }

      const questionnaire = (submission as any).questionnaire;
      const maxScore = questionnaire?.max_score || 100;

      // 验证分数范围
      if (request.teacher_score < 0 || request.teacher_score > maxScore) {
        throw new Error(`分数必须在0-${maxScore}之间`);
      }

      // 获取现有的AI评分（如果有）
      const { data: existingGrading } = await supabase
        .from('series_ai_gradings')
        .select('*')
        .eq('submission_id', request.submission_id)
        .single();

      const gradingData = {
        submission_id: request.submission_id,
        teacher_score: request.teacher_score,
        teacher_feedback: request.teacher_feedback,
        final_score: request.teacher_score, // 教师评分作为最终分数
        teacher_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // 保留现有的AI评分数据
        ...(existingGrading && {
          ai_score: existingGrading.ai_score,
          ai_feedback: existingGrading.ai_feedback,
          ai_detailed_feedback: existingGrading.ai_detailed_feedback,
          grading_criteria_used: existingGrading.grading_criteria_used,
          graded_at: existingGrading.graded_at
        })
      };

      // 如果没有现有评分记录，创建新记录
      if (!existingGrading) {
        (gradingData as any).created_at = new Date().toISOString();
      }

      const { data: grading, error: gradingError } = await supabase
        .from('series_ai_gradings')
        .upsert(gradingData, {
          onConflict: 'submission_id'
        })
        .select()
        .single();

      if (gradingError) {
        console.error('保存教师评分失败:', gradingError);
        throw gradingError;
      }

      // 更新提交状态为已评分
      const { error: updateError } = await supabase
        .from('series_submissions')
        .update({
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', request.submission_id);

      if (updateError) {
        console.error('更新提交状态失败:', updateError);
        // 不抛出错误，因为评分已经保存成功
      }

      // 处理教师评分完成的游戏化奖励
      try {
        // 获取问卷信息
        const { data: questionnaireInfo } = await supabase
          .from('series_questionnaires')
          .select('title, max_score')
          .eq('id', (submission as any).questionnaire_id)
          .single();

        await gamificationService.handleSeriesQuestionnaireGraded(
          submission.student_id,
          (submission as any).questionnaire_id,
          questionnaireInfo?.title || '系列问答',
          request.teacher_score,
          questionnaireInfo?.max_score || 100
        );
      } catch (expError) {
        console.warn('处理教师评分游戏化奖励失败:', expError);
        // 不影响主流程，继续执行
      }

      return {
        success: true,
        data: grading as SeriesAIGrading
      };
    } catch (error) {
      console.error('教师评分失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '教师评分失败'
      };
    }
  },

  // ==================== 提交管理API ====================

  /**
   * 获取提交列表（教师用）
   */
  async getSubmissions(params: GetSubmissionsParams): Promise<GetSubmissionsResponse> {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      let query = supabase
        .from('series_submissions')
        .select(`
          *,
          questionnaire:series_questionnaires(*),
          student_profile:profiles(username, email),
          series_ai_gradings(*)
        `)
        .eq('questionnaire_id', params.questionnaire_id);

      // 添加筛选条件
      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.student_id) {
        query = query.eq('student_id', params.student_id);
      }

      // 排序
      const sortBy = params.sort_by || 'submitted_at';
      const sortOrder = params.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 分页
      const page = params.page || 1;
      const limit = params.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('获取提交列表失败:', error);
        return {
          success: false,
          error: error.message || '获取提交列表失败'
        };
      }

      return {
        success: true,
        data: data as SeriesSubmission[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('获取提交列表失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取提交列表失败'
      };
    }
  }
};
