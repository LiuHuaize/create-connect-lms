import { supabase } from '@/integrations/supabase/client';
import { getCurrentUser } from '@/utils/userSession';
import {
  Notification,
  CreateNotificationData,
  GetNotificationsOptions,
  NotificationStats,
  NotificationTemplateData,
  NotificationError,
  NotificationServiceResponse,
  NotificationType,
  SeriesSubmissionNotificationData,
  SeriesGradingNotificationData,
  AssignmentSubmissionNotificationData,
  AssignmentGradingNotificationData,
  AchievementUnlockedNotificationData
} from '@/types/notification';

/**
 * UUID 验证工具函数
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * 验证并清理 UUID，如果无效则返回 null
 */
const validateUUID = (uuid?: string): string | null => {
  if (!uuid) return null;
  return isValidUUID(uuid) ? uuid : null;
};

/**
 * 通知服务 - 处理系统通知的创建、查询、更新和删除
 */
export const notificationService = {
  /**
   * 创建通知
   */
  async createNotification(data: CreateNotificationData): Promise<NotificationServiceResponse<Notification>> {
    try {
      // 验证必需字段
      if (!data.recipient_id || !data.type || !data.title || !data.message) {
        throw new NotificationError('缺少必需的通知数据', 'MISSING_REQUIRED_FIELDS');
      }

      // 准备插入数据，验证 UUID 字段
      const insertData = {
        recipient_id: validateUUID(data.recipient_id) || data.recipient_id, // recipient_id 必须有效
        sender_id: validateUUID(data.sender_id),
        type: data.type,
        title: data.title,
        message: data.message,
        action_type: data.action_type || null,
        action_data: data.action_data || {},
        metadata: data.metadata || {},
        related_entity_type: data.related_entity_type || null,
        related_entity_id: validateUUID(data.related_entity_id),
        priority: data.priority || 1,
        expires_at: data.expires_at || null,
        is_read: false
      };

      // 验证必需的 UUID 字段
      if (!isValidUUID(insertData.recipient_id)) {
        throw new NotificationError('接收者 ID 必须是有效的 UUID', 'INVALID_RECIPIENT_ID');
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('创建通知失败:', error);
        throw new NotificationError('创建通知失败', 'CREATE_FAILED', error);
      }

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error) {
      console.error('创建通知异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '创建通知时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 获取用户通知列表
   */
  async getNotifications(
    userId: string,
    options: GetNotificationsOptions = {}
  ): Promise<NotificationServiceResponse<Notification[]>> {
    try {
      // 验证用户ID
      if (!userId || !isValidUUID(userId)) {
        return {
          success: true,
          data: []
        };
      }

      // 检查当前用户认证状态
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.id !== userId) {
        return {
          success: true,
          data: []
        };
      }

      const {
        limit = 20,
        offset = 0,
        type,
        is_read,
        order_by = 'created_at',
        order_direction = 'desc'
      } = options;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId);

      // 添加过滤条件
      if (type) {
        query = query.eq('type', type);
      }

      if (is_read !== undefined) {
        query = query.eq('is_read', is_read);
      }

      // 排序
      query = query.order(order_by, { ascending: order_direction === 'asc' });

      // 分页
      if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data: notifications, error } = await query;

      if (error) {
        console.error('获取通知列表失败:', error);
        throw new NotificationError('获取通知列表失败', 'FETCH_FAILED', error);
      }

      return {
        success: true,
        data: notifications as Notification[]
      };
    } catch (error) {
      console.error('获取通知列表异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '获取通知列表时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 获取用户未读通知数量
   */
  async getUnreadCount(userId: string): Promise<NotificationServiceResponse<number>> {
    try {
      // 验证用户ID
      if (!userId || !isValidUUID(userId)) {
        return {
          success: true,
          data: 0
        };
      }

      // 检查当前用户认证状态
      const currentUser = await getCurrentUser();
      if (!currentUser || currentUser.id !== userId) {
        return {
          success: true,
          data: 0
        };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('获取未读通知数量失败:', error);
        throw new NotificationError('获取未读通知数量失败', 'COUNT_FAILED', error);
      }

      return {
        success: true,
        data: count || 0
      };
    } catch (error) {
      console.error('获取未读通知数量异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '获取未读通知数量时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<NotificationServiceResponse<Notification>> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new NotificationError('用户未登录', 'USER_NOT_AUTHENTICATED');
      }

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('recipient_id', currentUser.id) // 确保只能标记自己的通知
        .select()
        .single();

      if (error) {
        console.error('标记通知已读失败:', error);
        throw new NotificationError('标记通知已读失败', 'UPDATE_FAILED', error);
      }

      return {
        success: true,
        data: notification as Notification
      };
    } catch (error) {
      console.error('标记通知已读异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '标记通知已读时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 标记用户所有通知为已读
   */
  async markAllAsRead(userId: string): Promise<NotificationServiceResponse<void>> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new NotificationError('用户未登录', 'USER_NOT_AUTHENTICATED');
      }

      // 确保只能标记自己的通知
      if (currentUser.id !== userId) {
        throw new NotificationError('无权限操作其他用户的通知', 'PERMISSION_DENIED');
      }

      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('标记所有通知已读失败:', error);
        throw new NotificationError('标记所有通知已读失败', 'UPDATE_FAILED', error);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('标记所有通知已读异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '标记所有通知已读时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<NotificationServiceResponse<void>> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new NotificationError('用户未登录', 'USER_NOT_AUTHENTICATED');
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_id', currentUser.id); // 确保只能删除自己的通知

      if (error) {
        console.error('删除通知失败:', error);
        throw new NotificationError('删除通知失败', 'DELETE_FAILED', error);
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('删除通知异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '删除通知时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  },

  /**
   * 获取通知统计信息
   */
  async getNotificationStats(userId: string): Promise<NotificationServiceResponse<NotificationStats>> {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new NotificationError('用户未登录', 'USER_NOT_AUTHENTICATED');
      }

      // 确保只能获取自己的统计信息
      if (currentUser.id !== userId) {
        throw new NotificationError('无权限查看其他用户的通知统计', 'PERMISSION_DENIED');
      }

      // 并行获取各种统计数据
      const [
        totalCountResult,
        unreadCountResult,
        recentCountResult,
        priorityCountsResult
      ] = await Promise.all([
        // 总通知数量
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId),
        
        // 未读通知数量
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('is_read', false),
        
        // 最近7天通知数量
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // 各优先级通知数量
        supabase
          .from('notifications')
          .select('priority')
          .eq('recipient_id', userId)
      ]);

      if (totalCountResult.error) {
        throw new NotificationError('获取总通知数量失败', 'STATS_FAILED', totalCountResult.error);
      }

      if (unreadCountResult.error) {
        throw new NotificationError('获取未读通知数量失败', 'STATS_FAILED', unreadCountResult.error);
      }

      if (recentCountResult.error) {
        throw new NotificationError('获取最近通知数量失败', 'STATS_FAILED', recentCountResult.error);
      }

      if (priorityCountsResult.error) {
        throw new NotificationError('获取优先级统计失败', 'STATS_FAILED', priorityCountsResult.error);
      }

      // 计算优先级统计
      const priorityCounts: { [key: number]: number } = {};
      if (priorityCountsResult.data) {
        priorityCountsResult.data.forEach((notification: any) => {
          const priority = notification.priority || 1;
          priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
        });
      }

      const stats: NotificationStats = {
        total_count: totalCountResult.count || 0,
        unread_count: unreadCountResult.count || 0,
        last_7_days_count: recentCountResult.count || 0,
        priority_counts: priorityCounts
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('获取通知统计异常:', error);
      return {
        success: false,
        error: {
          code: error instanceof NotificationError ? error.code : 'UNKNOWN_ERROR',
          message: error instanceof NotificationError ? error.message : '获取通知统计时发生未知错误',
          details: error instanceof NotificationError ? error.details : error
        }
      };
    }
  }
};

/**
 * 通知模板生成器 - 根据不同类型生成通知内容
 */
export const notificationTemplates = {
  /**
   * 生成系列问答提交通知
   */
  createSeriesSubmissionNotification(data: SeriesSubmissionNotificationData): NotificationTemplateData {
    return {
      type: 'series_submitted',
      title: '新的系列问答提交',
      message: `学生 ${data.student_name} 在课程《${data.course_title}》中提交了系列问答《${data.questionnaire_title}》`,
      action_type: 'view_submission',
      action_data: {
        submission_id: data.submission_id,
        course_id: data.course_id,
        lesson_id: data.lesson_id
      },
      metadata: {
        student_name: data.student_name,
        course_title: data.course_title,
        questionnaire_title: data.questionnaire_title
      },
      priority: 2
    };
  },

  /**
   * 生成系列问答评分通知
   */
  createSeriesGradingNotification(data: SeriesGradingNotificationData): NotificationTemplateData {
    return {
      type: 'series_graded',
      title: '系列问答已评分',
      message: `老师 ${data.teacher_name} 已对您在课程《${data.course_title}》中的系列问答《${data.questionnaire_title}》进行了评分，得分：${data.final_score}/${data.max_score}`,
      action_type: 'view_grading',
      action_data: {
        submission_id: data.submission_id,
        course_id: data.course_id,
        lesson_id: data.lesson_id
      },
      metadata: {
        teacher_name: data.teacher_name,
        course_title: data.course_title,
        questionnaire_title: data.questionnaire_title,
        final_score: data.final_score,
        max_score: data.max_score
      },
      priority: 3
    };
  },

  /**
   * 生成作业提交通知
   */
  createAssignmentSubmissionNotification(data: AssignmentSubmissionNotificationData): NotificationTemplateData {
    return {
      type: 'assignment_submitted',
      title: '新的作业提交',
      message: `学生 ${data.student_name} 在课程《${data.course_title}》中提交了作业《${data.assignment_title}》`,
      action_type: 'view_submission',
      action_data: {
        submission_id: data.submission_id,
        course_id: data.course_id,
        lesson_id: data.lesson_id
      },
      metadata: {
        student_name: data.student_name,
        course_title: data.course_title,
        assignment_title: data.assignment_title
      },
      priority: 2
    };
  },

  /**
   * 生成作业评分通知
   */
  createAssignmentGradingNotification(data: AssignmentGradingNotificationData): NotificationTemplateData {
    return {
      type: 'assignment_graded',
      title: '作业已评分',
      message: `老师 ${data.teacher_name} 已对您在课程《${data.course_title}》中的作业《${data.assignment_title}》进行了${data.final_score ? `评分，得分：${data.final_score}` : '批改'}`,
      action_type: 'view_grading',
      action_data: {
        submission_id: data.submission_id,
        course_id: data.course_id,
        lesson_id: data.lesson_id
      },
      metadata: {
        teacher_name: data.teacher_name,
        course_title: data.course_title,
        assignment_title: data.assignment_title,
        final_score: data.final_score
      },
      priority: 3
    };
  },

  /**
   * 生成成就解锁通知
   */
  createAchievementUnlockedNotification(data: AchievementUnlockedNotificationData): NotificationTemplateData {
    return {
      type: 'achievement_unlocked',
      title: '成就解锁',
      message: `恭喜！您解锁了新成就：${data.achievement_title}。${data.achievement_description}`,
      action_type: 'view_achievement',
      action_data: {
        achievement_id: data.achievement_id
      },
      metadata: {
        achievement_title: data.achievement_title,
        achievement_description: data.achievement_description,
        achievement_icon_url: data.achievement_icon_url,
        experience_reward: data.experience_reward
      },
      priority: 4
    };
  }
};

/**
 * 通知助手函数 - 简化通知创建流程
 */
export const notificationHelpers = {
  /**
   * 创建并发送系列问答提交通知
   */
  async notifySeriesSubmission(
    teacherId: string,
    data: SeriesSubmissionNotificationData
  ): Promise<NotificationServiceResponse<Notification>> {
    const template = notificationTemplates.createSeriesSubmissionNotification(data);
    
    const notificationData: CreateNotificationData = {
      recipient_id: teacherId,
      ...template,
      related_entity_type: 'submission',
      related_entity_id: data.submission_id
    };

    return notificationService.createNotification(notificationData);
  },

  /**
   * 创建并发送系列问答评分通知
   */
  async notifySeriesGrading(
    studentId: string,
    teacherId: string,
    data: SeriesGradingNotificationData
  ): Promise<NotificationServiceResponse<Notification>> {
    const template = notificationTemplates.createSeriesGradingNotification(data);
    
    const notificationData: CreateNotificationData = {
      recipient_id: studentId,
      sender_id: teacherId,
      ...template,
      related_entity_type: 'submission',
      related_entity_id: data.submission_id
    };

    return notificationService.createNotification(notificationData);
  },

  /**
   * 创建并发送作业提交通知
   */
  async notifyAssignmentSubmission(
    teacherId: string,
    data: AssignmentSubmissionNotificationData
  ): Promise<NotificationServiceResponse<Notification>> {
    const template = notificationTemplates.createAssignmentSubmissionNotification(data);
    
    const notificationData: CreateNotificationData = {
      recipient_id: teacherId,
      ...template,
      related_entity_type: 'submission',
      related_entity_id: data.submission_id
    };

    return notificationService.createNotification(notificationData);
  },

  /**
   * 创建并发送作业评分通知
   */
  async notifyAssignmentGrading(
    studentId: string,
    teacherId: string,
    data: AssignmentGradingNotificationData
  ): Promise<NotificationServiceResponse<Notification>> {
    const template = notificationTemplates.createAssignmentGradingNotification(data);
    
    const notificationData: CreateNotificationData = {
      recipient_id: studentId,
      sender_id: teacherId,
      ...template,
      related_entity_type: 'submission',
      related_entity_id: data.submission_id
    };

    return notificationService.createNotification(notificationData);
  },

  /**
   * 创建并发送成就解锁通知
   */
  async notifyAchievementUnlocked(
    userId: string,
    data: AchievementUnlockedNotificationData
  ): Promise<NotificationServiceResponse<Notification>> {
    const template = notificationTemplates.createAchievementUnlockedNotification(data);
    
    const notificationData: CreateNotificationData = {
      recipient_id: userId,
      ...template,
      related_entity_type: 'achievement',
      related_entity_id: data.achievement_id
    };

    return notificationService.createNotification(notificationData);
  }
};