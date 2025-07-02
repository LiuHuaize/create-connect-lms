# 学习时间线功能实现文档

## 概述

学习时间线功能是游戏化系统的核心组件之一，用于记录和展示用户的学习活动历程。该功能自动记录用户的学习行为，包括课时完成、测验通过、课程完成等活动，并以时间线的形式展示给用户。

## 功能特性

### 1. 自动记录学习活动
- **课时完成**：用户完成课时时自动记录
- **测验通过**：用户通过测验时自动记录
- **课程完成**：用户完成整个课程时自动记录
- **连续学习**：记录用户的学习连续天数

### 2. 丰富的展示形式
- **时间线视图**：按时间顺序展示学习活动
- **活动分类**：支持按活动类型筛选
- **经验值显示**：每个活动显示获得的经验值
- **详细信息**：展开查看活动的详细信息

### 3. 用户友好的界面
- **响应式设计**：支持桌面和移动设备
- **实时刷新**：支持手动刷新获取最新数据
- **分页加载**：支持加载更多历史记录
- **筛选功能**：按活动类型筛选显示

## 技术实现

### 1. 数据库设计

#### learning_timeline 表结构
```sql
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

#### 索引优化
```sql
CREATE INDEX learning_timeline_user_id_idx ON learning_timeline(user_id);
CREATE INDEX learning_timeline_created_at_idx ON learning_timeline(created_at);
```

#### RLS 安全策略
```sql
-- 用户只能查看自己的时间线
CREATE POLICY "Users can view their own learning timeline"
  ON learning_timeline FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能创建自己的时间线记录
CREATE POLICY "Users can insert their own learning timeline"
  ON learning_timeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 管理员和教师可以查看所有时间线
CREATE POLICY "Admins and teachers can view all learning timelines"
  ON learning_timeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'teacher')
    )
  );
```

### 2. 服务层实现

#### gamificationService.ts
```typescript
// 添加时间线活动
async addTimelineActivity(
  userId: string,
  activityType: ActivityType,
  activityTitle: string,
  activityDescription?: string,
  courseId?: string,
  lessonId?: string,
  experienceGained: number = 0
): Promise<boolean>

// 获取用户时间线
async getUserTimeline(userId: string, limit: number = 20): Promise<any[]>
```

### 3. 组件设计

#### LearningTimeline 组件
- **位置**: `src/components/gamification/LearningTimeline.tsx`
- **功能**: 展示用户学习时间线
- **属性**:
  - `userId`: 用户ID
  - `limit`: 显示条目数量限制
  - `showFilters`: 是否显示筛选器
  - `compact`: 是否使用紧凑模式

#### 使用示例
```tsx
<LearningTimeline 
  userId={user.id} 
  limit={20} 
  showFilters={true} 
  compact={false} 
/>
```

### 4. 自动集成

#### 课时完成集成
时间线功能已自动集成到现有的课时完成流程中：

1. 用户完成课时时，`courseService.markLessonComplete()` 被调用
2. 该方法调用 `courseService.handleLessonCompletionExperience()`
3. 进而调用 `gamificationService.handleLessonComplete()`
4. 最终调用 `gamificationService.addExperience()` 和 `addTimelineActivity()`

## 页面和路由

### 1. 独立时间线页面
- **路由**: `/timeline`
- **组件**: `src/pages/timeline/TimelinePage.tsx`
- **功能**: 完整的时间线查看页面

### 2. 用户档案集成
- **路由**: `/profile`
- **组件**: `src/components/gamification/UserProfile.tsx`
- **功能**: 在用户档案的"学习时间线"标签页中展示

### 3. 导航菜单
时间线功能已添加到以下导航位置：
- 侧边栏"个人"部分
- 用户下拉菜单

## 测试

### 测试页面
- **路由**: `/test-timeline`
- **组件**: `src/pages/test/TimelineTest.tsx`
- **功能**: 
  - 手动添加测试时间线活动
  - 测试经验值添加功能
  - 验证时间线显示效果

### 测试步骤
1. 访问 `/test-timeline` 页面
2. 填写活动信息并添加测试活动
3. 查看时间线是否正确显示新活动
4. 测试筛选和刷新功能

## 使用指南

### 用户使用
1. **查看时间线**: 访问"我的档案" → "学习时间线"标签页
2. **完整时间线**: 点击侧边栏"学习时间线"或用户菜单中的"学习时间线"
3. **筛选活动**: 使用时间线页面的筛选下拉菜单
4. **查看详情**: 点击活动项的展开按钮查看详细信息

### 开发者使用
1. **添加新活动类型**: 在 `gamificationService.ts` 中扩展 `ActivityType`
2. **自定义时间线**: 使用 `LearningTimeline` 组件的不同属性配置
3. **集成到新功能**: 调用 `gamificationService.addTimelineActivity()` 方法

## 注意事项

1. **性能优化**: 时间线查询已添加适当的数据库索引
2. **安全性**: 使用RLS策略确保用户只能访问自己的数据
3. **用户体验**: 支持分页加载避免一次性加载过多数据
4. **错误处理**: 包含完善的错误处理和用户反馈机制

## 未来扩展

1. **社交功能**: 支持查看好友的学习时间线
2. **统计分析**: 添加学习行为分析和统计图表
3. **导出功能**: 支持导出学习记录为PDF或其他格式
4. **个性化**: 支持用户自定义时间线显示样式
