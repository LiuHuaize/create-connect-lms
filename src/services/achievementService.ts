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
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement.achievement_key', achievementKey)
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

    } catch (error) {
      console.error('检查学习成就失败:', error);
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

      // 检查各技能的新手成就
      const skillAchievements = [
        { key: 'communication_novice', skillType: 'communication' },
        { key: 'collaboration_novice', skillType: 'collaboration' },
        { key: 'critical_thinking_novice', skillType: 'critical_thinking' },
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

        // 检查连续学习成就
        const streakAchievements = [
          { key: 'streak_starter', threshold: 3 },
          { key: 'streak_champion', threshold: 7 },
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

    } catch (error) {
      console.error('检查特殊成就失败:', error);
    }

    return unlockedAchievements;
  },

  // 检查时间相关成就
  async checkTimeBasedAchievements(userId: string, unlockedAchievements: Achievement[]): Promise<void> {
    try {
      // 获取今天的学习活动
      const today = new Date().toISOString().split('T')[0];
      const { data: todayActivities } = await supabase
        .from('timeline_activities')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', today)
        .lt('created_at', today + 'T23:59:59.999Z');

      if (todayActivities && todayActivities.length > 0) {
        for (const activity of todayActivities) {
          const activityTime = new Date(activity.created_at);
          const hour = activityTime.getHours();

          // 检查早起鸟成就（早上8点前）
          if (hour < 8) {
            const unlocked = await this.checkAndUnlockByKey(userId, 'early_bird');
            if (unlocked) {
              unlockedAchievements.push(unlocked);
            }
          }

          // 检查夜猫子成就（晚上10点后）
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

  // 检查所有成就
  async checkAllAchievements(userId: string): Promise<Achievement[]> {
    const allUnlocked: Achievement[] = [];

    try {
      console.log(`开始为用户 ${userId} 检查所有成就...`);

      // 并行检查各类成就
      const [learningAchievements, skillAchievements, socialAchievements, specialAchievements] = await Promise.all([
        this.checkLearningAchievements(userId),
        this.checkSkillAchievements(userId),
        this.checkSocialAchievements(userId),
        this.checkSpecialAchievements(userId)
      ]);

      allUnlocked.push(...learningAchievements, ...skillAchievements, ...socialAchievements, ...specialAchievements);

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
      case 'streak_champion': {
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

      default:
        return { current: 0, required };
    }
  },
};
