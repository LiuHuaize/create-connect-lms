# 游戏化系统使用示例

## 概述

本文档提供了系列问答游戏化系统集成的使用示例，展示如何在实际应用中使用这些功能。

## 基本使用示例

### 1. 创建带技能标签的系列问答

```typescript
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';

// 创建系列问答时指定技能标签
const questionnaire = await seriesQuestionnaireService.createSeriesQuestionnaire({
  title: '项目管理反思问答',
  description: '通过问答形式反思项目管理过程中的经验和教训',
  lesson_id: 'lesson-uuid-123',
  skill_tags: ['Critical Thinking', 'Complex Problem Solving', 'Communication'], // 技能标签
  questions: [
    {
      question: '在项目执行过程中，你遇到了哪些主要挑战？',
      question_type: 'long_text',
      is_required: true
    },
    {
      question: '你是如何解决这些挑战的？请详细描述你的解决方案。',
      question_type: 'long_text', 
      is_required: true
    }
  ],
  max_attempts: 3,
  time_limit_minutes: 60,
  is_ai_grading_enabled: true
});
```

### 2. 学生提交答案（自动触发游戏化奖励）

```typescript
// 学生提交答案
const submission = await seriesQuestionnaireService.submitSeriesAnswers({
  questionnaire_id: questionnaire.id,
  answers: {
    '1': '在项目执行过程中，我遇到的主要挑战包括...',
    '2': '为了解决这些挑战，我采取了以下策略...'
  },
  status: 'submitted' // 正式提交时会自动触发游戏化奖励
});

// 系统会自动：
// 1. 计算总字数
// 2. 分配基础经验值（55经验值）
// 3. 根据字数给予额外奖励
// 4. 分配技能经验到对应技能
// 5. 检查并解锁相关成就
// 6. 记录时间线活动
```

### 3. AI评分完成（自动触发评分奖励）

```typescript
// AI评分完成后会自动触发
// 在 triggerAIGrading 方法中已集成

// 系统会自动：
// 1. 根据AI评分给予额外经验奖励
// 2. 检查高分成就
// 3. 更新时间线活动
```

## 手动调用游戏化功能

### 1. 手动分配技能经验

```typescript
import { gamificationService } from '@/services/gamificationService';

// 为用户分配技能经验
const success = await gamificationService.allocateSkillExperience(
  'user-id-123',
  ['Critical Thinking', '批判思考', 'Communication'], // 支持中英文混合
  100 // 基础经验值
);

if (success) {
  console.log('技能经验分配成功');
}
```

### 2. 手动处理系列问答完成奖励

```typescript
// 处理系列问答完成奖励
const success = await gamificationService.handleSeriesQuestionnaireComplete(
  'user-id-123',
  'questionnaire-id-456',
  '项目管理反思问答',
  ['Critical Thinking', 'Communication'],
  350, // 总字数
  85   // 可选：如果已有分数
);
```

### 3. 手动处理评分奖励

```typescript
// 处理评分完成奖励
const success = await gamificationService.handleSeriesQuestionnaireGraded(
  'user-id-123',
  'questionnaire-id-456', 
  '项目管理反思问答',
  92, // 最终分数
  100 // 满分
);
```

## 成就系统使用

### 1. 检查用户成就

```typescript
import { achievementService } from '@/services/achievementService';

// 检查所有成就
const newAchievements = await achievementService.checkAllAchievements('user-id-123');

// 检查特定类型成就
const learningAchievements = await achievementService.checkLearningAchievements('user-id-123');
const skillAchievements = await achievementService.checkSkillAchievements('user-id-123');
const specialAchievements = await achievementService.checkSpecialAchievements('user-id-123');

// 检查系列问答相关成就
const seriesAchievements = await achievementService.checkSeriesQuestionnaireAchievements('user-id-123');
```

### 2. 获取成就进度

```typescript
// 获取所有成就及进度
const achievementsWithProgress = await achievementService.getUserAchievementsWithProgress('user-id-123');

// 获取特定成就进度
const achievement = await achievementService.getAchievementByKey('series_questionnaire_first');
if (achievement) {
  const progress = await achievementService.getAchievementProgress('user-id-123', achievement.id);
  console.log(`进度: ${progress.progress}/${progress.maxProgress}`);
}
```

## 前端集成示例

### 1. 显示经验值获得提示

```typescript
// 在系列问答提交成功后显示奖励
const handleSubmissionSuccess = async (submission: any) => {
  // 显示基础奖励
  showNotification({
    type: 'success',
    title: '提交成功！',
    message: `获得 ${55 + Math.min(Math.floor(totalWords / 100) * 5, 20)} 经验值`
  });

  // 检查新解锁的成就
  const newAchievements = await achievementService.checkSeriesQuestionnaireAchievements(userId);
  
  if (newAchievements.length > 0) {
    newAchievements.forEach(achievement => {
      showAchievementUnlock(achievement);
    });
  }
};
```

### 2. 显示技能经验分配

```typescript
// 显示技能经验分配结果
const showSkillExperienceGain = (skillTags: string[], experience: number) => {
  const skillExperience = Math.floor(experience / skillTags.length);
  
  skillTags.forEach(tag => {
    showNotification({
      type: 'info',
      title: `${tag} 技能提升`,
      message: `获得 ${skillExperience} 技能经验`
    });
  });
};
```

### 3. 成就解锁动画

```typescript
// 成就解锁提示组件
const AchievementUnlockModal = ({ achievement }: { achievement: Achievement }) => {
  return (
    <div className="achievement-unlock-modal">
      <div className="achievement-badge">
        <img src={`/badges/${achievement.achievement_key}.png`} alt={achievement.title} />
      </div>
      <h3>🎉 成就解锁！</h3>
      <h4>{achievement.title}</h4>
      <p>{achievement.description}</p>
      <p className="experience-reward">+{achievement.experience_reward} 经验值</p>
    </div>
  );
};
```

## 性能优化建议

### 1. 批量处理

```typescript
// 在用户完成多个系列问答时，批量检查成就
const batchCheckAchievements = async (userId: string) => {
  const [learning, skill, special, series] = await Promise.all([
    achievementService.checkLearningAchievements(userId),
    achievementService.checkSkillAchievements(userId), 
    achievementService.checkSpecialAchievements(userId),
    achievementService.checkSeriesQuestionnaireAchievements(userId)
  ]);

  return [...learning, ...skill, ...special, ...series];
};
```

### 2. 缓存管理

```typescript
// 在奖励处理后清除相关缓存
const handleRewardWithCacheClearing = async (userId: string) => {
  await gamificationService.handleSeriesQuestionnaireComplete(/* ... */);
  
  // 清除用户相关缓存
  await gamificationService.clearUserCache(userId);
};
```

## 错误处理

```typescript
// 游戏化功能的错误处理
const safeGamificationCall = async (gamificationFunction: () => Promise<boolean>) => {
  try {
    const result = await gamificationFunction();
    return result;
  } catch (error) {
    console.error('游戏化功能执行失败:', error);
    // 游戏化功能失败不应影响主业务流程
    return false;
  }
};

// 使用示例
const success = await safeGamificationCall(() => 
  gamificationService.handleSeriesQuestionnaireComplete(userId, questionnaireId, title, skillTags, totalWords)
);
```

## 监控和分析

```typescript
// 添加游戏化功能的监控
const trackGamificationEvent = (eventType: string, userId: string, data: any) => {
  // 发送到分析服务
  analytics.track('gamification_event', {
    event_type: eventType,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ...data
  });
};

// 在奖励处理时添加监控
await gamificationService.handleSeriesQuestionnaireComplete(/* ... */);
trackGamificationEvent('series_questionnaire_complete', userId, {
  questionnaire_id: questionnaireId,
  experience_gained: totalExperience,
  skills_affected: skillTags
});
```
