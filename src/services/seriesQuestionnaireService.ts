import {
  SeriesQuestionnaire,
  SeriesQuestion,
  SeriesSubmission,
  SeriesAIGrading,
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
import { aiGradingFix } from '@/services/aiGradingFix';
import { SeriesQuestionnaireCacheManager } from './seriesQuestionnaireCacheManager';
import { SeriesQuestionnaireRepository } from './seriesQuestionnaireRepository';
import {
  validateQuestionnaireData,
  validateQuestionData,
  validateAnswerData,
  calculateTotalWords,
  answersArrayToObject,
  answersObjectToArray,
  PermissionChecker,
  QuestionnaireTypeChecker,
  QuestionUpdateHelper,
  transformQuestionsForAIGrading,
  buildErrorResponse,
  buildSuccessResponse,
  ValidationError
} from './seriesQuestionnaireHelpers';

// 初始化缓存管理器
const cacheManager = SeriesQuestionnaireCacheManager.getInstance();

// 导出缓存以保持向后兼容
export const seriesQuestionnaireCache = {};

// ==================== 辅助函数 ====================

/**
 * 处理游戏化奖励（提取公共逻辑）
 */
async function handleGamificationRewards(
  type: 'complete' | 'graded',
  userId: string,
  questionnaireId: string,
  questionnaireTitle: string,
  data: {
    skillTags?: string[];
    totalWords?: number;
    score?: number;
    maxScore?: number;
  }
): Promise<void> {
  try {
    if (type === 'complete' && data.skillTags && data.totalWords !== undefined) {
      await gamificationService.handleSeriesQuestionnaireComplete(
        userId,
        questionnaireId,
        questionnaireTitle,
        data.skillTags,
        data.totalWords
      );
    } else if (type === 'graded' && data.score !== undefined && data.maxScore !== undefined) {
      await gamificationService.handleSeriesQuestionnaireGraded(
        userId,
        questionnaireId,
        questionnaireTitle,
        data.score,
        data.maxScore
      );
    }
  } catch (error) {
    console.warn(`处理${type === 'complete' ? '完成' : '评分'}游戏化奖励失败:`, error);
    // 不影响主流程
  }
}

export const seriesQuestionnaireService = {
  // ==================== 教师端API ====================

  /**
   * 创建系列问答
   */
  async createSeriesQuestionnaire(request: CreateSeriesQuestionnaireRequest): Promise<CreateSeriesQuestionnaireResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 验证数据
      const validationErrors = validateQuestionnaireData(request);
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
      }

      // 验证问题数据
      if (request.questions && request.questions.length > 0) {
        for (const question of request.questions) {
          const questionErrors = validateQuestionData(question);
          if (questionErrors.length > 0) {
            throw new ValidationError(questionErrors);
          }
        }
      }

      // 验证权限
      await PermissionChecker.requireCourseAuthor(request.lesson_id, userId);

      // 使用事务处理确保数据一致性
      let questionnaire: any;
      let createdQuestions: any[] = [];

      try {
        // 创建系列问答
        questionnaire = await SeriesQuestionnaireRepository.createQuestionnaire({
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
        });

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

          createdQuestions = await SeriesQuestionnaireRepository.createQuestions(questionsToInsert);
        }

        // 清除相关缓存
        cacheManager.clearPattern(`lesson_${request.lesson_id}`);
        cacheManager.clearPattern(`questionnaire_`);

        console.log('系列问答创建成功:', questionnaire.id);

        // 返回完整数据
        const fullQuestionnaire = {
          ...questionnaire,
          questions: createdQuestions
        };

        return buildSuccessResponse(fullQuestionnaire as SeriesQuestionnaire);

      } catch (error) {
        // 事务回滚：如果问答已创建但问题创建失败，删除问答
        if (questionnaire?.id) {
          console.log('执行事务回滚，删除已创建的问答:', questionnaire.id);
          await SeriesQuestionnaireRepository.deleteQuestionnaire(questionnaire.id);
        }
        throw error;
      }
    } catch (error) {
      console.error('创建系列问答失败:', error);
      return buildErrorResponse(error, '创建系列问答失败');
    }
  },

  /**
   * 更新系列问答
   */
  async updateSeriesQuestionnaire(request: UpdateSeriesQuestionnaireRequest): Promise<CreateSeriesQuestionnaireResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 验证数据
      const validationErrors = validateQuestionnaireData(request);
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
      }

      // 验证问题数据
      if (request.questions && request.questions.length > 0) {
        for (const question of request.questions) {
          const questionErrors = validateQuestionData(question);
          if (questionErrors.length > 0) {
            throw new ValidationError(questionErrors);
          }
        }
      }

      // 验证权限
      const { questionnaire, courseAuthorId } = await SeriesQuestionnaireRepository.getQuestionnaireWithAuth(
        request.id
      );

      if (courseAuthorId !== userId) {
        throw new Error('无权更新此系列问答');
      }

      // 构建更新数据
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

      // 更新系列问答基本信息
      if (Object.keys(updateData).length > 0) {
        await SeriesQuestionnaireRepository.updateQuestionnaire(request.id, updateData);
      }

      // 处理问题更新
      if (request.questions && request.questions.length > 0) {
        await QuestionUpdateHelper.processQuestionUpdates(request.id, request.questions);
      }

      // 清除缓存
      cacheManager.clearPattern(`questionnaire_${request.id}`);
      cacheManager.clearPattern(`lesson_${questionnaire.lesson_id}`);

      // 获取更新后的完整数据
      const updatedQuestionnaire = await SeriesQuestionnaireRepository.getQuestionnaireDetails(request.id);

      return buildSuccessResponse(updatedQuestionnaire as SeriesQuestionnaire);
    } catch (error) {
      console.error('更新系列问答失败:', error);
      return buildErrorResponse(error, '更新系列问答失败');
    }
  },

  /**
   * 获取系列问答详情
   */
  async getSeriesQuestionnaire(questionnaireId: string): Promise<GetSeriesQuestionnaireResponse> {
    try {
      // 从缓存获取
      const cacheKey = SeriesQuestionnaireCacheManager.generateKey('questionnaire', questionnaireId);
      const cached = cacheManager.get<SeriesQuestionnaire>(cacheKey);
      if (cached) {
        // 确保返回的数据包含questions属性
        const questions = (cached as any).questions || [];
        return {
          success: true,
          data: {
            ...cached,
            questions
          }
        };
      }

      // 获取问答信息
      const { questionnaire } = await QuestionnaireTypeChecker.getQuestionnaireInfo(questionnaireId);
      
      // 确保返回的数据包含questions属性
      const questions = (questionnaire as any).questions || [];
      const fullQuestionnaire = {
        ...questionnaire,
        questions
      };
      
      // 缓存结果
      cacheManager.set(cacheKey, fullQuestionnaire);
      
      return {
        success: true,
        data: fullQuestionnaire
      };
    } catch (error) {
      console.error('获取系列问答详情失败:', error);
      return buildErrorResponse(error, '获取系列问答详情失败');
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
      const cacheKey = SeriesQuestionnaireCacheManager.generateQuestionnaireListKey(params);

      // 尝试从缓存获取
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        return buildSuccessResponse(cachedData);
      }

      const page = params.page || 1;
      const limit = params.limit || 10;

      const { data, count } = await SeriesQuestionnaireRepository.getQuestionnaires({
        lesson_id: params.lesson_id,
        search: params.search,
        page,
        limit
      });

      const result = {
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };

      // 缓存结果
      cacheManager.set(cacheKey, result);

      return {
        success: true,
        data,
        pagination: result.pagination
      };
    } catch (error) {
      console.error('获取系列问答列表失败:', error);
      return buildErrorResponse(error, '获取系列问答列表失败');
    }
  },

  /**
   * 删除系列问答
   */
  async deleteSeriesQuestionnaire(questionnaireId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 验证权限
      const hasPermission = await PermissionChecker.checkQuestionnaireAuthor(
        questionnaireId,
        userId
      );
      if (!hasPermission) {
        throw new Error('无权删除此系列问答');
      }

      // 删除系列问答
      await SeriesQuestionnaireRepository.deleteQuestionnaire(questionnaireId);

      // 清除相关缓存
      cacheManager.clearPattern(`questionnaire_${questionnaireId}`);

      return { success: true };
    } catch (error) {
      console.error('删除系列问答失败:', error);
      return buildErrorResponse(error, '删除系列问答失败');
    }
  },

  // ==================== 学生端API ====================

  /**
   * 获取学生提交状态 - 直接查询，确保数据实时性
   */
  async getStudentSubmissionStatus(questionnaireId: string): Promise<GetStudentSubmissionStatusResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 获取问答信息
      const { isLessonType } = await QuestionnaireTypeChecker.getQuestionnaireInfo(questionnaireId);

      // 获取学生提交
      const submission = await SeriesQuestionnaireRepository.getStudentSubmission({
        student_id: userId,
        questionnaire_id: isLessonType ? undefined : questionnaireId,
        lesson_id: isLessonType ? questionnaireId : undefined,
        isLessonType
      });

      // 如果有提交记录，转换答案格式
      let processedSubmission = submission;
      if (submission && submission.answers) {
        processedSubmission = {
          ...submission,
          answers: answersObjectToArray(submission.answers as Record<string, string>)
        };
      }

      // 构建状态数据
      const statusData = {
        submission: processedSubmission || null,
        has_submission: !!submission,
        can_submit: !submission || submission.status === 'draft',
        time_remaining: null
      };

      return buildSuccessResponse(statusData);
    } catch (error) {
      console.error('获取学生提交状态失败:', error);
      return buildErrorResponse(error, '获取学生提交状态失败');
    }
  },

  /**
   * 保存草稿 - 重写版本，正确处理lesson类型和独立系列问答
   */
  async saveSeriesDraft(request: SaveSeriesDraftRequest): Promise<SubmitSeriesAnswersResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 获取问答信息
      const { isLessonType, lessonId, questionnaire } = await QuestionnaireTypeChecker.getQuestionnaireInfo(
        request.questionnaire_id
      );

      if (!questionnaire.allow_save_draft) {
        throw new Error('此系列问答不允许保存草稿');
      }

      // 准备数据
      const totalWords = calculateTotalWords(request.answers);
      const answersObject = answersArrayToObject(request.answers);

      // 获取现有提交
      const existingSubmission = await SeriesQuestionnaireRepository.getStudentSubmission({
        student_id: userId,
        questionnaire_id: isLessonType ? undefined : request.questionnaire_id,
        lesson_id: isLessonType ? request.questionnaire_id : undefined,
        isLessonType
      });

      // 准备提交数据
      const submissionData = {
        id: existingSubmission?.id,
        student_id: userId,
        questionnaire_id: isLessonType ? null : request.questionnaire_id,
        lesson_id: isLessonType ? request.questionnaire_id : lessonId,
        answers: answersObject,
        status: 'draft' as const,
        total_words: totalWords,
        time_spent_minutes: request.time_spent_minutes || 0,
        submitted_at: null
      };

      const submission = await SeriesQuestionnaireRepository.upsertSubmission(submissionData);

      return buildSuccessResponse({
        submission: submission as SeriesSubmission,
        redirect_to_grading: false
      });
    } catch (error) {
      console.error('保存草稿失败:', error);
      return buildErrorResponse(error, '保存草稿失败');
    }
  },

  /**
   * 提交答案 - 优化版本，使用缓存和性能优化
   */
  async submitSeriesAnswers(request: SubmitSeriesAnswersRequest): Promise<SubmitSeriesAnswersResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 获取问答信息
      const { isLessonType, questionnaire } = await QuestionnaireTypeChecker.getQuestionnaireInfo(
        request.questionnaire_id
      );

      // 验证答案数据
      const questions = (questionnaire as any).questions || [];
      const validationErrors = validateAnswerData(request.answers, questions);
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors);
      }

      // 计算总字数
      const totalWords = calculateTotalWords(request.answers);

      // 检查现有提交
      const existingSubmission = await SeriesQuestionnaireRepository.getStudentSubmission({
        student_id: userId,
        questionnaire_id: isLessonType ? undefined : request.questionnaire_id,
        lesson_id: isLessonType ? request.questionnaire_id : undefined,
        isLessonType
      });

      if (existingSubmission && existingSubmission.status === 'submitted') {
        throw new Error('已经提交过答案，不能重复提交');
      }

      // 准备提交数据
      const answersObject = answersArrayToObject(request.answers);
      const submissionData = {
        id: existingSubmission?.id,
        student_id: userId,
        questionnaire_id: isLessonType ? null : request.questionnaire_id,
        lesson_id: isLessonType ? request.questionnaire_id : null,
        answers: answersObject,
        status: request.status,
        total_words: totalWords,
        time_spent_minutes: request.time_spent_minutes || 0,
        submitted_at: request.status === 'submitted' ? new Date().toISOString() : null
      };

      const submission = await SeriesQuestionnaireRepository.upsertSubmission(submissionData);

      // 如果是正式提交，处理游戏化奖励
      if (request.status === 'submitted') {
        await handleGamificationRewards('complete', userId, request.questionnaire_id, 
          questionnaire.title || '系列问答', {
          skillTags: questionnaire.skill_tags || [],
          totalWords
        });
      }

      // 清除相关缓存
      cacheManager.clearPattern(`questionnaire_${request.questionnaire_id}_${userId}`);

      // 判断是否需要自动AI评分
      const shouldAutoGrade = request.status === 'submitted' &&
                             !!questionnaire.ai_grading_prompt &&
                             !!questionnaire.ai_grading_criteria;

      console.log('答案提交成功:', submission.id, shouldAutoGrade ? '(将进行AI评分)' : '');

      return buildSuccessResponse({
        submission: submission as SeriesSubmission,
        redirect_to_grading: shouldAutoGrade
      });

    } catch (error) {
      console.error('提交答案失败:', error);
      return buildErrorResponse(error, '提交答案失败');
    }
  },

  // ==================== AI评分API ====================

  /**
   * 触发AI评分 - 优化版本，使用缓存和性能优化
   */
  async triggerAIGrading(request: AIGradeSeriesRequest): Promise<AIGradeSeriesResponse> {
    try {
      const userId = await PermissionChecker.requireUser();
      const cacheKey = SeriesQuestionnaireCacheManager.generateKey('ai_grading', request.submission_id);

      // 如果不是强制重新评分，先检查缓存
      if (!request.force_regrade) {
        const cachedGrading = cacheManager.get<SeriesAIGrading>(cacheKey);
        if (cachedGrading) {
          return buildSuccessResponse(cachedGrading);
        }
      }

      // 获取提交信息和权限
      const { submission, questionnaire, courseAuthorId } = await SeriesQuestionnaireRepository.getSubmissionWithAuth(
        request.submission_id
      );

      // 验证权限
      const isTeacher = courseAuthorId === userId;
      const isStudent = submission.student_id === userId;
      if (!isTeacher && !isStudent) {
        throw new Error('无权访问此提交');
      }

      if (submission.status !== 'submitted') {
        throw new Error('只能对已提交的答案进行评分');
      }

      // 检查AI评分配置
      if (!questionnaire?.ai_grading_prompt) {
        console.log('问答配置信息:', {
          id: questionnaire?.id,
          title: questionnaire?.title,
          hasPrompt: !!questionnaire?.ai_grading_prompt,
          hasGriteria: !!questionnaire?.ai_grading_criteria,
          prompt: questionnaire?.ai_grading_prompt,
          criteria: questionnaire?.ai_grading_criteria
        });
        throw new Error('此问答未配置AI评分提示词。请在课程编辑页面为此系列问答设置AI评分提示词。');
      }

      // 如果没有评分标准，提供默认标准
      if (!questionnaire?.ai_grading_criteria) {
        console.log('未配置评分标准，使用默认标准');
        questionnaire.ai_grading_criteria = `优秀(90-100分)：回答完整准确，逻辑清晰，有独特见解
良好(80-89分)：回答较为完整，逻辑基本清晰，表达流畅
中等(70-79分)：回答基本完整，逻辑一般，表达尚可
及格(60-69分)：回答不够完整，逻辑不够清晰
不及格(0-59分)：回答严重不完整或错误`;
      }

      // 检查现有评分
      const existingGrading = await SeriesQuestionnaireRepository.getAIGrading(request.submission_id);
      if (existingGrading && !request.force_regrade) {
        cacheManager.set(cacheKey, existingGrading);
        return buildSuccessResponse(existingGrading);
      }

      // 获取问题列表
      const questions = await SeriesQuestionnaireRepository.getQuestions(questionnaire.id);

      // 准备AI评分数据 - 转换answers格式
      const answersArray = submission.answers 
        ? (Array.isArray(submission.answers) 
            ? submission.answers 
            : answersObjectToArray(submission.answers as Record<string, string>))
        : [];

      const aiGradingData: SeriesQuestionnaireData = {
        questionnaire: {
          title: questionnaire.title,
          description: questionnaire.description,
          ai_grading_prompt: questionnaire.ai_grading_prompt,
          ai_grading_criteria: questionnaire.ai_grading_criteria,
          max_score: questionnaire.max_score || 100
        },
        questions: transformQuestionsForAIGrading(questions),
        answers: answersArray
      };

      // 调用AI评分服务
      console.log('开始AI评分:', request.submission_id);
      const aiResult = await gradeSeriesQuestionnaire(aiGradingData);

      // 保存评分结果
      const saveResult = await aiGradingFix.saveOrUpdateAIGrading(request.submission_id, {
        overall_score: aiResult.overall_score,
        ai_score: aiResult.overall_score,
        ai_feedback: aiResult.overall_feedback,
        ai_detailed_feedback: aiResult.detailed_feedback,
        detailed_feedback: aiResult.detailed_feedback,
        final_score: aiResult.overall_score,
        grading_criteria_used: questionnaire.ai_grading_criteria
      });

      if (!saveResult.success) {
        console.error('保存AI评分失败:', saveResult.error);
        throw new Error(saveResult.error || '保存AI评分失败');
      }

      const grading = saveResult.data;

      // 更新提交状态
      await SeriesQuestionnaireRepository.updateSubmissionStatus(request.submission_id, 'graded');

      // 缓存评分结果
      cacheManager.set(cacheKey, grading);

      // 处理游戏化奖励
      await handleGamificationRewards('graded', submission.student_id, questionnaire.id, 
        questionnaire.title || '系列问答', {
        score: aiResult.overall_score,
        maxScore: questionnaire.max_score || 100
      });

      console.log('AI评分完成:', grading.id, '分数:', grading.ai_score);
      return buildSuccessResponse(grading as SeriesAIGrading);

    } catch (error) {
      console.error('AI评分失败:', error);
      return buildErrorResponse(error, 'AI评分失败');
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
      const userId = await PermissionChecker.requireUser();

      // 验证教师权限
      const { questionnaire, courseAuthorId } = await SeriesQuestionnaireRepository.getQuestionnaireWithAuth(
        request.questionnaire_id
      );

      if (courseAuthorId !== userId) {
        throw new Error('只有课程作者可以进行批量评分');
      }

      if (!questionnaire.ai_grading_prompt || !questionnaire.ai_grading_criteria) {
        throw new Error('此问答未配置AI评分');
      }

      // 获取需要评分的提交
      const { data: submissions } = await SeriesQuestionnaireRepository.getSubmissions({
        questionnaire_id: request.questionnaire_id,
        status: 'submitted',
        page: 1,
        limit: 100 // 一次处理最多100个
      });

      // 过滤指定的提交ID
      let targetSubmissions = submissions;
      if (request.submission_ids && request.submission_ids.length > 0) {
        targetSubmissions = submissions.filter(s => request.submission_ids!.includes(s.id));
      }

      if (targetSubmissions.length === 0) {
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

      const results: Array<{
        submission_id: string;
        success: boolean;
        grading?: SeriesAIGrading;
        error?: string;
      }> = [];
      let successfulGradings = 0;
      let failedGradings = 0;

      // 逐个处理提交
      for (const submission of targetSubmissions) {
        try {
          // 检查是否已有评分
          if (!request.force_regrade) {
            const existingGrading = await SeriesQuestionnaireRepository.getAIGrading(submission.id);
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
          total_processed: targetSubmissions.length,
          successful_gradings: successfulGradings,
          failed_gradings: failedGradings,
          results
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
      const userId = await PermissionChecker.requireUser();

      // 获取提交信息和权限
      const { submission, questionnaire, courseAuthorId } = await SeriesQuestionnaireRepository.getSubmissionWithAuth(
        request.submission_id
      );

      // 验证教师权限
      if (courseAuthorId !== userId) {
        throw new Error('无权评分此提交');
      }

      if (submission.status !== 'submitted' && submission.status !== 'graded') {
        throw new Error('只能对已提交的答案进行评分');
      }

      const maxScore = questionnaire?.max_score || 100;

      // 验证分数范围
      if (request.teacher_score < 0 || request.teacher_score > maxScore) {
        throw new Error(`分数必须在0-${maxScore}之间`);
      }

      // 使用安全的保存方法
      const saveResult = await aiGradingFix.saveOrUpdateAIGrading(request.submission_id, {
        teacher_score: request.teacher_score,
        teacher_feedback: request.teacher_feedback,
        final_score: request.teacher_score,
        teacher_reviewed_at: new Date().toISOString()
      });

      if (!saveResult.success) {
        console.error('保存教师评分失败:', saveResult.error);
        throw new Error(saveResult.error || '保存教师评分失败');
      }

      // 更新提交状态
      await SeriesQuestionnaireRepository.updateSubmissionStatus(request.submission_id, 'graded');

      // 处理游戏化奖励
      await handleGamificationRewards('graded', submission.student_id, questionnaire.id, 
        questionnaire.title || '系列问答', {
        score: request.teacher_score,
        maxScore
      });

      return buildSuccessResponse(saveResult.data as SeriesAIGrading);
    } catch (error) {
      console.error('教师评分失败:', error);
      return buildErrorResponse(error, '教师评分失败');
    }
  },

  // ==================== 提交管理API ====================

  /**
   * 获取提交列表（教师用）
   */
  async getSubmissions(params: GetSubmissionsParams): Promise<GetSubmissionsResponse> {
    try {
      const userId = await PermissionChecker.requireUser();

      // 验证教师权限
      const hasPermission = await PermissionChecker.checkQuestionnaireAuthor(
        params.questionnaire_id,
        userId
      );
      if (!hasPermission) {
        throw new Error('无权查看此问答的提交');
      }

      const page = params.page || 1;
      const limit = params.limit || 20;

      const { data, count } = await SeriesQuestionnaireRepository.getSubmissions({
        questionnaire_id: params.questionnaire_id,
        status: params.status,
        student_id: params.student_id,
        sort_by: params.sort_by,
        sort_order: params.sort_order,
        page,
        limit
      });

      return {
        success: true,
        data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('获取提交列表失败:', error);
      return buildErrorResponse(error, '获取提交列表失败');
    }
  },

  /**
   * 保存AI评分结果 - 使用安全的保存方法避免唯一约束冲突
   */
  async saveAIGrading(submissionId: string, gradingResult: any): Promise<{ success: boolean; error?: string }> {
    try {
      await PermissionChecker.requireUser();

      // 使用安全的评分保存方法
      const saveResult = await aiGradingFix.saveOrUpdateAIGrading(submissionId, gradingResult);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || '保存AI评分失败');
      }

      return { success: true };
    } catch (error) {
      console.error('保存AI评分结果失败:', error);
      return buildErrorResponse(error, '保存AI评分结果失败');
    }
  }
};
