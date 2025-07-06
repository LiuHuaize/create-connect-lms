// 系列问答API接口类型定义
import { 
  SeriesQuestionnaire, 
  SeriesQuestion, 
  SeriesSubmission, 
  SeriesAIGrading,
  SeriesQuestionnaireStats,
  SeriesAnswer,
  SeriesSubmissionStatus
} from './course';

// ==================== API请求类型 ====================

// 创建系列问答请求
export interface CreateSeriesQuestionnaireRequest {
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
  questions: CreateSeriesQuestionRequest[];
}

// 创建系列问题请求
export interface CreateSeriesQuestionRequest {
  title: string;
  description?: string;
  question_text: string;
  order_index: number;
  required?: boolean;
  min_words?: number;
  max_words?: number;
  placeholder_text?: string;
}

// 更新系列问答请求
export interface UpdateSeriesQuestionnaireRequest {
  id: string;
  title?: string;
  description?: string;
  instructions?: string;
  ai_grading_prompt?: string;
  ai_grading_criteria?: string;
  max_score?: number;
  time_limit_minutes?: number;
  allow_save_draft?: boolean;
  skill_tags?: string[];
  questions?: UpdateSeriesQuestionRequest[];
}

// 更新系列问题请求
export interface UpdateSeriesQuestionRequest {
  id?: string; // 如果为空则创建新问题
  title?: string;
  description?: string;
  question_text?: string;
  order_index?: number;
  required?: boolean;
  min_words?: number;
  max_words?: number;
  placeholder_text?: string;
  _action?: 'create' | 'update' | 'delete'; // 操作类型
}

// 学生提交答案请求
export interface SubmitSeriesAnswersRequest {
  questionnaire_id: string;
  answers: SeriesAnswer[];
  status: SeriesSubmissionStatus;
  time_spent_minutes?: number;
}

// 保存草稿请求
export interface SaveSeriesDraftRequest {
  questionnaire_id: string;
  answers: SeriesAnswer[];
  time_spent_minutes?: number;
}

// AI评分请求
export interface AIGradeSeriesRequest {
  submission_id: string;
  force_regrade?: boolean; // 是否强制重新评分
}

// 教师评分请求
export interface TeacherGradeSeriesRequest {
  submission_id: string;
  teacher_score: number;
  teacher_feedback: string;
}

// ==================== API响应类型 ====================

// 基础API响应
export interface BaseAPIResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// 创建系列问答响应
export interface CreateSeriesQuestionnaireResponse extends BaseAPIResponse {
  data?: SeriesQuestionnaire;
}

// 获取系列问答详情响应
export interface GetSeriesQuestionnaireResponse extends BaseAPIResponse {
  data?: SeriesQuestionnaire & {
    questions: SeriesQuestion[];
    stats?: SeriesQuestionnaireStats;
  };
}

// 获取系列问答列表响应
export interface GetSeriesQuestionnairesResponse extends BaseAPIResponse {
  data?: SeriesQuestionnaire[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 提交答案响应
export interface SubmitSeriesAnswersResponse extends BaseAPIResponse {
  data?: {
    submission: SeriesSubmission;
    redirect_to_grading?: boolean;
  };
}

// AI评分响应
export interface AIGradeSeriesResponse extends BaseAPIResponse {
  data?: SeriesAIGrading;
}

// 获取学生提交状态响应
export interface GetStudentSubmissionStatusResponse extends BaseAPIResponse {
  data?: {
    submission?: SeriesSubmission;
    has_submission: boolean;
    can_submit: boolean;
    time_remaining?: number; // 剩余时间（分钟）
  };
}

// 获取提交列表响应（教师用）
export interface GetSubmissionsResponse extends BaseAPIResponse {
  data?: SeriesSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== API查询参数类型 ====================

// 获取系列问答列表查询参数
export interface GetSeriesQuestionnairesParams {
  lesson_id?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}

// 获取提交列表查询参数
export interface GetSubmissionsParams {
  questionnaire_id: string;
  page?: number;
  limit?: number;
  status?: SeriesSubmissionStatus;
  student_id?: string;
  sort_by?: 'submitted_at' | 'score' | 'word_count';
  sort_order?: 'asc' | 'desc';
}

// ==================== 前端状态类型 ====================

// 系列问答编辑器状态
export interface SeriesQuestionnaireEditorState {
  questionnaire: Partial<SeriesQuestionnaire>;
  questions: Partial<SeriesQuestion>[];
  isLoading: boolean;
  isSaving: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
}

// 学生答题状态
export interface SeriesQuestionnaireStudentState {
  questionnaire?: SeriesQuestionnaire;
  questions: SeriesQuestion[];
  answers: Record<string, string>; // question_id -> answer_text
  currentQuestionIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  timeSpent: number; // 已花费时间（秒）
  wordCounts: Record<string, number>; // question_id -> word_count
  errors: Record<string, string>;
  submission?: SeriesSubmission;
}

// 评分结果显示状态
export interface SeriesGradingResultState {
  submission?: SeriesSubmission;
  grading?: SeriesAIGrading;
  isLoading: boolean;
  showDetailedFeedback: boolean;
}
