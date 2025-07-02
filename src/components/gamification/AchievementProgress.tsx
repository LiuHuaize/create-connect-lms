import React, { useState, useEffect } from 'react';
import { achievementService, Achievement } from '../../services/achievementService';
import { supabase } from '../../lib/supabase';

interface AchievementProgressProps {
  userId: string;
  limit?: number;
}

interface AchievementWithProgress extends Achievement {
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

const AchievementProgress: React.FC<AchievementProgressProps> = ({ 
  userId, 
  limit = 5 
}) => {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievementProgress();
  }, [userId]);

  const loadAchievementProgress = async () => {
    try {
      setLoading(true);
      
      // 获取所有成就
      const allAchievements = await achievementService.getAllAchievements();
      
      // 获取用户已解锁的成就
      const userAchievements = await achievementService.getUserAchievements(userId);
      const unlockedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

      // 获取用户统计数据
      const userStats = await getUserStats(userId);

      // 计算每个成就的进度
      const achievementsWithProgress = allAchievements.map(achievement => {
        const isUnlocked = unlockedAchievementIds.has(achievement.id);
        const { progress, maxProgress } = calculateAchievementProgress(achievement, userStats);

        return {
          ...achievement,
          progress,
          maxProgress,
          isUnlocked
        };
      });

      // 过滤出未解锁且有进度的成就，按进度百分比排序
      const filteredAchievements = achievementsWithProgress
        .filter(a => !a.isUnlocked && a.progress > 0)
        .sort((a, b) => (b.progress / b.maxProgress) - (a.progress / a.maxProgress))
        .slice(0, limit);

      setAchievements(filteredAchievements);
    } catch (error) {
      console.error('加载成就进度失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = async (userId: string) => {
    try {
      // 获取课时完成数据
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select('id, score')
        .eq('user_id', userId);

      // 获取课程完成数据
      const { data: courseCompletions } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      // 获取用户档案数据
      const { data: profile } = await supabase
        .from('profiles')
        .select('learning_streak')
        .eq('id', userId)
        .single();

      // 获取技能数据
      const { data: skills } = await supabase
        .from('user_skills')
        .select('skill_type, skill_level')
        .eq('user_id', userId);

      return {
        lessonCount: completions?.length || 0,
        courseCount: courseCompletions?.length || 0,
        perfectScores: completions?.filter(c => c.score === 100).length || 0,
        highScores: completions?.filter(c => c.score >= 90).length || 0,
        learningStreak: profile?.learning_streak || 0,
        skillTypes: new Set(skills?.map(s => s.skill_type) || []),
        skillLevels: skills?.reduce((acc, skill) => {
          acc[skill.skill_type] = skill.skill_level;
          return acc;
        }, {} as Record<string, number>) || {}
      };
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
      return {
        lessonCount: 0,
        courseCount: 0,
        perfectScores: 0,
        highScores: 0,
        learningStreak: 0,
        skillTypes: new Set(),
        skillLevels: {}
      };
    }
  };

  const calculateAchievementProgress = (achievement: Achievement, userStats: any) => {
    let progress = 0;
    let maxProgress = achievement.requirement_value;

    switch (achievement.achievement_key) {
      case 'first_lesson':
      case 'lesson_master_10':
      case 'lesson_master_50':
        progress = userStats.lessonCount;
        break;
      
      case 'first_course':
      case 'course_collector':
        progress = userStats.courseCount;
        break;
      
      case 'quiz_ace':
        progress = userStats.perfectScores > 0 ? 1 : 0;
        maxProgress = 1;
        break;
      
      case 'skill_explorer':
        progress = userStats.skillTypes.size;
        maxProgress = 6;
        break;
      
      case 'communication_novice':
        progress = userStats.skillLevels.communication || 0;
        break;
      
      case 'collaboration_novice':
        progress = userStats.skillLevels.collaboration || 0;
        break;
      
      case 'critical_thinking_novice':
        progress = userStats.skillLevels.critical_thinking || 0;
        break;
      
      case 'streak_starter':
      case 'streak_champion':
        progress = userStats.learningStreak;
        break;
      
      case 'perfectionist':
        progress = userStats.highScores;
        break;
      
      default:
        progress = 0;
    }

    return { progress: Math.min(progress, maxProgress), maxProgress };
  };

  const getProgressPercentage = (progress: number, maxProgress: number) => {
    return Math.round((progress / maxProgress) * 100);
  };

  const getAchievementTypeColor = (type: string) => {
    switch (type) {
      case 'learning':
        return 'bg-blue-500';
      case 'skill':
        return 'bg-purple-500';
      case 'social':
        return 'bg-orange-500';
      case 'special':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">成就进度</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">成就进度</h3>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-gray-500 text-sm">暂无进行中的成就</p>
          <p className="text-gray-400 text-xs mt-1">继续学习来解锁更多成就！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">成就进度</h3>
      
      <div className="space-y-3">
        {achievements.map((achievement) => {
          const percentage = getProgressPercentage(achievement.progress, achievement.maxProgress);
          
          return (
            <div
              key={achievement.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {achievement.description}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {percentage}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {achievement.progress}/{achievement.maxProgress}
                  </div>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getAchievementTypeColor(achievement.achievement_type)}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              {/* 奖励信息 */}
              {achievement.experience_reward > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  奖励: +{achievement.experience_reward} EXP
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementProgress;
