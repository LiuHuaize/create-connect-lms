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
    let query = supabase
      .from('series_submissions')
      .select(`
        *,
        series_ai_gradings(*)
      `)
      .eq('student_id', params.student_id);

    if (params.isLessonType && params.lesson_id) {
      query = query.eq('lesson_id', params.lesson_id).is('questionnaire_id', null);
    } else if (params.questionnaire_id) {
      query = query.eq('questionnaire_id', params.questionnaire_id);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
      throw new Error('获取学生提交失败');
    }

    return data;
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
    let query = supabase
      .from('series_submissions')
      .select(`
        *,
        questionnaire:series_questionnaires(*),
        student_profile:profiles(username, email),
        series_ai_gradings(*)
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

          // 构造问答配置
          const questionnaire = lessonData ? {
            id: lessonData.id,
            lesson_id: lessonData.id,
            title: lessonData.content?.title || '',
            description: lessonData.content?.description || '',
            instructions: lessonData.content?.instructions || '',
            ai_grading_prompt: lessonData.content?.ai_grading_prompt || '',
            ai_grading_criteria: lessonData.content?.ai_grading_criteria || '',
            max_score: lessonData.content?.max_score || 100,
            time_limit_minutes: lessonData.content?.time_limit_minutes,
            allow_save_draft: lessonData.content?.allow_save_draft !== false,
            skill_tags: lessonData.content?.skill_tags || []
          } : null;

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