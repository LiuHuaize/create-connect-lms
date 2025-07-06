import { supabase } from '../lib/supabase';
import { achievementService } from './achievementService';

// 经验值获取规则配置
export const EXPERIENCE_RULES = {
  // 基础课时完成经验值
  LESSON_COMPLETE: {
    text: 20,      // 文本课时
    video: 30,     // 视频课时
    quiz: 40,      // 测验课时
    assignment: 50, // 作业课时
    hotspot: 35,   // 热点课时
    card_creator: 45, // 卡片创建课时
    series_questionnaire: 55, // 系列问答课时，给予最高经验值
  },
  
  // 测验分数奖励（基于分数百分比的额外经验）
  QUIZ_SCORE_BONUS: {
    perfect: 20,   // 100分额外奖励
    excellent: 15, // 90-99分额外奖励
    good: 10,      // 80-89分额外奖励
    pass: 5,       // 60-79分额外奖励
  },
  
  // 课程完成奖励
  COURSE_COMPLETE: 100,
  
  // 连续学习奖励
  DAILY_STREAK: 10,
  
  // 等级计算（每级所需经验值）
  LEVEL_EXPERIENCE: 100, // 每级需要100经验值
} as const;

// 活动类型定义
export type ActivityType =
  | 'lesson_complete'
  | 'quiz_pass'
  | 'course_complete'
  | 'daily_streak'
  | 'series_questionnaire_complete'
  | 'series_questionnaire_graded'
  | 'achievement_unlock'
  | 'level_up';

// 课时类型定义
export type LessonType = keyof typeof EXPERIENCE_RULES.LESSON_COMPLETE;

// 时间线活动接口
export interface TimelineActivity {
  activity_type: ActivityType;
  activity_title: string;
  activity_description?: string;
  course_id?: string;
  lesson_id?: string;
  experience_gained: number;
}

// 用户游戏档案接口
export interface UserGameProfile {
  id: string;
  username: string;
  avatar_url?: string;
  total_level: number;
  total_experience: number;
  title: string;
  learning_streak: number;
  last_activity_date?: string;
}

// 经验值计算函数
export function calculateLessonExperience(
  lessonType: LessonType, 
  score?: number
): number {
  // 基础经验值
  let baseExp = EXPERIENCE_RULES.LESSON_COMPLETE[lessonType];
  
  // 如果是测验，根据分数给予额外奖励
  if (lessonType === 'quiz' && score !== undefined) {
    if (score >= 100) {
      baseExp += EXPERIENCE_RULES.QUIZ_SCORE_BONUS.perfect;
    } else if (score >= 90) {
      baseExp += EXPERIENCE_RULES.QUIZ_SCORE_BONUS.excellent;
    } else if (score >= 80) {
      baseExp += EXPERIENCE_RULES.QUIZ_SCORE_BONUS.good;
    } else if (score >= 60) {
      baseExp += EXPERIENCE_RULES.QUIZ_SCORE_BONUS.pass;
    }
  }
  
  return baseExp;
}

// 等级计算函数
export function calculateLevel(totalExperience: number): number {
  return Math.floor(totalExperience / EXPERIENCE_RULES.LEVEL_EXPERIENCE) + 1;
}

// 计算到下一级所需经验值
export function calculateExpToNextLevel(totalExperience: number): number {
  const currentLevel = calculateLevel(totalExperience);
  const expForNextLevel = currentLevel * EXPERIENCE_RULES.LEVEL_EXPERIENCE;
  return expForNextLevel - totalExperience;
}

// 技能类型定义
export type SkillType =
  | 'communication'
  | 'collaboration'
  | 'critical_thinking'
  | 'creativity'
  | 'cultural_intelligence'
  | 'complex_problem_solving';

// 用户技能接口
export interface UserSkill {
  id: string;
  user_id: string;
  skill_type: SkillType;
  skill_level: number;
  skill_experience: number;
  last_updated: string;
}

// 技能经验记录接口
export interface SkillExperienceLog {
  id: string;
  user_id: string;
  skill_type: SkillType;
  experience_gained: number;
  source_type: string;
  source_id?: string;
  reason?: string;
  created_at: string;
}

// 技能配置
export const SKILL_CONFIG = {
  communication: { label: '沟通协调', color: '#3B82F6', icon: '💬' },
  collaboration: { label: '团体合作', color: '#10B981', icon: '🤝' },
  critical_thinking: { label: '批判思考', color: '#F59E0B', icon: '🧠' },
  creativity: { label: '创新能力', color: '#EF4444', icon: '💡' },
  cultural_intelligence: { label: '文化智力', color: '#8B5CF6', icon: '🌍' },
  complex_problem_solving: { label: '复杂问题解决', color: '#EC4899', icon: '🧩' }
} as const;

// 技能等级计算（每级需要50经验值）
export const SKILL_LEVEL_EXPERIENCE = 50;

// 计算技能等级
export function calculateSkillLevel(experience: number): number {
  return Math.floor(experience / SKILL_LEVEL_EXPERIENCE) + 1;
}

// 游戏化服务
export const gamificationService = {
  // 获取用户游戏档案
  async getUserProfile(userId: string): Promise<UserGameProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_url,
          total_level,
          total_experience,
          title,
          learning_streak,
          last_activity_date
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('获取用户游戏档案失败:', error);
        return null;
      }

      return data as UserGameProfile;
    } catch (error) {
      console.error('获取用户游戏档案异常:', error);
      return null;
    }
  },

  // 添加经验值并更新用户档案
  async addExperience(
    userId: string, 
    experience: number, 
    activity: TimelineActivity
  ): Promise<boolean> {
    try {
      console.log(`为用户 ${userId} 添加 ${experience} 经验值`);
      
      // 获取当前用户档案
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) {
        console.error('无法获取用户档案');
        return false;
      }

      // 计算新的经验值和等级
      const newTotalExperience = currentProfile.total_experience + experience;
      const newLevel = calculateLevel(newTotalExperience);
      const levelUp = newLevel > currentProfile.total_level;

      // 更新用户档案
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_experience: newTotalExperience,
          total_level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0], // 只保留日期部分
        })
        .eq('id', userId);

      if (profileError) {
        console.error('更新用户档案失败:', profileError);
        return false;
      }

      // 添加时间线记录
      const { error: timelineError } = await supabase
        .from('learning_timeline')
        .insert({
          user_id: userId,
          ...activity,
        });

      if (timelineError) {
        console.error('添加时间线记录失败:', timelineError);
        // 不返回false，因为经验值已经添加成功
      }

      // 如果升级了，记录升级活动
      if (levelUp) {
        console.log(`用户 ${userId} 升级到 ${newLevel} 级！`);
        
        await supabase
          .from('learning_timeline')
          .insert({
            user_id: userId,
            activity_type: 'level_up' as ActivityType,
            activity_title: `升级到 ${newLevel} 级`,
            activity_description: `恭喜！您已升级到 ${newLevel} 级`,
            experience_gained: 0, // 升级本身不给经验值
          });
      }

      console.log(`成功为用户 ${userId} 添加 ${experience} 经验值`);
      return true;
    } catch (error) {
      console.error('添加经验值失败:', error);
      return false;
    }
  },

  // 处理课时完成的经验值奖励
  async handleLessonComplete(
    userId: string,
    lessonId: string,
    courseId: string,
    lessonTitle: string,
    lessonType: LessonType,
    score?: number
  ): Promise<boolean> {
    try {
      // 检查是否已经为此课时给过经验值
      const { data: existingRecord } = await supabase
        .from('learning_timeline')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .eq('activity_type', 'lesson_complete')
        .maybeSingle();

      if (existingRecord) {
        console.log(`课时 ${lessonId} 已经给过经验值，跳过`);
        return true;
      }

      // 计算基础经验值
      const experience = calculateLessonExperience(lessonType, score);

      // 创建活动记录
      const activity: TimelineActivity = {
        activity_type: 'lesson_complete',
        activity_title: `完成课时：${lessonTitle}`,
        activity_description: score !== undefined
          ? `测验得分：${score}分`
          : '课时学习完成',
        course_id: courseId,
        lesson_id: lessonId,
        experience_gained: experience,
      };

      // 添加基础经验值
      const baseExperienceSuccess = await this.addExperience(userId, experience, activity);

      // 处理技能经验分配
      const skillExperienceSuccess = await this.handleSkillExperienceFromLesson(
        userId,
        lessonId,
        lessonTitle,
        lessonType,
        score
      );

      // 检查并解锁成就
      if (baseExperienceSuccess) {
        try {
          const newAchievements = await achievementService.checkAllAchievements(userId);
          if (newAchievements.length > 0) {
            console.log(`用户 ${userId} 解锁了 ${newAchievements.length} 个新成就:`,
              newAchievements.map(a => a.title).join(', '));

            // 为每个解锁的成就添加时间线记录
            for (const achievement of newAchievements) {
              await this.addTimelineActivity(
                userId,
                'achievement_unlock' as ActivityType,
                `解锁成就：${achievement.title}`,
                achievement.description,
                undefined,
                undefined,
                achievement.experience_reward
              );

              // 添加成就奖励经验值
              if (achievement.experience_reward > 0) {
                await this.addExperienceReward(userId, achievement.experience_reward, achievement.title);
              }
            }
          }
        } catch (error) {
          console.error('检查成就失败:', error);
        }
      }

      return baseExperienceSuccess && skillExperienceSuccess;
    } catch (error) {
      console.error('处理课时完成经验值失败:', error);
      return false;
    }
  },

  // 根据课时技能标记分配技能经验
  async handleSkillExperienceFromLesson(
    userId: string,
    lessonId: string,
    lessonTitle: string,
    lessonType: LessonType,
    score?: number
  ): Promise<boolean> {
    try {
      // 获取课时的技能标记
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('skill_tags')
        .eq('id', lessonId)
        .single();

      if (lessonError) {
        console.error('获取课时技能标记失败:', lessonError);
        return false;
      }

      const skillTags = lessonData?.skill_tags || [];

      if (skillTags.length === 0) {
        console.log(`课时 ${lessonId} 没有技能标记，跳过技能经验分配`);
        return true;
      }

      // 计算技能经验值（基于课时类型和分数）
      const skillExperience = this.calculateSkillExperience(lessonType, score);

      // 为每个技能标记分配经验
      const skillPromises = skillTags.map(async (skillType: string) => {
        return await this.addSkillExperience(
          userId,
          skillType as SkillType,
          skillExperience,
          'lesson',
          lessonId,
          `完成课时：${lessonTitle}`
        );
      });

      const results = await Promise.all(skillPromises);
      const allSuccess = results.every(result => result);

      if (allSuccess) {
        console.log(`成功为课时 ${lessonId} 分配技能经验，涉及技能：${skillTags.join(', ')}`);
      } else {
        console.error(`课时 ${lessonId} 部分技能经验分配失败`);
      }

      return allSuccess;
    } catch (error) {
      console.error('处理课时技能经验失败:', error);
      return false;
    }
  },

  // 分配技能经验值（通用方法）
  async allocateSkillExperience(
    userId: string,
    skillTags: string[],
    baseExperience: number
  ): Promise<boolean> {
    try {
      console.log(`为用户 ${userId} 分配技能经验，技能标签：${skillTags.join(', ')}，基础经验：${baseExperience}`);

      if (!skillTags || skillTags.length === 0) {
        console.log('没有技能标签，跳过技能经验分配');
        return true;
      }

      // 将技能标签映射到系统技能类型
      const skillTypeMapping: Record<string, SkillType> = {
        'Communication': 'communication',
        'Collaboration': 'collaboration',
        'Critical Thinking': 'critical_thinking',
        'Creativity': 'creativity',
        'Cultural Intelligence': 'cultural_intelligence',
        'Complex Problem Solving': 'complex_problem_solving',
        // 中文映射
        '沟通协调': 'communication',
        '团体合作': 'collaboration',
        '批判思考': 'critical_thinking',
        '创新能力': 'creativity',
        '文化智力': 'cultural_intelligence',
        '复杂问题解决': 'complex_problem_solving'
      };

      // 过滤有效的技能类型
      const validSkillTypes = skillTags
        .map(tag => skillTypeMapping[tag])
        .filter(skillType => skillType !== undefined);

      if (validSkillTypes.length === 0) {
        console.log('没有有效的技能类型，跳过技能经验分配');
        return true;
      }

      // 计算每个技能的经验值（平均分配）
      const experiencePerSkill = Math.floor(baseExperience / validSkillTypes.length);

      // 为每个技能分配经验
      const skillPromises = validSkillTypes.map(async (skillType: SkillType) => {
        return await this.addSkillExperience(
          userId,
          skillType,
          experiencePerSkill,
          'series_questionnaire',
          undefined,
          '系列问答技能经验分配'
        );
      });

      const results = await Promise.all(skillPromises);
      const allSuccess = results.every(result => result);

      if (allSuccess) {
        console.log(`成功为用户 ${userId} 分配技能经验，涉及技能：${validSkillTypes.join(', ')}`);
      } else {
        console.error(`用户 ${userId} 部分技能经验分配失败`);
      }

      return allSuccess;
    } catch (error) {
      console.error('分配技能经验失败:', error);
      return false;
    }
  },

  // 计算技能经验值
  calculateSkillExperience(lessonType: LessonType, score?: number): number {
    // 基础技能经验值（比总经验值稍低）
    const baseSkillExperience = {
      text: 15,
      video: 20,
      quiz: 25,
      assignment: 30,
      hotspot: 25,
      card_creator: 30,
      drag_sort: 25,
      resource: 10,
      frame: 20,
      series_questionnaire: 35 // 系列问答给予较高经验值，因为涉及深度思考和写作
    };

    let experience = baseSkillExperience[lessonType] || 15;

    // 测验类型根据分数给予额外奖励
    if (lessonType === 'quiz' && score !== undefined) {
      if (score >= 90) {
        experience += 10; // 优秀额外奖励
      } else if (score >= 80) {
        experience += 5;  // 良好额外奖励
      }
    }

    // 系列问答类型根据分数给予额外奖励
    if (lessonType === 'series_questionnaire' && score !== undefined) {
      if (score >= 90) {
        experience += 15; // 优秀额外奖励（比测验更高，因为系列问答更复杂）
      } else if (score >= 80) {
        experience += 10; // 良好额外奖励
      } else if (score >= 70) {
        experience += 5;  // 及格额外奖励
      }
    }

    return experience;
  },

  // 添加学习时间线活动
  async addTimelineActivity(
    userId: string,
    activityType: ActivityType,
    activityTitle: string,
    activityDescription?: string,
    courseId?: string,
    lessonId?: string,
    experienceGained: number = 0
  ): Promise<boolean> {
    try {
      console.log(`为用户 ${userId} 添加时间线活动: ${activityTitle}`);

      const { error } = await supabase
        .from('learning_timeline')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_title: activityTitle,
          activity_description: activityDescription,
          course_id: courseId,
          lesson_id: lessonId,
          experience_gained: experienceGained
        });

      if (error) {
        console.error('添加时间线活动失败:', error);
        return false;
      }

      console.log(`成功添加时间线活动: ${activityTitle}`);
      return true;
    } catch (error) {
      console.error('添加时间线活动异常:', error);
      return false;
    }
  },

  // 获取用户学习时间线
  async getUserTimeline(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('learning_timeline')
        .select(`
          *,
          courses:course_id(title),
          lessons:lesson_id(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取用户时间线失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('获取用户时间线异常:', error);
      return [];
    }
  },

  // 获取用户技能数据
  async getUserSkills(userId: string): Promise<UserSkill[]> {
    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('获取用户技能失败:', error);
        return [];
      }

      // 如果用户没有技能记录，初始化所有技能
      if (!data || data.length === 0) {
        return await this.initializeUserSkills(userId);
      }

      return data as UserSkill[];
    } catch (error) {
      console.error('获取用户技能异常:', error);
      return [];
    }
  },

  // 初始化用户技能（为新用户创建所有技能记录）
  async initializeUserSkills(userId: string): Promise<UserSkill[]> {
    try {
      const skillTypes: SkillType[] = [
        'communication',
        'collaboration',
        'critical_thinking',
        'creativity',
        'cultural_intelligence',
        'complex_problem_solving'
      ];

      const skillRecords = skillTypes.map(skillType => ({
        user_id: userId,
        skill_type: skillType,
        skill_level: 1,
        skill_experience: 0
      }));

      const { data, error } = await supabase
        .from('user_skills')
        .insert(skillRecords)
        .select();

      if (error) {
        console.error('初始化用户技能失败:', error);
        return [];
      }

      return data as UserSkill[];
    } catch (error) {
      console.error('初始化用户技能异常:', error);
      return [];
    }
  },

  // 添加技能经验值
  async addSkillExperience(
    userId: string,
    skillType: SkillType,
    experience: number,
    sourceType: string,
    sourceId?: string,
    reason?: string
  ): Promise<boolean> {
    try {
      console.log(`为用户 ${userId} 的 ${skillType} 技能添加 ${experience} 经验值`);

      // 获取当前技能数据
      const { data: currentSkill, error: fetchError } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', userId)
        .eq('skill_type', skillType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('获取技能数据失败:', fetchError);
        return false;
      }

      let newExperience = experience;
      let newLevel = 1;

      if (currentSkill) {
        newExperience = currentSkill.skill_experience + experience;
        newLevel = calculateSkillLevel(newExperience);

        // 更新现有技能记录
        const { error: updateError } = await supabase
          .from('user_skills')
          .update({
            skill_experience: newExperience,
            skill_level: newLevel,
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('skill_type', skillType);

        if (updateError) {
          console.error('更新技能数据失败:', updateError);
          return false;
        }
      } else {
        // 创建新的技能记录
        newLevel = calculateSkillLevel(newExperience);

        const { error: insertError } = await supabase
          .from('user_skills')
          .insert({
            user_id: userId,
            skill_type: skillType,
            skill_experience: newExperience,
            skill_level: newLevel
          });

        if (insertError) {
          console.error('创建技能记录失败:', insertError);
          return false;
        }
      }

      // 记录技能经验日志
      const { error: logError } = await supabase
        .from('skill_experience_logs')
        .insert({
          user_id: userId,
          skill_type: skillType,
          experience_gained: experience,
          source_type: sourceType,
          source_id: sourceId,
          reason: reason
        });

      if (logError) {
        console.error('记录技能经验日志失败:', logError);
        // 不返回false，因为技能经验已经添加成功
      }

      console.log(`成功为用户 ${userId} 的 ${skillType} 技能添加 ${experience} 经验值`);
      return true;
    } catch (error) {
      console.error('添加技能经验值失败:', error);
      return false;
    }
  },

  // 添加成就奖励经验值（不触发成就检查，避免循环）
  async addExperienceReward(userId: string, experience: number, achievementTitle: string): Promise<boolean> {
    try {
      console.log(`为用户 ${userId} 添加成就奖励经验值 ${experience}`);

      // 获取当前用户档案
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) {
        console.error('无法获取用户档案');
        return false;
      }

      // 计算新的经验值和等级
      const newTotalExperience = currentProfile.total_experience + experience;
      const newLevel = calculateLevel(newTotalExperience);
      const levelUp = newLevel > currentProfile.total_level;

      // 更新用户档案
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_experience: newTotalExperience,
          total_level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', userId);

      if (profileError) {
        console.error('更新用户档案失败:', profileError);
        return false;
      }

      // 如果升级了，记录升级活动
      if (levelUp) {
        console.log(`用户 ${userId} 升级到 ${newLevel} 级！`);

        await this.addTimelineActivity(
          userId,
          'level_up' as ActivityType,
          `升级到 ${newLevel} 级`,
          `通过解锁成就"${achievementTitle}"升级`,
          undefined,
          undefined,
          0
        );
      }

      console.log(`成功为用户 ${userId} 添加成就奖励经验值 ${experience}`);
      return true;
    } catch (error) {
      console.error('添加成就奖励经验值失败:', error);
      return false;
    }
  },

  // 处理系列问答完成的游戏化奖励
  async handleSeriesQuestionnaireComplete(
    userId: string,
    questionnaireId: string,
    questionnaireTitle: string,
    skillTags: string[],
    totalWords: number,
    score?: number
  ): Promise<boolean> {
    try {
      console.log(`处理用户 ${userId} 完成系列问答：${questionnaireTitle}`);

      // 检查是否已经为此系列问答给过经验值
      const { data: existingRecord } = await supabase
        .from('learning_timeline')
        .select('id')
        .eq('user_id', userId)
        .eq('activity_type', 'series_questionnaire_complete')
        .eq('activity_description', questionnaireId)
        .maybeSingle();

      if (existingRecord) {
        console.log(`系列问答 ${questionnaireId} 已经给过经验值，跳过`);
        return true;
      }

      // 计算基础经验值（系列问答给予55经验值）
      const baseExperience = EXPERIENCE_RULES.LESSON_COMPLETE.series_questionnaire;

      // 根据字数给予额外奖励（每100字额外5经验值，最多额外20经验值）
      const wordBonus = Math.min(Math.floor(totalWords / 100) * 5, 20);
      const totalExperience = baseExperience + wordBonus;

      // 创建活动记录
      const activity: TimelineActivity = {
        activity_type: 'series_questionnaire_complete',
        activity_title: `完成系列问答：${questionnaireTitle}`,
        activity_description: questionnaireId, // 存储问卷ID用于去重检查
        experience_gained: totalExperience,
      };

      // 添加基础经验值
      const baseExperienceSuccess = await this.addExperience(userId, totalExperience, activity);

      // 分配技能经验
      let skillExperienceSuccess = true;
      if (skillTags && skillTags.length > 0) {
        // 技能经验基于字数计算（每10字1经验值）
        const skillExperience = Math.floor(totalWords / 10);
        skillExperienceSuccess = await this.allocateSkillExperience(
          userId,
          skillTags,
          skillExperience
        );
      }

      // 检查并解锁成就
      if (baseExperienceSuccess) {
        try {
          const newAchievements = await achievementService.checkAllAchievements(userId);
          if (newAchievements.length > 0) {
            console.log(`用户 ${userId} 解锁了 ${newAchievements.length} 个新成就:`,
              newAchievements.map(a => a.title).join(', '));

            // 为每个解锁的成就添加时间线记录和经验奖励
            for (const achievement of newAchievements) {
              await this.addTimelineActivity(
                userId,
                'achievement_unlock',
                `解锁成就：${achievement.title}`,
                achievement.description,
                undefined,
                undefined,
                achievement.experience_reward
              );

              // 添加成就奖励经验值
              if (achievement.experience_reward > 0) {
                await this.addExperienceReward(userId, achievement.experience_reward, achievement.title);
              }
            }
          }
        } catch (error) {
          console.error('检查成就失败:', error);
        }
      }

      const success = baseExperienceSuccess && skillExperienceSuccess;
      if (success) {
        console.log(`成功处理用户 ${userId} 系列问答完成奖励`);
      } else {
        console.error(`用户 ${userId} 系列问答完成奖励处理部分失败`);
      }

      return success;
    } catch (error) {
      console.error('处理系列问答完成奖励失败:', error);
      return false;
    }
  },

  // 处理系列问答评分完成的游戏化奖励
  async handleSeriesQuestionnaireGraded(
    userId: string,
    questionnaireId: string,
    questionnaireTitle: string,
    finalScore: number,
    maxScore: number = 100
  ): Promise<boolean> {
    try {
      console.log(`处理用户 ${userId} 系列问答评分完成：${questionnaireTitle}，得分：${finalScore}/${maxScore}`);

      // 检查是否已经为此评分给过经验值
      const { data: existingRecord } = await supabase
        .from('learning_timeline')
        .select('id')
        .eq('user_id', userId)
        .eq('activity_type', 'series_questionnaire_graded')
        .eq('activity_description', questionnaireId)
        .maybeSingle();

      if (existingRecord) {
        console.log(`系列问答评分 ${questionnaireId} 已经给过经验值，跳过`);
        return true;
      }

      // 计算分数百分比
      const scorePercentage = (finalScore / maxScore) * 100;

      // 根据分数给予额外经验奖励
      let scoreBonus = 0;
      if (scorePercentage >= 95) {
        scoreBonus = 25; // 优秀奖励
      } else if (scorePercentage >= 85) {
        scoreBonus = 15; // 良好奖励
      } else if (scorePercentage >= 70) {
        scoreBonus = 10; // 及格奖励
      }

      if (scoreBonus > 0) {
        // 创建活动记录
        const activity: TimelineActivity = {
          activity_type: 'series_questionnaire_graded',
          activity_title: `系列问答评分完成：${questionnaireTitle}`,
          activity_description: questionnaireId, // 存储问卷ID用于去重检查
          experience_gained: scoreBonus,
        };

        // 添加分数奖励经验值
        const success = await this.addExperience(userId, scoreBonus, activity);

        if (success) {
          console.log(`成功为用户 ${userId} 添加系列问答评分奖励 ${scoreBonus} 经验值`);
        }

        return success;
      } else {
        console.log(`用户 ${userId} 系列问答分数 ${scorePercentage}% 未达到奖励标准`);
        return true;
      }
    } catch (error) {
      console.error('处理系列问答评分奖励失败:', error);
      return false;
    }
  }
};
