import React, { useState, useEffect } from 'react';
import { achievementService, UserAchievement } from '../../services/achievementService';

interface AchievementBadgesProps {
  userId: string;
  limit?: number;
  showTitle?: boolean;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ 
  userId, 
  limit = 6, 
  showTitle = true 
}) => {
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAchievements();
  }, [userId]);

  const loadUserAchievements = async () => {
    try {
      setLoading(true);
      const achievements = await achievementService.getUserAchievements(userId);
      setUserAchievements(achievements.slice(0, limit));
    } catch (error) {
      console.error('加载用户成就失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementTypeColor = (type: string) => {
    switch (type) {
      case 'learning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'skill':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'social':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'special':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'learning':
        return '📚';
      case 'skill':
        return '⚡';
      case 'social':
        return '🤝';
      case 'special':
        return '⭐';
      default:
        return '🏆';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900">成就徽章</h3>
        )}
        <div className="flex space-x-2">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (userAchievements.length === 0) {
    return (
      <div className="space-y-3">
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900">成就徽章</h3>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-gray-500 text-sm">暂无成就</p>
          <p className="text-gray-400 text-xs mt-1">完成学习活动来解锁成就吧！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">成就徽章</h3>
          <span className="text-sm text-gray-500">
            {userAchievements.length} 个成就
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {userAchievements.map((userAchievement) => {
          const achievement = userAchievement.achievement;
          if (!achievement) return null;

          return (
            <div
              key={userAchievement.id}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 cursor-pointer
                ${getAchievementTypeColor(achievement.achievement_type)}
              `}
              title={`${achievement.title}: ${achievement.description}`}
            >
              {/* 成就图标 */}
              <div className="text-center">
                <div className="text-2xl mb-1">
                  {achievement.icon_url ? (
                    <img 
                      src={achievement.icon_url} 
                      alt={achievement.title}
                      className="w-8 h-8 mx-auto"
                    />
                  ) : (
                    getAchievementIcon(achievement.achievement_type)
                  )}
                </div>
                
                {/* 成就标题 */}
                <div className="text-xs font-medium truncate">
                  {achievement.title}
                </div>
                
                {/* 经验值奖励 */}
                {achievement.experience_reward > 0 && (
                  <div className="text-xs opacity-75 mt-1">
                    +{achievement.experience_reward} EXP
                  </div>
                )}
              </div>

              {/* 解锁时间（悬停显示） */}
              <div className="absolute inset-0 bg-black bg-opacity-75 text-white text-xs p-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center">
                <div className="font-medium text-center mb-1">
                  {achievement.title}
                </div>
                <div className="text-center text-xs opacity-90 mb-2">
                  {achievement.description}
                </div>
                <div className="text-xs opacity-75">
                  {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 查看更多链接 */}
      {userAchievements.length >= limit && (
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            查看所有成就 →
          </button>
        </div>
      )}
    </div>
  );
};

export default AchievementBadges;
