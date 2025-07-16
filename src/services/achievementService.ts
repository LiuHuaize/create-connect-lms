import { supabase } from '../lib/supabase';

// 成就接口定义
export interface Achievement {
  id: string;
  achievement_key: string;
  title: string;
  description: string;
  icon_url?: string;
  achievement_type: 'learning' | 'skill' | 'social' | 'special';
  requirement_type: 'count' | 'streak' | 'score' | 'time';
  requirement_value: number;
  experience_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress_data: Record<string, any>;
  achievement?: Achievement;
}

// 系列问答评分接口
export interface SeriesAiGrading {
  ai_score: number;
  final_score: number;
  graded_at: string;
}

// 系列问答提交接口
export interface SeriesSubmission {
  id: string;
  student_id: string;
  status: string;
  total_words: number;
  series_ai_gradings?: SeriesAiGrading;
}

// 作业提交接口
export interface AssignmentSubmission {
  id: string;
  student_id: string;
  status: string;
  content: string;
  teacher_grading?: {
    score: number;
    feedback?: string;
  };
}

// 成就检查结果
export interface AchievementCheckResult {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// 成就服务
export const achievementService = {
  // 获取所有活跃的成就
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('achievement_type', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (error) {
        console.error('获取成就列表失败:', error);
        return [];
      }

      return data as Achievement[];
    } catch (error) {
      console.error('获取成就列表异常:', error);
      return [];
    }
  },

  // 获取用户已解锁的成就
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('获取用户成就失败:', error);
        return [];
      }

      return data as UserAchievement[];
    } catch (error) {
      console.error('获取用户成就异常:', error);
      return [];
    }
  },

  // 检查用户是否已解锁特定成就
  async hasUserUnlockedAchievement(userId: string, achievementKey: string): Promise<boolean> {
    try {
      // 首先获取成就ID
      const { data: achievement, error: achievementError } = await supabase
        .from('achievements')
        .select('id')
        .eq('achievement_key', achievementKey)
        .eq('is_active', true)
        .maybeSingle();

      if (achievementError) {
        console.error('获取成就信息失败:', achievementError);
        return false;
      }

      if (!achievement) {
        console.warn(`成就 ${achievementKey} 不存在或未激活`);
        return false;
      }

      // 检查用户是否已解锁该成就
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (error) {
        console.error('检查用户成就失败:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('检查用户成就异常:', error);
      return false;
    }
  },

  // 解锁成就
  async unlockAchievement(userId: string, achievementId: string, progressData: Record<string, any> = {}): Promise<boolean> {
    try {
      // 检查是否已经解锁
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

      if (existing) {
        console.log('用户已经解锁了这个成就');
        return true;
      }

      // 插入新的成就记录
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: achievementId,
          progress_data: progressData,
        });

      if (error) {
        console.error('解锁成就失败:', error);
        return false;
      }

      console.log(`成功为用户 ${userId} 解锁成就 ${achievementId}`);
      return true;
    } catch (error) {
      console.error('解锁成就异常:', error);
      return false;
    }
  },

  // 检查并解锁学习类成就
  async checkLearningAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户的学习统计数据
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('id, score')
        .eq('user_id', userId);

      const { data: courseCompletions } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const lessonCount = completions?.length || 0;
      const courseCount = courseCompletions?.length || 0;
      const perfectScores = completions?.filter(c => c.score === 100).length || 0;

      // 检查课时相关成就
      const learningAchievements = [
        { key: 'first_lesson', count: lessonCount, threshold: 1 },
        { key: 'lesson_master_10', count: lessonCount, threshold: 10 },
        { key: 'lesson_master_50', count: lessonCount, threshold: 50 },
        { key: 'first_course', count: courseCount, threshold: 1 },
        { key: 'course_collector', count: courseCount, threshold: 5 },
      ];

      for (const achievement of learningAchievements) {
        if (achievement.count >= achievement.threshold) {
          const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

      // 检查测验高手成就
      if (perfectScores > 0) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'quiz_ace');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

      // 检查系列问答相关成就
      const seriesAchievements = await this.checkSeriesQuestionnaireAchievements(userId);
      unlockedAchievements.push(...seriesAchievements);

      // 检查作业相关成就
      const assignmentAchievements = await this.checkAssignmentAchievements(userId);
      unlockedAchievements.push(...assignmentAchievements);

    } catch (error) {
      console.error('检查学习成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查系列问答相关成就
  async checkSeriesQuestionnaireAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户的系列问答提交数据
      const { data: submissions } = await supabase
        .from('series_submissions')
        .select(`
          id,
          status,
          total_words,
          series_ai_gradings(ai_score, final_score)
        `)
        .eq('student_id', userId)
        .eq('status', 'graded');

      if (!submissions || submissions.length === 0) {
        return unlockedAchievements;
      }

      const submissionCount = submissions.length;
      const totalWords = submissions.reduce((sum, s) => sum + (s.total_words || 0), 0);
      const highScoreCount = submissions.filter(s => {
        const grading = (s as any).series_ai_gradings;
        return grading && grading.final_score >= 85;
      }).length;

      // 检查系列问答相关成就
      const seriesAchievements = [
        { key: 'series_questionnaire_first', count: submissionCount, threshold: 1 },
        { key: 'series_questionnaire_master', count: submissionCount, threshold: 5 },
        { key: 'writing_enthusiast', count: totalWords, threshold: 1000 },
        { key: 'series_high_scorer', count: highScoreCount, threshold: 3 },
      ];

      for (const achievement of seriesAchievements) {
        if (achievement.count >= achievement.threshold) {
          const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

    } catch (error) {
      console.error('检查系列问答成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查作业相关成就
  async checkAssignmentAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户的作业提交数据
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          status,
          teacher_grading,
          submitted_at,
          content
        `)
        .eq('student_id', userId)
        .eq('status', 'submitted');

      if (!submissions || submissions.length === 0) {
        return unlockedAchievements;
      }

      const submissionCount = submissions.length;
      const gradedSubmissions = submissions.filter(s => s.teacher_grading).length;
      const highScoreCount = submissions.filter(s => {
        if (!s.teacher_grading) return false;
        const grading = s.teacher_grading as any;
        return grading.score >= 85;
      }).length;

      // 检查作业相关成就
      const assignmentAchievements = [
        { key: 'assignment_first', count: submissionCount, threshold: 1 },
        { key: 'assignment_dedicated', count: submissionCount, threshold: 5 },
        { key: 'assignment_master', count: submissionCount, threshold: 10 },
      ];

      for (const achievement of assignmentAchievements) {
        if (achievement.count >= achievement.threshold) {
          const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

      // 检查高分作业成就
      if (highScoreCount >= 3) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'assignment_excellence');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

      // 检查反思大师成就
      const reflectionSubmissions = submissions.filter(s => {
        if (!s.content) return false;
        const wordCount = s.content.length;
        return wordCount >= 200;
      });

      if (reflectionSubmissions.length > 0) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'reflection_master');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查作业成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查并解锁技能类成就
  async checkSkillAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户技能数据
      const { data: skills } = await supabase
        .from('user_skills')
        .select('skill_type, skill_level, skill_experience')
        .eq('user_id', userId);

      if (!skills || skills.length === 0) {
        return unlockedAchievements;
      }

      // 检查技能探索者成就（所有6个技能都有经验值）
      const skillTypes = new Set(skills.map(s => s.skill_type));
      if (skillTypes.size >= 6) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'skill_explorer');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

      // 检查各技能的新手成就（包含新增的技能）
      const skillAchievements = [
        { key: 'communication_novice', skillType: 'communication' },
        { key: 'collaboration_novice', skillType: 'collaboration' },
        { key: 'critical_thinking_novice', skillType: 'critical_thinking' },
        { key: 'cultural_intelligence_novice', skillType: 'cultural_intelligence' },
        { key: 'complex_problem_solving_novice', skillType: 'complex_problem_solving' },
      ];

      // 检查高级技能成就
      const advancedSkillAchievements = [
        { key: 'deep_thinker', skillType: 'critical_thinking', level: 3 },
        { key: 'creative_writer', skillType: 'creativity', level: 3 },
        { key: 'communication_expert', skillType: 'communication', level: 4 },
      ];

      for (const achievement of skillAchievements) {
        const skill = skills.find(s => s.skill_type === achievement.skillType);
        if (skill && skill.skill_level >= 2) {
          const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

      // 检查高级技能成就
      for (const achievement of advancedSkillAchievements) {
        const skill = skills.find(s => s.skill_type === achievement.skillType);
        if (skill && skill.skill_level >= achievement.level) {
          const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

      // 检查全能大师成就（所有技能都达到3级）
      const allSkillsLevel3 = skills.filter(s => s.skill_level >= 3).length;
      if (allSkillsLevel3 >= 6) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'all_skills_intermediate');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

      // 检查专精大师成就（任意技能达到5级）
      const maxSkillLevel = Math.max(...skills.map(s => s.skill_level));
      if (maxSkillLevel >= 5) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'skill_master');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查技能成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查并解锁社交类成就
  async checkSocialAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户档案中的连续学习天数
      const { data: profile } = await supabase
        .from('profiles')
        .select('learning_streak')
        .eq('id', userId)
        .single();

      if (profile) {
        const streak = profile.learning_streak || 0;

        // 检查连续学习成就（包含新增的长期成就）
        const streakAchievements = [
          { key: 'streak_starter', threshold: 3 },
          { key: 'streak_champion', threshold: 7 },
          { key: 'learning_marathon', threshold: 14 },
          { key: 'learning_legend', threshold: 30 },
        ];

        for (const achievement of streakAchievements) {
          if (streak >= achievement.threshold) {
            const unlocked = await this.checkAndUnlockByKey(userId, achievement.key);
            if (unlocked) {
              unlockedAchievements.push(unlocked);
            }
          }
        }
      }

      // 检查周末学习者成就
      await this.checkWeekendLearnerAchievement(userId, unlockedAchievements);

      // 检查活跃学习者成就
      await this.checkActiveLearnerAchievement(userId, unlockedAchievements);

    } catch (error) {
      console.error('检查社交成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查并解锁特殊类成就
  async checkSpecialAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 检查时间相关成就（早起鸟和夜猫子）
      await this.checkTimeBasedAchievements(userId, unlockedAchievements);

      // 检查完美主义者成就
      await this.checkPerfectionistAchievement(userId, unlockedAchievements);

      // 检查系列问答特殊成就
      await this.checkSeriesQuestionnaireSpecialAchievements(userId, unlockedAchievements);

    } catch (error) {
      console.error('检查特殊成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查系列问答特殊成就
  async checkSeriesQuestionnaireSpecialAchievements(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 检查多产作家成就（单次写作超过500字）
      const { data: prolificSubmissions } = await supabase
        .from('series_submissions')
        .select('id')
        .eq('student_id', userId)
        .eq('status', 'graded')
        .gte('total_words', 500);

      if (prolificSubmissions && prolificSubmissions.length > 0) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'prolific_writer');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

      // 检查坚持学习者成就（连续3次获得良好评分）
      const { data: recentSubmissions } = await supabase
        .from('series_submissions')
        .select(`
          series_ai_gradings(final_score)
        `)
        .eq('student_id', userId)
        .eq('status', 'graded')
        .order('created_at', { ascending: false })
        .limit(3);

      if (recentSubmissions && recentSubmissions.length >= 3) {
        const allGoodScores = recentSubmissions.every(s => {
          const grading = s.series_ai_gradings as SeriesAiGrading;
          return grading && grading.final_score >= 75;
        });

        if (allGoodScores) {
          const unlocked = await this.checkAndUnlockByKey(userId, 'consistent_learner');
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }

    } catch (error) {
      console.error('检查系列问答特殊成就失败:', error);
    }
  },

  // 检查时间相关成就（使用中国时区）
  async checkTimeBasedAchievements(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 获取中国时区的今天日期
      const chinaDate = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
      const today = chinaDate.toISOString().split('T')[0];
      
      const { data: todayActivities } = await supabase
        .from('timeline_activities')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59.999Z');

      if (todayActivities && todayActivities.length > 0) {
        for (const activity of todayActivities) {
          // 将UTC时间转换为中国时间
          const activityTime = new Date(new Date(activity.created_at).getTime() + 8 * 60 * 60 * 1000);
          const hour = activityTime.getHours();

          // 检查早起鸟成就（中国时间早上8点前）
          if (hour < 8) {
            const unlocked = await this.checkAndUnlockByKey(userId, 'early_bird');
            if (unlocked) {
              unlockedAchievements.push(unlocked);
            }
          }

          // 检查夜猫子成就（中国时间晚上10点后）
          if (hour >= 22) {
            const unlocked = await this.checkAndUnlockByKey(userId, 'night_owl');
            if (unlocked) {
              unlockedAchievements.push(unlocked);
            }
          }
        }
      }
    } catch (error) {
      console.error('检查时间相关成就失败:', error);
    }
  },

  // 检查完美主义者成就
  async checkPerfectionistAchievement(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 获取用户最近的测验成绩
      const { data: recentQuizzes } = await supabase
        .from('lesson_completions')
        .select('score, created_at')
        .eq('user_id', userId)
        .not('score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentQuizzes && recentQuizzes.length >= 5) {
        // 检查最近5次测验是否都在90分以上
        const recentFive = recentQuizzes.slice(0, 5);
        const allAbove90 = recentFive.every(quiz => quiz.score >= 90);

        if (allAbove90) {
          const unlocked = await this.checkAndUnlockByKey(userId, 'perfectionist');
          if (unlocked) {
            unlockedAchievements.push(unlocked);
          }
        }
      }
    } catch (error) {
      console.error('检查完美主义者成就失败:', error);
    }
  },

  // 根据成就key检查并解锁成就
  async checkAndUnlockByKey(userId: string, achievementKey: string): Promise<Achievement | null> {
    try {
      // 获取成就信息
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('achievement_key', achievementKey)
        .eq('is_active', true)
        .single();

      if (!achievement) {
        return null;
      }

      // 检查是否已经解锁
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (existing) {
        return null; // 已经解锁
      }

      // 解锁成就
      const success = await this.unlockAchievement(userId, achievement.id);
      if (success) {
        return achievement as Achievement;
      }

    } catch (error) {
      console.error(`检查成就 ${achievementKey} 失败:`, error);
    }

    return null;
  },

  // 检查周末学习者成就
  async checkWeekendLearnerAchievement(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 获取最近4周的学习活动
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { data: activities } = await supabase
        .from('learning_timeline')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', fourWeeksAgo.toISOString())
        .order('created_at', { ascending: true });

      if (!activities || activities.length === 0) {
        return;
      }

      // 检查连续周末学习
      let consecutiveWeekends = 0;
      const weekendDates = new Set<string>();

      for (const activity of activities) {
        const date = new Date(activity.created_at);
        const dayOfWeek = date.getDay();
        
        // 检查是否为周末（周六=6，周日=0）
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          const weekKey = this.getWeekKey(date);
          weekendDates.add(weekKey);
        }
      }

      // 检查连续周末
      const today = new Date();
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekKey = this.getWeekKey(weekStart);
        
        if (weekendDates.has(weekKey)) {
          consecutiveWeekends++;
        } else {
          break;
        }
      }

      if (consecutiveWeekends >= 4) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'weekend_learner');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查周末学习者成就失败:', error);
    }
  },

  // 检查活跃学习者成就
  async checkActiveLearnerAchievement(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 获取最近7天的学习活动
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: activities } = await supabase
        .from('learning_timeline')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!activities || activities.length === 0) {
        return;
      }

      // 检查是否每天都有学习活动
      const activeDays = new Set<string>();
      for (const activity of activities) {
        const date = new Date(activity.created_at);
        const dayKey = date.toISOString().split('T')[0];
        activeDays.add(dayKey);
      }

      if (activeDays.size >= 7) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'active_learner');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查活跃学习者成就失败:', error);
    }
  },

  // 获取周的标识符
  getWeekKey(date: Date): string {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return startOfWeek.toISOString().split('T')[0];
  },

  // 检查课程探索者成就
  async checkCourseExplorationAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户已完成的课程及其类别
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          courses!inner(category)
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      if (!enrollments || enrollments.length === 0) {
        return unlockedAchievements;
      }

      // 统计不同类别的课程数量
      const categories = new Set(enrollments.map(e => (e as any).courses.category).filter(Boolean));

      if (categories.size >= 3) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'course_explorer');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查课程探索成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查速度学习者成就
  async checkSpeedLearningAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取最近30天的课时完成记录
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .gte('completed_at', thirtyDaysAgo.toISOString());

      if (!completions || completions.length === 0) {
        return unlockedAchievements;
      }

      // 按天统计完成的课时数
      const dailyCompletions = new Map<string, number>();
      for (const completion of completions) {
        const date = new Date(completion.completed_at);
        const dayKey = date.toISOString().split('T')[0];
        dailyCompletions.set(dayKey, (dailyCompletions.get(dayKey) || 0) + 1);
      }

      // 检查是否有任意一天完成了3个或更多课时
      const maxDailyCompletions = Math.max(...dailyCompletions.values());
      if (maxDailyCompletions >= 3) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'speed_learner');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查速度学习成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查进步达人成就
  async checkProgressAchievements(userId: string): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    try {
      // 获取用户最近的测验成绩
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('score, completed_at')
        .eq('user_id', userId)
        .not('score', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (!completions || completions.length < 3) {
        return unlockedAchievements;
      }

      // 检查连续3次测验分数是否递增
      const recentThree = completions.slice(0, 3);
      const isProgressive = recentThree[0].score > recentThree[1].score && 
                           recentThree[1].score > recentThree[2].score;

      if (isProgressive) {
        const unlocked = await this.checkAndUnlockByKey(userId, 'progress_champion');
        if (unlocked) {
          unlockedAchievements.push(unlocked);
        }
      }

    } catch (error) {
      console.error('检查进步成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查所有成就
  async checkAllAchievements(userId: string): Promise<Achievement[]> {
    const allUnlocked: Achievement[] = [];

    try {
      console.log(`开始为用户 ${userId} 检查所有成就...`);

      // 并行检查各类成就
      const [
        learningAchievements, 
        skillAchievements, 
        socialAchievements, 
        specialAchievements,
        courseExplorationAchievements,
        speedLearningAchievements,
        progressAchievements
      ] = await Promise.all([
        this.checkLearningAchievements(userId),
        this.checkSkillAchievements(userId),
        this.checkSocialAchievements(userId),
        this.checkSpecialAchievements(userId),
        this.checkCourseExplorationAchievements(userId),
        this.checkSpeedLearningAchievements(userId),
        this.checkProgressAchievements(userId)
      ]);

      allUnlocked.push(
        ...learningAchievements, 
        ...skillAchievements, 
        ...socialAchievements, 
        ...specialAchievements,
        ...courseExplorationAchievements,
        ...speedLearningAchievements,
        ...progressAchievements
      );

      if (allUnlocked.length > 0) {
        console.log(`为用户 ${userId} 解锁了 ${allUnlocked.length} 个新成就:`,
          allUnlocked.map(a => a.title).join(', '));
      } else {
        console.log(`用户 ${userId} 暂时没有新成就可以解锁`);
      }

    } catch (error) {
      console.error('检查所有成就失败:', error);
    }

    return allUnlocked;
  },

  // 获取成就进度信息
  async getAchievementProgress(userId: string, achievementId: string): Promise<{
    progress: number;
    maxProgress: number;
    isUnlocked: boolean;
  }> {
    try {
      // 检查是否已解锁
      const { data: userAchievement } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

      if (userAchievement) {
        return { progress: 1, maxProgress: 1, isUnlocked: true };
      }

      // 获取成就信息
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (!achievement) {
        return { progress: 0, maxProgress: 1, isUnlocked: false };
      }

      // 根据成就类型计算进度
      const progress = await this.calculateAchievementProgress(userId, achievement);

      return {
        progress: progress.current,
        maxProgress: progress.required,
        isUnlocked: false
      };

    } catch (error) {
      console.error('获取成就进度失败:', error);
      return { progress: 0, maxProgress: 1, isUnlocked: false };
    }
  },

  // 计算成就进度
  async calculateAchievementProgress(userId: string, achievement: any): Promise<{
    current: number;
    required: number;
  }> {
    try {
      switch (achievement.achievement_type) {
        case 'learning':
          return await this.calculateLearningProgress(userId, achievement);
        case 'skill':
          return await this.calculateSkillProgress(userId, achievement);
        case 'social':
          return await this.calculateSocialProgress(userId, achievement);
        case 'special':
          return await this.calculateSpecialProgress(userId, achievement);
        default:
          return { current: 0, required: achievement.requirement_value };
      }
    } catch (error) {
      console.error('计算成就进度失败:', error);
      return { current: 0, required: achievement.requirement_value };
    }
  },

  // 计算学习类成就进度
  async calculateLearningProgress(userId: string, achievement: any): Promise<{
    current: number;
    required: number;
  }> {
    const required = achievement.requirement_value;

    switch (achievement.achievement_key) {
      case 'first_lesson':
      case 'lesson_master_10':
      case 'lesson_master_50': {
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('id')
          .eq('user_id', userId);
        return { current: completions?.length || 0, required };
      }

      case 'first_course':
      case 'course_collector': {
        const { data: courseCompletions } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('user_id', userId)
          .not('completed_at', 'is', null);
        return { current: courseCompletions?.length || 0, required };
      }

      case 'quiz_ace': {
        const { data: perfectScores } = await supabase
          .from('lesson_completions')
          .select('id')
          .eq('user_id', userId)
          .eq('score', 100);
        return { current: perfectScores?.length || 0, required: 1 };
      }

      case 'series_questionnaire_first':
      case 'series_questionnaire_master': {
        const { data: submissions } = await supabase
          .from('series_submissions')
          .select('id')
          .eq('student_id', userId)
          .eq('status', 'graded');
        return { current: submissions?.length || 0, required };
      }

      case 'writing_enthusiast': {
        const { data: submissions } = await supabase
          .from('series_submissions')
          .select('total_words')
          .eq('student_id', userId)
          .eq('status', 'graded');
        const totalWords = submissions?.reduce((sum, s) => sum + (s.total_words || 0), 0) || 0;
        return { current: totalWords, required };
      }

      case 'series_high_scorer': {
        const { data: submissions } = await supabase
          .from('series_submissions')
          .select(`
            series_ai_gradings(final_score)
          `)
          .eq('student_id', userId)
          .eq('status', 'graded');

        const highScoreCount = submissions?.filter(s => {
          const grading = s.series_ai_gradings as SeriesAiGrading;
          return grading && grading.final_score >= 85;
        }).length || 0;
        return { current: highScoreCount, required };
      }

      // 新增的作业相关成就
      case 'assignment_first':
      case 'assignment_dedicated':
      case 'assignment_master': {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('id')
          .eq('student_id', userId)
          .eq('status', 'submitted');
        return { current: submissions?.length || 0, required };
      }

      case 'assignment_excellence': {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('teacher_grading')
          .eq('student_id', userId)
          .eq('status', 'submitted');
        const highScoreCount = submissions?.filter(s => {
          if (!s.teacher_grading) return false;
          const grading = s.teacher_grading as { score: number; feedback?: string };
          return grading.score >= 85;
        }).length || 0;
        return { current: highScoreCount, required };
      }

      case 'course_explorer': {
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            course_id,
            courses!inner(category)
          `)
          .eq('user_id', userId)
          .not('completed_at', 'is', null);
        const categories = new Set(enrollments?.map(e => (e as any).courses.category).filter(Boolean));
        return { current: categories.size, required };
      }

      case 'speed_learner': {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', thirtyDaysAgo.toISOString());
        
        const dailyCompletions = new Map<string, number>();
        for (const completion of completions || []) {
          const date = new Date(completion.completed_at);
          const dayKey = date.toISOString().split('T')[0];
          dailyCompletions.set(dayKey, (dailyCompletions.get(dayKey) || 0) + 1);
        }
        const maxDaily = dailyCompletions.size > 0 ? Math.max(...dailyCompletions.values()) : 0;
        return { current: maxDaily, required };
      }

      default:
        return { current: 0, required };
    }
  },

  // 计算技能类成就进度
  async calculateSkillProgress(userId: string, achievement: any): Promise<{
    current: number;
    required: number;
  }> {
    const required = achievement.requirement_value;

    switch (achievement.achievement_key) {
      case 'skill_explorer': {
        const { data: skills } = await supabase
          .from('user_skills')
          .select('skill_type')
          .eq('user_id', userId)
          .gt('skill_experience', 0);
        const uniqueSkills = new Set(skills?.map(s => s.skill_type) || []);
        return { current: uniqueSkills.size, required };
      }

      case 'communication_novice': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'communication')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'collaboration_novice': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'collaboration')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'critical_thinking_novice': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'critical_thinking')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'deep_thinker': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'critical_thinking')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'creative_writer': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'creativity')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'communication_expert': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'communication')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'cultural_intelligence_novice': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'cultural_intelligence')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'complex_problem_solving_novice': {
        const { data: skill } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .eq('skill_type', 'complex_problem_solving')
          .maybeSingle();
        return { current: skill?.skill_level || 0, required };
      }

      case 'all_skills_intermediate': {
        const { data: skills } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId)
          .gte('skill_level', 3);
        return { current: skills?.length || 0, required };
      }

      case 'skill_master': {
        const { data: skills } = await supabase
          .from('user_skills')
          .select('skill_level')
          .eq('user_id', userId);
        const maxLevel = skills?.length > 0 ? Math.max(...skills.map(s => s.skill_level)) : 0;
        return { current: maxLevel, required };
      }

      default:
        return { current: 0, required };
    }
  },

  // 计算社交类成就进度
  async calculateSocialProgress(userId: string, achievement: any): Promise<{
    current: number;
    required: number;
  }> {
    const required = achievement.requirement_value;

    switch (achievement.achievement_key) {
      case 'streak_starter':
      case 'streak_champion':
      case 'learning_marathon':
      case 'learning_legend': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('learning_streak')
          .eq('id', userId)
          .single();
        return { current: profile?.learning_streak || 0, required };
      }

      case 'weekend_learner': {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        const { data: activities } = await supabase
          .from('learning_timeline')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', fourWeeksAgo.toISOString());
        
        const weekendDates = new Set<string>();
        for (const activity of activities || []) {
          const date = new Date(activity.created_at);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            const weekKey = this.getWeekKey(date);
            weekendDates.add(weekKey);
          }
        }
        
        let consecutiveWeekends = 0;
        const today = new Date();
        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(today);
          weekStart.setDate(weekStart.getDate() - (i * 7));
          const weekKey = this.getWeekKey(weekStart);
          if (weekendDates.has(weekKey)) {
            consecutiveWeekends++;
          } else {
            break;
          }
        }
        return { current: consecutiveWeekends, required };
      }

      case 'active_learner': {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: activities } = await supabase
          .from('learning_timeline')
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        const activeDays = new Set<string>();
        for (const activity of activities || []) {
          const date = new Date(activity.created_at);
          const dayKey = date.toISOString().split('T')[0];
          activeDays.add(dayKey);
        }
        return { current: activeDays.size, required };
      }

      default:
        return { current: 0, required };
    }
  },

  // 计算特殊类成就进度
  async calculateSpecialProgress(userId: string, achievement: any): Promise<{
    current: number;
    required: number;
  }> {
    const required = achievement.requirement_value;

    switch (achievement.achievement_key) {
      case 'early_bird':
      case 'night_owl': {
        // 这些是一次性成就，要么完成要么未完成
        return { current: 0, required: 1 };
      }

      case 'perfectionist': {
        const { data: recentQuizzes } = await supabase
          .from('lesson_completions')
          .select('score')
          .eq('user_id', userId)
          .not('score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!recentQuizzes || recentQuizzes.length < 5) {
          return { current: recentQuizzes?.length || 0, required: 5 };
        }

        const consecutiveGoodScores = recentQuizzes.filter(quiz => quiz.score >= 90).length;
        return { current: consecutiveGoodScores, required };
      }

      case 'prolific_writer': {
        const { data: submissions } = await supabase
          .from('series_submissions')
          .select('total_words')
          .eq('student_id', userId)
          .eq('status', 'graded')
          .gte('total_words', 500);
        return { current: submissions?.length || 0, required: 1 };
      }

      case 'consistent_learner': {
        const { data: submissions } = await supabase
          .from('series_submissions')
          .select(`
            total_words,
            series_ai_gradings(final_score)
          `)
          .eq('student_id', userId)
          .eq('status', 'graded')
          .order('created_at', { ascending: false })
          .limit(3);

        if (!submissions || submissions.length < 3) {
          return { current: submissions?.length || 0, required: 3 };
        }

        // 检查最近3次是否都获得良好评分（75分以上）
        const consecutiveGoodScores = submissions.filter(s => {
          const grading = s.series_ai_gradings as SeriesAiGrading;
          return grading && grading.final_score >= 75;
        }).length;

        return { current: consecutiveGoodScores === 3 ? 1 : 0, required: 1 };
      }

      case 'reflection_master': {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('content')
          .eq('student_id', userId)
          .eq('status', 'submitted');
        
        const longReflections = submissions?.filter(s => {
          return s.content && s.content.length >= 200;
        }).length || 0;
        
        return { current: longReflections > 0 ? 1 : 0, required: 1 };
      }

      case 'progress_champion': {
        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('score, completed_at')
          .eq('user_id', userId)
          .not('score', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(3);

        if (!completions || completions.length < 3) {
          return { current: completions?.length || 0, required: 3 };
        }

        const isProgressive = completions[0].score > completions[1].score && 
                             completions[1].score > completions[2].score;
        return { current: isProgressive ? 1 : 0, required: 1 };
      }

      case 'seasonal_learner': {
        const { data: activities } = await supabase
          .from('learning_timeline')
          .select('created_at')
          .eq('user_id', userId);
        
        const seasons = new Set<string>();
        for (const activity of activities || []) {
          const date = new Date(activity.created_at);
          const month = date.getMonth();
          let season = '';
          if (month >= 2 && month <= 4) season = 'spring';
          else if (month >= 5 && month <= 7) season = 'summer';
          else if (month >= 8 && month <= 10) season = 'autumn';
          else season = 'winter';
          seasons.add(season);
        }
        return { current: seasons.size, required };
      }

      case 'perfect_attendance': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('learning_streak')
          .eq('id', userId)
          .single();
        return { current: profile?.learning_streak || 0, required };
      }

      default:
        return { current: 0, required };
    }
  },
};
