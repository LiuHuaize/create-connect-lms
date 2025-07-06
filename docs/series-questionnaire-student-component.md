# SeriesQuestionnaireStudent 组件使用指南

## 概述

`SeriesQuestionnaireStudent` 组件是系列问答功能的学生端答题界面，提供了完整的答题体验，包括：

- 问题导航和进度显示
- 实时字数统计和验证
- 草稿保存功能
- 答案提交和验证
- 时间限制和计时
- 完成状态显示

## 组件属性

```typescript
interface SeriesQuestionnaireStudentProps {
  lessonId: string;           // 课时ID
  courseId: string;           // 课程ID
  enrollmentId: string | null; // 注册ID
  userId: string;             // 用户ID
  onComplete?: () => void;    // 完成回调
  navigate: (path: string) => void; // 导航函数
}
```

## 功能特性

### 1. 答题界面
- 逐题显示，支持前后导航
- 实时进度条显示
- 问题标题、描述和内容展示
- 必答题标识

### 2. 答案输入
- 多行文本输入框
- 实时字数统计
- 字数限制验证
- 占位符文本支持

### 3. 时间管理
- 显示已用时间
- 时间限制倒计时
- 时间不足警告

### 4. 草稿保存
- 自动保存功能（如果启用）
- 手动保存草稿
- 草稿恢复

### 5. 答案提交
- 必答题验证
- 字数限制检查
- 提交确认
- 成功反馈

### 6. 完成状态
- 已提交答案展示
- 提交时间显示
- 用时统计

## 在课程中的集成

组件已集成到 `LessonContent` 中，当课时类型为 `'series_questionnaire'` 时自动渲染：

```typescript
case 'series_questionnaire':
  return (
    <SeriesQuestionnaireStudent
      key={selectedLesson.id}
      lessonId={selectedLesson.id}
      courseId={courseData?.id || ''}
      enrollmentId={enrollmentId}
      userId={currentUserId}
      onComplete={() => {
        // 刷新课程数据以更新进度
        if (refreshCourseData) {
          refreshCourseData();
        }
      }}
      navigate={navigate}
    />
  );
```

## 数据流

1. **加载阶段**
   - 获取课时的系列问答数据
   - 检查学生提交状态
   - 加载草稿答案（如果有）

2. **答题阶段**
   - 实时保存答案到状态
   - 字数统计和验证
   - 草稿保存（可选）

3. **提交阶段**
   - 验证所有必答题
   - 检查字数限制
   - 提交到服务器
   - 触发完成回调

## 状态管理

组件使用内部状态管理：

```typescript
interface SeriesQuestionnaireStudentState {
  questionnaire?: SeriesQuestionnaire;
  questions: SeriesQuestion[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  timeSpent: number;
  wordCounts: Record<string, number>;
  errors: Record<string, string>;
  submission?: SeriesSubmission;
}
```

## 错误处理

- 网络请求失败处理
- 数据验证错误提示
- 用户友好的错误消息
- 自动重试机制

## 用户体验

- 流畅的动画过渡
- 响应式设计
- 加载状态指示
- 成功提交庆祝效果
- 直观的进度显示

## 依赖服务

组件依赖以下服务：

- `seriesQuestionnaireService`: 系列问答数据操作
- `countWords`: 字数统计工具
- `useToast`: 消息提示
- `confetti`: 庆祝效果

## 样式和主题

组件使用项目统一的设计系统：

- Card 组件布局
- 一致的颜色方案
- 响应式间距
- 无障碍支持

## 测试

可以使用测试页面进行组件测试：

```typescript
// src/pages/test/SeriesQuestionnaireTest.tsx
import SeriesQuestionnaireStudent from '@/components/course/series-questionnaire/SeriesQuestionnaireStudent';
```

## 注意事项

1. 确保传入正确的 `lessonId`，组件会自动查找对应的系列问答
2. `enrollmentId` 用于权限验证，确保学生已注册课程
3. `onComplete` 回调用于更新课程进度，建议刷新相关数据
4. 组件会自动处理已提交状态，无需外部控制

## 未来扩展

- 支持多媒体答案（图片、音频）
- 协作答题功能
- 实时保存优化
- 离线答题支持
- 答题分析和统计
