import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { achievementService, Achievement, UserAchievement } from '../services/achievementService';
import { gamificationService } from '../services/gamificationService';

interface AchievementWithProgress extends Achievement {
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

const TestAchievements: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [achievementsWithProgress, setAchievementsWithProgress] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [allAchievements, userAchievementsList] = await Promise.all([
        achievementService.getAllAchievements(),
        achievementService.getUserAchievements(user.id)
      ]);

      setAchievements(allAchievements);
      setUserAchievements(userAchievementsList);

      // 计算成就进度
      const unlockedAchievementIds = new Set(userAchievementsList.map(ua => ua.achievement_id));
      const achievementsWithProgressData = await Promise.all(
        allAchievements.map(async (achievement) => {
          const isUnlocked = unlockedAchievementIds.has(achievement.id);
          if (isUnlocked) {
            return {
              ...achievement,
              progress: 1,
              maxProgress: 1,
              isUnlocked: true
            };
          } else {
            const progressData = await achievementService.getAchievementProgress(user.id, achievement.id);
            return {
              ...achievement,
              progress: progressData.progress,
              maxProgress: progressData.maxProgress,
              isUnlocked: false
            };
          }
        })
      );

      setAchievementsWithProgress(achievementsWithProgressData);
    } catch (error) {
      console.error('加载数据失败:', error);
      setMessage('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const testCheckAchievements = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('正在检查成就...');

    try {
      const newAchievements = await achievementService.checkAllAchievements(user.id);
      
      if (newAchievements.length > 0) {
        setMessage(`恭喜！解锁了 ${newAchievements.length} 个新成就: ${newAchievements.map(a => a.title).join(', ')}`);
        
        // 为每个解锁的成就添加经验值奖励
        for (const achievement of newAchievements) {
          if (achievement.experience_reward > 0) {
            await gamificationService.addExperienceReward(user.id, achievement.experience_reward, achievement.title);
          }
        }
      } else {
        setMessage('暂时没有新成就可以解锁');
      }

      // 重新加载数据
      await loadData();
    } catch (error) {
      console.error('检查成就失败:', error);
      setMessage('检查成就失败');
    } finally {
      setLoading(false);
    }
  };

  const simulateLessonCompletion = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('模拟课时完成...');

    try {
      // 模拟完成一个课时
      const success = await gamificationService.handleLessonComplete(
        user.id,
        'test-lesson-' + Date.now(),
        'test-course-' + Date.now(),
        '测试课时',
        'text'
      );

      if (success) {
        setMessage('模拟课时完成成功！');
        await loadData();
      } else {
        setMessage('模拟课时完成失败');
      }
    } catch (error) {
      console.error('模拟课时完成失败:', error);
      setMessage('模拟课时完成失败');
    } finally {
      setLoading(false);
    }
  };

  const simulateQuizCompletion = async (score: number) => {
    if (!user) return;

    setLoading(true);
    setMessage(`模拟测验完成（${score}分）...`);

    try {
      // 模拟完成一个测验
      const success = await gamificationService.handleLessonComplete(
        user.id,
        'test-quiz-' + Date.now(),
        'test-course-' + Date.now(),
        '测试测验',
        'quiz',
        score
      );

      if (success) {
        setMessage(`模拟测验完成成功！获得${score}分`);
        await loadData();
      } else {
        setMessage('模拟测验完成失败');
      }
    } catch (error) {
      console.error('模拟测验完成失败:', error);
      setMessage('模拟测验完成失败');
    } finally {
      setLoading(false);
    }
  };

  const simulateSkillGain = async () => {
    if (!user) return;

    setLoading(true);
    setMessage('模拟技能提升...');

    try {
      // 模拟技能提升
      const success = await gamificationService.addSkillExperience(
        user.id,
        'communication',
        50,
        '测试技能提升'
      );

      if (success) {
        setMessage('模拟技能提升成功！');
        await loadData();
      } else {
        setMessage('模拟技能提升失败');
      }
    } catch (error) {
      console.error('模拟技能提升失败:', error);
      setMessage('模拟技能提升失败');
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">需要登录才能测试成就系统</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">成就系统测试</h1>
            <p className="mt-1 text-sm text-gray-600">测试成就系统的功能</p>
          </div>

          <div className="p-6">
            {/* 操作按钮 */}
            <div className="mb-6 space-y-4">
              {/* 主要操作 */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={testCheckAchievements}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? '检查中...' : '检查成就'}
                </button>

                <button
                  onClick={loadData}
                  disabled={loading}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  刷新数据
                </button>
              </div>

              {/* 模拟操作 */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">模拟操作</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={simulateLessonCompletion}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    模拟课时完成
                  </button>

                  <button
                    onClick={() => simulateQuizCompletion(100)}
                    disabled={loading}
                    className="bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    模拟满分测验
                  </button>

                  <button
                    onClick={() => simulateQuizCompletion(95)}
                    disabled={loading}
                    className="bg-orange-600 text-white px-3 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm"
                  >
                    模拟高分测验
                  </button>

                  <button
                    onClick={simulateSkillGain}
                    disabled={loading}
                    className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
                  >
                    模拟技能提升
                  </button>
                </div>
              </div>
            </div>

            {/* 消息显示 */}
            {message && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-blue-800">{message}</p>
              </div>
            )}

            {/* 用户已解锁成就 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                已解锁成就 ({userAchievements.length})
              </h2>
              {userAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userAchievements.map((userAchievement) => (
                    <div
                      key={userAchievement.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <h3 className="font-semibold text-green-800">
                        {userAchievement.achievement?.title}
                      </h3>
                      <p className="text-sm text-green-600 mt-1">
                        {userAchievement.achievement?.description}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-xs text-green-500">
                          +{userAchievement.achievement?.experience_reward} EXP
                        </span>
                        <span className="text-xs text-green-500">
                          {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">暂无已解锁成就</p>
              )}
            </div>

            {/* 成就进度 */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                成就进度 ({achievementsWithProgress.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievementsWithProgress.map((achievement) => {
                  const progressPercentage = achievement.maxProgress > 0
                    ? Math.round((achievement.progress / achievement.maxProgress) * 100)
                    : 0;

                  return (
                    <div
                      key={achievement.id}
                      className={`border rounded-lg p-4 ${
                        achievement.isUnlocked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold text-sm ${
                          achievement.isUnlocked ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {achievement.title}
                        </h3>
                        {achievement.isUnlocked && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>

                      <p className={`text-xs mt-1 mb-3 ${
                        achievement.isUnlocked ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {achievement.description}
                      </p>

                      {/* 进度条 */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">
                            {achievement.progress}/{achievement.maxProgress}
                          </span>
                          <span className="text-gray-600">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              achievement.isUnlocked ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          achievement.achievement_type === 'learning' ? 'bg-blue-100 text-blue-800' :
                          achievement.achievement_type === 'skill' ? 'bg-purple-100 text-purple-800' :
                          achievement.achievement_type === 'social' ? 'bg-orange-100 text-orange-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {achievement.achievement_type}
                        </span>
                        <span className={`text-xs ${
                          achievement.isUnlocked ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          +{achievement.experience_reward} EXP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 所有成就列表 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                所有成就 ({achievements.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => {
                  const unlocked = isUnlocked(achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`border rounded-lg p-4 ${
                        unlocked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h3 className={`font-semibold ${
                          unlocked ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {achievement.title}
                        </h3>
                        {unlocked && (
                          <span className="text-green-600 text-sm">✓</span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${
                        unlocked ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {achievement.description}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className={`text-xs px-2 py-1 rounded ${
                          achievement.achievement_type === 'learning' ? 'bg-blue-100 text-blue-800' :
                          achievement.achievement_type === 'skill' ? 'bg-purple-100 text-purple-800' :
                          achievement.achievement_type === 'social' ? 'bg-orange-100 text-orange-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {achievement.achievement_type}
                        </span>
                        <span className={`text-xs ${
                          unlocked ? 'text-green-500' : 'text-gray-500'
                        }`}>
                          +{achievement.experience_reward} EXP
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAchievements;
