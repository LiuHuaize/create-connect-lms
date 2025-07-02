# 成就系统实现文档

## 概述

成就系统是LMS游戏化功能的重要组成部分，通过设置各种成就来激励学生的学习行为，提升学习动机和参与度。

## 数据库设计

### 成就定义表 (achievements)

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT UNIQUE NOT NULL, -- 成就唯一标识
  title TEXT NOT NULL,                  -- 成就标题
  description TEXT NOT NULL,            -- 成就描述
  icon_url TEXT,                        -- 成就图标URL
  achievement_type TEXT NOT NULL,       -- 成就类型: learning, skill, social, special
  requirement_type TEXT NOT NULL,       -- 要求类型: count, streak, score, time
  requirement_value INTEGER NOT NULL,   -- 要求数值
  experience_reward INTEGER DEFAULT 0,  -- 经验值奖励
  is_active BOOLEAN DEFAULT TRUE,       -- 是否激活
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 用户成就记录表 (user_achievements)

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB DEFAULT '{}',     -- 成就进度相关数据
  UNIQUE(user_id, achievement_id)
);
```

## 基础成就列表

系统预设了15个基础成就，涵盖4个类型：

### 学习类成就 (learning)
1. **初学者** - 完成第一个课时 (+50 EXP)
2. **课时达人** - 完成10个课时 (+100 EXP)
3. **学习专家** - 完成50个课时 (+300 EXP)
4. **课程新手** - 完成第一门课程 (+200 EXP)
5. **课程收集者** - 完成5门课程 (+500 EXP)
6. **测验高手** - 在测验中获得满分 (+150 EXP)

### 技能类成就 (skill)
7. **技能探索者** - 在所有6个技能维度都获得经验值 (+200 EXP)
8. **沟通新手** - 沟通协调技能达到2级 (+100 EXP)
9. **合作新手** - 团体合作技能达到2级 (+100 EXP)
10. **思考新手** - 批判思考技能达到2级 (+100 EXP)

### 社交类成就 (social)
11. **连续学习者** - 连续学习3天 (+100 EXP)
12. **学习冠军** - 连续学习7天 (+300 EXP)

### 特殊成就 (special)
13. **早起鸟** - 在早上8点前完成学习活动 (+50 EXP)
14. **夜猫子** - 在晚上10点后完成学习活动 (+50 EXP)
15. **完美主义者** - 连续5次测验都获得90分以上 (+250 EXP)

## 核心服务

### achievementService

主要功能：
- `getAllAchievements()` - 获取所有活跃成就
- `getUserAchievements(userId)` - 获取用户已解锁成就
- `checkAllAchievements(userId)` - 检查并解锁用户成就
- `unlockAchievement(userId, achievementId)` - 解锁特定成就

### 成就检查逻辑

成就检查分为三个类别：

1. **学习成就检查** - 基于课时完成数、课程完成数、测验分数
2. **技能成就检查** - 基于技能等级和技能类型数量
3. **社交成就检查** - 基于连续学习天数

## 集成到游戏化系统

成就系统已集成到 `gamificationService` 中：

```typescript
// 在课时完成时自动检查成就
await gamificationService.handleLessonComplete(userId, lessonId, courseId, lessonTitle, lessonType, score);

// 自动触发成就检查
const newAchievements = await achievementService.checkAllAchievements(userId);

// 为解锁的成就添加经验值奖励
for (const achievement of newAchievements) {
  await gamificationService.addExperienceReward(userId, achievement.experience_reward, achievement.title);
}
```

## UI组件

### AchievementBadges
- 显示用户已解锁的成就徽章
- 支持悬停显示详细信息
- 可配置显示数量和样式

### AchievementProgress
- 显示用户接近解锁的成就进度
- 实时计算进度百分比
- 按进度排序显示

## 测试

### 测试页面
访问 `/test-achievements` 页面可以：
- 查看所有成就列表
- 查看用户已解锁成就
- 手动触发成就检查
- 模拟课时完成来测试成就解锁

### 验证方法

1. **数据库验证**
```sql
-- 查看成就数据
SELECT * FROM achievements WHERE is_active = true;

-- 查看用户成就
SELECT ua.*, a.title FROM user_achievements ua 
JOIN achievements a ON ua.achievement_id = a.id 
WHERE ua.user_id = 'user_id';
```

2. **功能测试**
- 完成课时后检查是否解锁相应成就
- 验证经验值奖励是否正确添加
- 检查时间线是否记录成就解锁活动

## 扩展建议

1. **成就图标** - 为每个成就添加自定义图标
2. **成就分享** - 允许用户分享解锁的成就
3. **成就统计** - 添加成就解锁统计和排行榜
4. **动态成就** - 基于用户行为动态生成个性化成就
5. **成就通知** - 实时通知用户解锁新成就

## 注意事项

1. **防重复解锁** - 系统自动检查避免重复解锁同一成就
2. **性能优化** - 成就检查在课时完成等关键节点触发，避免频繁检查
3. **数据一致性** - 使用事务确保成就解锁和经验值奖励的一致性
4. **权限控制** - 通过RLS策略确保用户只能查看自己的成就数据
