# 系列问答学生端实现文档

## 概述

本文档描述了系列问答学生端答题界面的实现，这是第五阶段学生端界面开发的核心组件。

## 实现的功能

### 1. 核心组件

#### SeriesQuestionnaireStudent 组件
- **位置**: `src/components/course/lessons/series-questionnaire/SeriesQuestionnaireStudent.tsx`
- **功能**: 学生端系列问答答题界面
- **特性**:
  - 支持多问题顺序答题
  - 实时字数统计和验证
  - 草稿保存功能
  - 答题进度跟踪
  - 时间统计
  - 答案提交和状态管理
  - AI评分结果显示

### 2. 主要功能特性

#### 2.1 问答加载和显示
- 自动加载问答详情和问题列表
- 支持lesson类型和独立系列问答两种数据结构
- 显示问答标题、描述、说明和技能标签
- 显示时间限制和已用时间

#### 2.2 答题界面
- 逐题显示，支持必填标记
- 实时字数统计和进度条
- 字数限制验证（最小/最大字数）
- 占位符文本提示
- 答题进度百分比显示

#### 2.3 草稿保存
- 支持保存答题草稿
- 自动加载已保存的草稿内容
- 保存时间统计

#### 2.4 答案提交
- 必填问题验证
- 提交确认流程
- 提交状态跟踪
- AI评分触发

#### 2.5 状态管理
- 未开始状态
- 草稿状态
- 已提交状态（等待评分）
- 已评分状态（显示结果）

### 3. 技术实现

#### 3.1 数据服务更新
更新了 `src/services/seriesQuestionnaireService.ts` 以支持lesson类型的系列问答：

- `getSeriesQuestionnaire()`: 支持从lessons表和series_questionnaires表获取数据
- `saveSeriesDraft()`: 支持lesson类型的草稿保存验证
- `submitSeriesAnswers()`: 支持lesson类型的答案提交

#### 3.2 课程集成
更新了 `src/pages/course/components/LessonContent.tsx`：
- 添加了series_questionnaire类型的处理
- 正确传递questionnaireId参数
- 集成到课程学习流程中

#### 3.3 路由配置
添加了测试路由 `/test-series-questionnaire` 用于开发和测试。

### 4. 组件接口

```typescript
interface SeriesQuestionnaireStudentProps {
  questionnaireId: string;  // 问答ID
  lessonId: string;         // 课时ID
  courseId: string;         // 课程ID
  enrollmentId: string | null; // 注册ID
  onComplete?: () => void;  // 完成回调
}
```

### 5. 依赖组件

- `WordCountDisplay`: 字数统计显示组件
- UI组件: Card, Button, Textarea, Progress, Badge等
- 图标: Lucide React图标库

### 6. 状态流程

```
未开始 → 答题中 → 草稿保存 → 提交答案 → AI评分中 → 已评分
   ↓         ↓         ↓         ↓         ↓         ↓
 加载问答   实时统计   保存草稿   验证提交   等待结果   显示分数
```

### 7. 错误处理

- 网络错误处理和重试机制
- 数据验证错误提示
- 用户友好的错误信息显示
- 加载状态和错误状态的UI反馈

### 8. 性能优化

- 使用React.memo优化渲染
- 缓存问答数据
- 防抖输入处理
- 懒加载组件

### 9. 测试

创建了测试页面 `src/pages/test/SeriesQuestionnaireTest.tsx`：
- 使用真实的问答数据进行测试
- 可通过 `/test-series-questionnaire` 路由访问

### 10. 下一步计划

1. 添加自动保存功能
2. 实现答题时间提醒
3. 添加答题历史记录
4. 优化移动端体验
5. 添加键盘快捷键支持

## 使用方法

### 在课程中使用
系列问答会自动在课程学习页面中渲染，当课时类型为 `series_questionnaire` 时。

### 独立测试
访问 `/test-series-questionnaire` 路由可以独立测试组件功能。

### 数据要求
- 问答数据需要包含questions数组
- 每个问题需要包含id, title, question_text等基本字段
- 支持min_words, max_words字数限制
- 支持required必填标记

## 注意事项

1. 组件依赖用户登录状态
2. 需要正确的enrollmentId才能保存和提交答案
3. AI评分功能需要配置相应的评分提示和标准
4. 字数统计支持中英文混合计算
5. 草稿保存功能需要问答配置允许保存草稿
