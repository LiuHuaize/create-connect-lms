/**
 * 通知系统类型定义
 */

export type NotificationType = 
  | 'assignment_submitted'
  | 'assignment_graded'
  | 'series_submitted'
  | 'series_graded'
  | 'course_enrollment'
  | 'achievement_unlocked'
  | 'system_announcement';

export type NotificationActionType = 
  | 'view_submission'
  | 'view_grading'
  | 'view_course'
  | 'view_achievement'
  | 'navigate_to';

export type NotificationRelatedEntityType = 
  | 'course'
  | 'lesson'
  | 'submission'
  | 'assignment'
  | 'achievement';

export interface Notification {
  id: string;
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  action_type?: NotificationActionType;
  action_data?: Record<string, any>;
  metadata?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  related_entity_type?: NotificationRelatedEntityType;
  related_entity_id?: string;
  priority: 1 | 2 | 3 | 4 | 5;
  expires_at?: string;
  updated_at: string;
}

export interface CreateNotificationData {
  recipient_id: string;
  sender_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  action_type?: NotificationActionType;
  action_data?: Record<string, any>;
  metadata?: Record<string, any>;
  related_entity_type?: NotificationRelatedEntityType;
  related_entity_id?: string;
  priority?: 1 | 2 | 3 | 4 | 5;
  expires_at?: string;
}

export interface GetNotificationsOptions {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  is_read?: boolean;
  order_by?: 'created_at' | 'priority' | 'updated_at';
  order_direction?: 'asc' | 'desc';
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  last_7_days_count: number;
  priority_counts: {
    [key: number]: number;
  };
}

/**
 * 通知模板数据 - 用于生成通知内容
 */
export interface NotificationTemplateData {
  type: NotificationType;
  title: string;
  message: string;
  action_type?: NotificationActionType;
  action_data?: Record<string, any>;
  metadata?: Record<string, any>;
  priority?: 1 | 2 | 3 | 4 | 5;
  expires_at?: string;
}

/**
 * 系列问答提交通知数据
 */
export interface SeriesSubmissionNotificationData {
  student_name: string;
  course_title: string;
  questionnaire_title: string;
  submission_id: string;
  course_id: string;
  lesson_id: string;
}

/**
 * 系列问答评分通知数据
 */
export interface SeriesGradingNotificationData {
  teacher_name: string;
  course_title: string;
  questionnaire_title: string;
  final_score: number;
  max_score: number;
  submission_id: string;
  course_id: string;
  lesson_id: string;
}

/**
 * 作业提交通知数据
 */
export interface AssignmentSubmissionNotificationData {
  student_name: string;
  course_title: string;
  assignment_title: string;
  submission_id: string;
  course_id: string;
  lesson_id: string;
}

/**
 * 作业评分通知数据
 */
export interface AssignmentGradingNotificationData {
  teacher_name: string;
  course_title: string;
  assignment_title: string;
  final_score?: number;
  submission_id: string;
  course_id: string;
  lesson_id: string;
}

/**
 * 成就解锁通知数据
 */
export interface AchievementUnlockedNotificationData {
  achievement_title: string;
  achievement_description: string;
  achievement_icon_url?: string;
  experience_reward: number;
  achievement_id: string;
}

/**
 * 通知服务错误类型
 */
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

/**
 * 通知服务响应类型
 */
export interface NotificationServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}