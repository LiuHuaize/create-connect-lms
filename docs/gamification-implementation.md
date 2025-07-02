# 游戏化系统实现文档

## 概述

本文档描述了LMS游戏化系统第一阶段第二步的实现：**基础经验值系统**。该系统在用户完成课程和课时时自动给予经验值奖励。

## 实现的功能

### 1. 经验值系统核心功能

- **自动经验值奖励**：用户完成课时时自动获得经验值
- **课时类型差异化奖励**：不同类型的课时给予不同的经验值
- **测验分数奖励**：测验课时根据分数给予额外奖励
- **等级计算**：基于总经验值自动计算用户等级
- **防重复奖励**：确保同一课时只能获得一次经验值

### 2. 经验值规则

#### 基础经验值（按课时类型）
- 文本课时：20 EXP
- 视频课时：30 EXP
- 测验课时：40 EXP
- 作业课时：50 EXP
- 热点课时：35 EXP
- 卡片创建课时：45 EXP

#### 测验分数奖励（额外经验值）
- 100分：+20 EXP
- 90-99分：+15 EXP
- 80-89分：+10 EXP
- 60-79分：+5 EXP

#### 等级系统
- 每级需要100经验值
- 等级 = floor(总经验值 / 100) + 1

### 3. 数据库结构

#### 扩展的 profiles 表
```sql
-- 游戏化字段已添加到现有的 profiles 表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '新手学习者';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS learning_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
```

#### learning_timeline 表
```sql
-- 学习活动时间线表
CREATE TABLE learning_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  experience_gained INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 实现的文件

### 1. 核心服务文件

#### `src/services/gamificationService.ts`
- 经验值计算逻辑
- 等级计算函数
- 用户档案管理
- 学习时间线管理
- 课时完成处理

### 2. 修改的现有文件

#### `src/services/courseService.ts`
- 在 `markLessonComplete` 函数中集成经验值奖励
- 在 `saveQuizResult` 函数中集成经验值奖励
- 添加课时类型映射函数
- 添加经验值处理函数

### 3. 用户界面组件

#### `src/components/gamification/UserProfile.tsx`
- 用户档案显示组件
- 经验值进度条
- 等级显示
- 学习活动时间线

#### `src/pages/profile/ProfilePage.tsx`
- 用户档案页面
- 路由：`/profile`

#### `src/pages/test/GamificationTest.tsx`
- 游戏化系统测试页面
- 路由：`/test-gamification`
- 用于测试经验值系统功能

### 4. 路由配置

#### `src/routes/index.tsx`
- 添加了 `/profile` 路由
- 添加了 `/test-gamification` 测试路由

## 工作流程

### 课时完成流程

1. 用户完成课时（通过各种课时组件）
2. 调用 `courseService.markLessonComplete()` 或 `courseService.saveQuizResult()`
3. 检查是否为首次完成（防重复奖励）
4. 如果是首次完成，调用 `handleLessonCompletionExperience()`
5. 获取课时信息（标题、类型）
6. 调用 `gamificationService.handleLessonComplete()`
7. 计算经验值（基础 + 分数奖励）
8. 更新用户档案（经验值、等级）
9. 添加学习时间线记录
10. 检查是否升级，如果升级则记录升级活动

### 经验值计算流程

1. 根据课时类型获取基础经验值
2. 如果是测验，根据分数计算额外奖励
3. 更新用户总经验值
4. 重新计算用户等级
5. 更新最后活动日期

## 测试方法

### 1. 使用测试页面
访问 `/test-gamification` 页面，点击测试按钮验证功能。

### 2. 实际课程测试
1. 注册并登录系统
2. 注册一个课程
3. 完成课时（文本、视频、测验等）
4. 查看 `/profile` 页面验证经验值和等级更新

### 3. 数据库验证
```sql
-- 查看用户经验值
SELECT username, total_level, total_experience, title FROM profiles WHERE id = 'user_id';

-- 查看学习时间线
SELECT * FROM learning_timeline WHERE user_id = 'user_id' ORDER BY created_at DESC;
```

## 下一步计划

根据PRD文档，下一步应该实现：

1. **第一阶段第三步**：开发用户档案页面（已部分完成）
2. **第一阶段第四步**：集成到现有导航
3. **第二阶段**：六维技能系统
4. **第三阶段**：时间线和成就系统
5. **第四阶段**：AI助手和作品集

## 注意事项

1. **防重复奖励**：系统通过检查 `learning_timeline` 表中是否已存在相同的课时完成记录来防止重复奖励
2. **错误处理**：经验值系统的错误不会影响主要的课时完成流程
3. **性能考虑**：经验值计算是异步进行的，不会阻塞用户界面
4. **数据一致性**：所有经验值相关的数据库操作都有适当的错误处理

## 配置

经验值规则在 `src/services/gamificationService.ts` 中的 `EXPERIENCE_RULES` 常量中定义，可以根据需要调整。
