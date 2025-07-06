# 系列问答游戏化系统集成实现文档

## 概述

本文档描述了系列问答功能与游戏化系统的集成实现，包括经验值规则、技能经验分配、成就系统检查和时间线活动记录。

## 实现的功能

### 1. 经验值规则扩展

#### 1.1 基础经验值配置
- **系列问答完成**: 55经验值（最高基础经验值）
- **字数奖励**: 每100字额外5经验值，最多额外20经验值
- **评分奖励**: 
  - 95分以上: 25经验值
  - 85-94分: 15经验值
  - 70-84分: 10经验值

#### 1.2 技能经验分配
- **基础技能经验**: 35经验值（系列问答类型）
- **字数技能经验**: 每10字1经验值
- **技能类型映射**: 支持中英文技能标签自动映射

### 2. 游戏化服务扩展

#### 2.1 新增方法

```typescript
// 通用技能经验分配方法
async allocateSkillExperience(
  userId: string,
  skillTags: string[],
  baseExperience: number
): Promise<boolean>

// 处理系列问答完成奖励
async handleSeriesQuestionnaireComplete(
  userId: string,
  questionnaireId: string,
  questionnaireTitle: string,
  skillTags: string[],
  totalWords: number,
  score?: number
): Promise<boolean>

// 处理系列问答评分完成奖励
async handleSeriesQuestionnaireGraded(
  userId: string,
  questionnaireId: string,
  questionnaireTitle: string,
  finalScore: number,
  maxScore: number = 100
): Promise<boolean>
```

#### 2.2 活动类型扩展
新增活动类型：
- `series_questionnaire_complete`: 系列问答完成
- `series_questionnaire_graded`: 系列问答评分完成
- `achievement_unlock`: 成就解锁
- `level_up`: 等级提升

### 3. 成就系统集成

#### 3.1 新增成就类型

**学习类成就**:
- 问答新手: 完成第一个系列问答 (+100 EXP)
- 问答达人: 完成5个系列问答 (+300 EXP)
- 写作爱好者: 累计写作1000字 (+200 EXP)
- 高分选手: 获得3次85分以上成绩 (+250 EXP)

**技能类成就**:
- 深度思考者: 批判思考技能达到3级 (+150 EXP)
- 创意写手: 创新能力技能达到3级 (+150 EXP)
- 沟通专家: 沟通协调技能达到4级 (+200 EXP)

**特殊成就**:
- 多产作家: 单次写作超过500字 (+100 EXP)
- 坚持学习者: 连续3次获得良好评分 (+300 EXP)

#### 3.2 成就检查逻辑
```typescript
// 检查系列问答相关成就
async checkSeriesQuestionnaireAchievements(userId: string): Promise<Achievement[]>
```

### 4. 服务集成点

#### 4.1 系列问答提交时
在 `seriesQuestionnaireService.submitSeriesAnswers()` 中：
- 正式提交时调用 `handleSeriesQuestionnaireComplete()`
- 自动分配基础经验值和技能经验
- 检查并解锁相关成就

#### 4.2 AI评分完成时
在 `seriesQuestionnaireService.triggerAIGrading()` 中：
- 评分完成后调用 `handleSeriesQuestionnaireGraded()`
- 根据分数给予额外经验奖励

#### 4.3 教师评分完成时
在 `seriesQuestionnaireService.teacherGradeSeries()` 中：
- 教师评分完成后调用 `handleSeriesQuestionnaireGraded()`
- 使用教师评分作为最终分数

### 5. 数据库优化

#### 5.1 新增索引
```sql
-- 时间线查询优化
CREATE INDEX idx_learning_timeline_activity_type ON learning_timeline(activity_type);
CREATE INDEX idx_learning_timeline_user_activity ON learning_timeline(user_id, activity_type);

-- 成就检查优化
CREATE INDEX idx_series_submissions_student_status ON series_submissions(student_id, status);
CREATE INDEX idx_series_ai_gradings_final_score ON series_ai_gradings(final_score);
```

#### 5.2 去重机制
- 使用 `activity_description` 字段存储问卷ID进行去重
- 防止重复给予经验值奖励

### 6. 技能标签映射

支持的技能标签映射：
```typescript
const skillTypeMapping = {
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
```

## 使用示例

### 创建带技能标签的系列问答
```typescript
const questionnaire = await seriesQuestionnaireService.createSeriesQuestionnaire({
  title: '课程反思问答',
  lesson_id: 'lesson-uuid',
  skill_tags: ['Critical Thinking', 'Communication'],
  // ... 其他配置
});
```

### 学生提交答案
```typescript
const result = await seriesQuestionnaireService.submitSeriesAnswers({
  questionnaire_id: 'questionnaire-uuid',
  answers: { /* 答案内容 */ },
  status: 'submitted'
});
// 自动触发游戏化奖励处理
```

## 注意事项

1. **错误处理**: 游戏化奖励处理失败不会影响主业务流程
2. **缓存管理**: 相关缓存会在奖励处理后自动清除
3. **性能优化**: 使用数据库索引优化成就检查查询
4. **扩展性**: 新的成就类型可以通过数据库配置添加

## 下一步计划

1. 添加更多系列问答相关成就
2. 实现成就进度可视化
3. 添加技能经验分配的可视化反馈
4. 优化大量用户的成就检查性能
