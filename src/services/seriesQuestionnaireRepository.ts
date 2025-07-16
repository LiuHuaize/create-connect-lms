import { supabase } from "@/integrations/supabase/client";
import { 
  SeriesQuestionnaire, 
  SeriesQuestion, 
  SeriesSubmission,
  SeriesAIGrading 
} from "@/types/course";
import { Database } from "@/integrations/supabase/types";

type Tables = Database['public']['Tables'];
type SeriesQuestionnaireRow = Tables['series_questionnaires']['Row'];
type SeriesQuestionRow = Tables['series_questions']['Row'];
type SeriesSubmissionRow = Tables['series_submissions']['Row'];

/**
 * 系列问答数据访问层
 * 负责所有数据库操作，提供类型安全的查询接口
 */
export class SeriesQuestionnaireRepository {
  /**
   * 创建系列问答
   */
  static async createQuestionnaire(data: {
    title: string;
    description?: string;
    instructions?: string;
    lesson_id: string;
    ai_grading_prompt?: string;
    ai_grading_criteria?: string;
    max_score?: number;
    time_limit_minutes?: number;
    allow_save_draft?: boolean;
    skill_tags?: string[];
  }): Promise<SeriesQuestionnaireRow> {
    const { data: questionnaire, error } = await supabase
      .from('series_questionnaires')
      .insert(data)
      .select()
      .single();

    if (error || !questionnaire) {
      throw new Error('创建系列问答失败');
    }

    return questionnaire;
  }

  /**
   * 批量创建问题
   */
  static async createQuestions(questions: Array<{
    questionnaire_id: string;
    title: string;
    description?: string;
    question_text: string;
    order_index: number;
    required?: boolean;
    min_words?: number;
    max_words?: number;
    placeholder_text?: string;
  }>): Promise<SeriesQuestionRow[]> {
    const { data, error } = await supabase
      .from('series_questions')
      .insert(questions)
      .select();

    if (error || !data) {
      throw new Error('创建问题失败');
    }

    return data;
  }

  /**
   * 更新系列问答
   */
  static async updateQuestionnaire(
    id: string,
    updates: Partial<SeriesQuestionnaireRow>
  ): Promise<void> {
    const { error } = await supabase
      .from('series_questionnaires')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error('更新系列问答失败');
    }
  }

  /**
   * 删除系列问答
   */
  static async deleteQuestionnaire(id: string): Promise<void> {
    const { error } = await supabase
      .from('series_questionnaires')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('删除系列问答失败');
    }
  }

  /**
   * 获取系列问答详情（使用RPC函数）
   */
  static async getQuestionnaireDetails(id: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_series_questionnaire_details', {
      p_questionnaire_id: id
    });

    if (error) {
      throw new Error('获取系列问答详情失败');
    }

    return data;
  }

  /**
   * 获取系列问答列表
   */
  static async getQuestionnaires(params: {
    lesson_id?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{
    data: SeriesQuestionnaire[];
    count: number;
  }> {
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

    if (params.lesson_id) {
      query = query.eq('lesson_id', params.lesson_id);
    }

    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error('获取系列问答列表失败');
    }

    return {
      data: data as SeriesQuestionnaire[],
      count: count || 0
    };
  }

  /**
   * 获取课时信息（用于lesson类型的系列问答）
   */
  static async getLessonQuestionnaire(lessonId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .eq('type', 'series_questionnaire')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('获取课时信息失败');
    }

    return data;
  }

  /**
   * 获取学生提交
   */
  static async getStudentSubmission(params: {
    student_id: string;
    questionnaire_id?: string;
    lesson_id?: string;
    isLessonType: boolean;
  }): Promise<SeriesSubmissionRow | null> {
    try {
      if (params.isLessonType && params.lesson_id) {
        // 使用新创建的函数来获取数据，避免PostgREST嵌入查询问题
        const { data, error } = await supabase
          .rpc('get_series_submission_with_gradings', {
            p_student_id: params.student_id,
            p_lesson_id: params.lesson_id
          });

        if (error) {
          console.warn('获取lesson类型提交失败:', error.message, 'Code:', error.code);
          return null;
        }

        return data?.submission || null;
      } else if (params.questionnaire_id) {
        // 对于独立问卷类型，先查询submission，再单独查询gradings
        const { data: submission, error: submissionError } = await supabase
          .from('series_submissions')
          .select('*')
          .eq('student_id', params.student_id)
          .eq('questionnaire_id', params.questionnaire_id)
          .single();

        if (submissionError && submissionError.code !== 'PGRST116') {
          console.warn('获取问卷类型提交失败:', submissionError.message, 'Code:', submissionError.code);
          return null;
        }

        if (!submission) {
          return null;
        }

        // 单独查询评分数据
        const { data: gradings, error: gradingsError } = await supabase
          .from('series_ai_gradings')
          .select('*')
          .eq('submission_id', submission.id);

        if (gradingsError) {
          console.warn('获取评分数据失败:', gradingsError.message);
          // 继续返回submission，即使没有评分数据
        }

        // 组合数据
        return {
          ...submission,
          series_ai_gradings: gradings || []
        };
      }

      return null;
    } catch (error) {
      console.error('getStudentSubmission查询异常:', error);
      return null;
    }
  }

  /**
   * 创建或更新学生提交
   */
  static async upsertSubmission(submission: {
    id?: string;
    student_id: string;
    questionnaire_id?: string | null;
    lesson_id?: string | null;
    status: string;
    answers: Record<string, string>;
    total_words: number;
    time_spent_minutes: number;
    submitted_at?: string | null;
  }): Promise<SeriesSubmissionRow> {
    const dataToUpsert = {
      ...submission,
      updated_at: new Date().toISOString()
    };

    if (submission.id) {
      // 更新现有记录
      const { data, error } = await supabase
        .from('series_submissions')
        .update(dataToUpsert)
        .eq('id', submission.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error('更新提交失败');
      }

      return data;
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from('series_submissions')
        .insert(dataToUpsert)
        .select()
        .single();

      if (error || !data) {
        throw new Error('创建提交失败');
      }

      return data;
    }
  }

  /**
   * 更新提交状态
   */
  static async updateSubmissionStatus(
    id: string,
    status: 'draft' | 'submitted' | 'graded'
  ): Promise<void> {
    const { error } = await supabase
      .from('series_submissions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      throw new Error('更新提交状态失败');
    }
  }

  /**
   * 获取问题列表
   */
  static async getQuestions(questionnaireId: string): Promise<SeriesQuestion[]> {
    const { data, error } = await supabase
      .from('series_questions')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('order_index');

    if (error) {
      throw new Error('获取问题列表失败');
    }

    return data as SeriesQuestion[];
  }

  /**
   * 获取提交列表（教师用）
   */
  static async getSubmissions(params: {
    questionnaire_id: string;
    status?: string;
    student_id?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page: number;
    limit: number;
  }): Promise<{
    data: SeriesSubmission[];
    count: number;
  }> {
    // 先获取提交记录，不包含嵌入查询
    let query = supabase
      .from('series_submissions')
      .select(`
        *,
        questionnaire:series_questionnaires(*),
        student_profile:profiles(username, email)
      `, { count: 'exact' })
      .eq('questionnaire_id', params.questionnaire_id);

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.student_id) {
      query = query.eq('student_id', params.student_id);
    }

    const sortBy = params.sort_by || 'submitted_at';
    const sortOrder = params.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error('获取提交列表失败');
    }

    // 如果有提交记录，单独查询评分数据
    if (data && data.length > 0) {
      const submissionIds = data.map(submission => submission.id);
      
      // 批量查询所有相关的评分数据
      const { data: gradings, error: gradingsError } = await supabase
        .from('series_ai_gradings')
        .select('*')
        .in('submission_id', submissionIds);

      if (gradingsError) {
        console.warn('获取评分数据失败:', gradingsError.message);
      }

      // 将评分数据映射到对应的提交记录
      const gradingsMap = new Map();
      if (gradings) {
        gradings.forEach(grading => {
          if (!gradingsMap.has(grading.submission_id)) {
            gradingsMap.set(grading.submission_id, []);
          }
          gradingsMap.get(grading.submission_id).push(grading);
        });
      }

      // 组合数据
      const enrichedData = data.map(submission => ({
        ...submission,
        series_ai_gradings: gradingsMap.get(submission.id) || []
      }));

      return {
        data: enrichedData as SeriesSubmission[],
        count: count || 0
      };
    }

    return {
      data: data as SeriesSubmission[],
      count: count || 0
    };
  }

  /**
   * 获取AI评分记录
   */
  static async getAIGrading(submissionId: string): Promise<SeriesAIGrading | null> {
    const { data, error } = await supabase
      .from('series_ai_gradings')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('获取AI评分失败');
    }

    return data as SeriesAIGrading | null;
  }

  /**
   * 保存或更新AI评分记录
   */
  static async saveOrUpdateAIGrading(submissionId: string, gradingData: {
    overall_score?: number;
    ai_score?: number;
    ai_feedback?: string;
    ai_detailed_feedback?: any;
    teacher_score?: number;
    teacher_feedback?: string;
    final_score?: number;
    teacher_reviewed_at?: string;
  }): Promise<{ success: boolean; error?: string; data?: SeriesAIGrading }> {
    try {
      // 先尝试获取现有记录
      const existingGrading = await this.getAIGrading(submissionId);
      
      if (existingGrading) {
        // 更新现有记录
        const { data, error } = await supabase
          .from('series_ai_gradings')
          .update({
            ...gradingData,
            updated_at: new Date().toISOString()
          })
          .eq('submission_id', submissionId)
          .select()
          .single();

        if (error) {
          console.error('更新AI评分失败:', error);
          return { success: false, error: error.message };
        }

        return { success: true, data: data as SeriesAIGrading };
      } else {
        // 创建新记录
        const { data, error } = await supabase
          .from('series_ai_gradings')
          .insert({
            submission_id: submissionId,
            ...gradingData,
            graded_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error('创建AI评分失败:', error);
          return { success: false, error: error.message };
        }

        return { success: true, data: data as SeriesAIGrading };
      }
    } catch (error) {
      console.error('保存AI评分出错:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '保存AI评分失败' 
      };
    }
  }

  /**
   * 验证系列问答权限
   */
  static async getQuestionnaireWithAuth(questionnaireId: string): Promise<{
    questionnaire: any;
    courseAuthorId: string;
  }> {
    const { data, error } = await supabase
      .from('series_questionnaires')
      .select(`
        *,
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

    if (error || !data) {
      throw new Error('系列问答不存在');
    }

    const courseAuthorId = (data as any).lessons?.course_modules?.courses?.author_id;
    if (!courseAuthorId) {
      throw new Error('无法获取课程作者信息');
    }

    return {
      questionnaire: data,
      courseAuthorId
    };
  }

  /**
   * 获取提交信息（包含权限信息）
   */
  static async getSubmissionWithAuth(submissionId: string): Promise<{
    submission: any;
    questionnaire: any;
    courseAuthorId: string;
  }> {
    // 首先获取提交记录
    const { data: submission, error: submissionError } = await (supabase as any)
      .from('series_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      console.error('获取提交记录失败:', submissionError);
      throw new Error('提交记录不存在');
    }

    // 如果有questionnaire_id，通过问答获取课程信息
    if (submission.questionnaire_id) {
      const { data: questionnaire, error: qError } = await (supabase as any)
        .from('series_questionnaires')
        .select(`
          *,
          lessons!inner(
            module_id,
            course_modules!inner(
              course_id,
              courses!inner(author_id)
            )
          )
        `)
        .eq('id', submission.questionnaire_id)
        .single();

      if (!qError && questionnaire) {
        const courseAuthorId = (questionnaire as any).lessons?.course_modules?.courses?.author_id;
        if (courseAuthorId) {
          return {
            submission,
            questionnaire,
            courseAuthorId
          };
        }
      }
    }

    // 如果有lesson_id，直接通过lesson获取课程信息
    if (submission.lesson_id) {
      const { data: lesson, error: lessonError } = await (supabase as any)
        .from('lessons')
        .select(`
          course_modules!inner(
            course_id,
            courses!inner(author_id)
          )
        `)
        .eq('id', submission.lesson_id)
        .single();

      if (!lessonError && lesson) {
        const courseAuthorId = (lesson as any).course_modules?.courses?.author_id;
        if (courseAuthorId) {
          // 对于lesson类型的系列问答，从lesson的content中获取配置
          const { data: lessonData } = await (supabase as any)
            .from('lessons')
            .select('id, content')
            .eq('id', submission.lesson_id)
            .eq('type', 'series_questionnaire')
            .single();

          console.log('📊 getSubmissionWithAuth - lessonData查询结果:', {
            hasData: !!lessonData,
            contentType: typeof lessonData?.content,
            contentValue: lessonData?.content
          });

          // 解析content（可能是JSON字符串）
          let parsedContent = null;
          if (lessonData?.content) {
            if (typeof lessonData.content === 'string') {
              try {
                parsedContent = JSON.parse(lessonData.content);
                console.log('✅ getSubmissionWithAuth - content解析成功:', {
                  hasAIPrompt: !!parsedContent.ai_grading_prompt,
                  hasAICriteria: !!parsedContent.ai_grading_criteria,
                  aiPromptLength: parsedContent.ai_grading_prompt?.length || 0,
                  aiCriteriaLength: parsedContent.ai_grading_criteria?.length || 0
                });
              } catch (error) {
                console.error('❌ getSubmissionWithAuth - content解析失败:', error);
                parsedContent = {};
              }
            } else {
              parsedContent = lessonData.content;
            }
          }

          // 构造问答配置
          const questionnaire = lessonData ? {
            id: lessonData.id,
            lesson_id: lessonData.id,
            title: parsedContent?.title || '',
            description: parsedContent?.description || '',
            instructions: parsedContent?.instructions || '',
            ai_grading_prompt: parsedContent?.ai_grading_prompt || '',
            ai_grading_criteria: parsedContent?.ai_grading_criteria || '',
            max_score: parsedContent?.max_score || 100,
            time_limit_minutes: parsedContent?.time_limit_minutes,
            allow_save_draft: parsedContent?.allow_save_draft !== false,
            skill_tags: parsedContent?.skill_tags || [],
            questions: parsedContent?.questions || [] // 添加问题列表
          } : null;

          console.log('📋 getSubmissionWithAuth - 最终questionnaire配置:', {
            hasQuestionnaire: !!questionnaire,
            hasAIPrompt: !!questionnaire?.ai_grading_prompt,
            hasAICriteria: !!questionnaire?.ai_grading_criteria,
            aiPrompt: questionnaire?.ai_grading_prompt?.substring(0, 50) + '...',
            aiCriteria: questionnaire?.ai_grading_criteria?.substring(0, 50) + '...'
          });

          return {
            submission,
            questionnaire,
            courseAuthorId
          };
        }
      }
    }

    console.error('无法获取课程作者信息，submission:', submission);
    throw new Error('无法获取课程作者信息');
  }
}