# 系列问答功能使用示例

## 教师端：创建系列问答

### 1. 在课程创建器中添加系列问答课时

1. 进入课程创建器
2. 选择要添加系列问答的模块
3. 点击"添加系列问答"按钮
4. 系统会创建一个新的系列问答课时

### 2. 配置系列问答基本信息

```typescript
// 基本设置
{
  title: "课程反思问答",
  description: "请回答以下关于本课程学习的问题",
  instructions: "请认真思考每个问题，结合你的学习体验进行回答。每个问题都有字数要求，请注意控制答案长度。",
  max_score: 100,
  time_limit_minutes: 60,
  allow_save_draft: true,
  skill_tags: ["Critical Thinking", "Communication"]
}
```

### 3. 添加问题

```typescript
// 问题示例
const questions = [
  {
    title: "学习收获",
    description: "请详细描述你在本课程中的主要学习收获",
    question_text: "通过本课程的学习，你获得了哪些新的知识和技能？这些收获对你的学习或工作有什么帮助？",
    order_index: 1,
    required: true,
    min_words: 50,
    max_words: 200,
    placeholder_text: "请从知识、技能、思维方式等方面进行回答..."
  },
  {
    title: "学习方法",
    description: "分享你在学习过程中使用的有效方法",
    question_text: "在学习本课程的过程中，你使用了哪些学习方法？哪些方法最有效？",
    order_index: 2,
    required: true,
    min_words: 30,
    max_words: 150,
    placeholder_text: "如：笔记方法、复习策略、实践应用等..."
  },
  {
    title: "改进建议",
    description: "对课程内容和教学方式的建议",
    question_text: "你对本课程的内容安排、教学方式或学习资源有什么改进建议？",
    order_index: 3,
    required: false,
    min_words: 20,
    max_words: 100,
    placeholder_text: "请提出具体的改进建议..."
  }
];
```

### 4. 配置AI评分（可选）

```typescript
// AI评分设置
{
  ai_grading_prompt: "请根据学生的回答质量进行评分，重点关注：1. 回答的完整性和深度 2. 思考的逻辑性 3. 与课程内容的结合度 4. 表达的清晰度",
  ai_grading_criteria: "优秀(90-100分)：回答全面深入，逻辑清晰，与课程结合紧密；良好(80-89分)：回答较为完整，有一定深度；及格(60-79分)：回答基本完整，但深度不够；不及格(0-59分)：回答不完整或偏离主题"
}
```

## 学生端：答题体验

### 1. 进入答题界面

学生在课程学习页面点击系列问答课时，会看到：

- 问答标题和描述
- 总问题数量和时间限制
- 答题说明
- 开始答题按钮

### 2. 答题过程

#### 界面元素：
- **进度条**：显示当前进度（如：2/3, 67%）
- **计时器**：显示已用时间和剩余时间
- **问题导航**：上一题/下一题按钮
- **当前问题**：
  - 问题编号和标题
  - 问题描述（如果有）
  - 问题内容
  - 必答标识
  - 字数要求提示

#### 答案输入：
- 多行文本输入框
- 实时字数统计
- 字数限制验证
- 错误提示

#### 操作按钮：
- **保存草稿**：保存当前答案（如果启用）
- **上一题**：返回上一个问题
- **下一题**：进入下一个问题
- **提交答案**：最后一题时显示

### 3. 提交验证

系统会检查：
- 所有必答题是否已回答
- 答案字数是否符合要求
- 如果有错误，会显示具体提示

### 4. 完成状态

提交成功后显示：
- 完成确认消息
- 提交时间
- 总用时
- 已提交的答案预览

## 数据流示例

### 1. 创建系列问答

```typescript
// 教师创建
const createRequest = {
  title: "课程反思问答",
  description: "请回答以下关于本课程学习的问题",
  lesson_id: "lesson-123",
  max_score: 100,
  time_limit_minutes: 60,
  allow_save_draft: true,
  skill_tags: ["Critical Thinking", "Communication"],
  questions: [
    {
      title: "学习收获",
      question_text: "通过本课程的学习，你获得了哪些新的知识和技能？",
      order_index: 1,
      required: true,
      min_words: 50,
      max_words: 200
    }
    // ... 更多问题
  ]
};

const response = await seriesQuestionnaireService.createSeriesQuestionnaire(createRequest);
```

### 2. 学生答题

```typescript
// 学生提交答案
const submitRequest = {
  questionnaire_id: "questionnaire-456",
  answers: [
    {
      question_id: "question-1",
      answer_text: "通过本课程的学习，我掌握了React开发的核心概念，包括组件化思想、状态管理、生命周期等。这些知识帮助我能够独立开发前端应用，提高了我的编程能力和问题解决能力。"
    },
    {
      question_id: "question-2", 
      answer_text: "我主要使用了理论学习+实践练习的方法，每学完一个概念就立即编写代码验证。同时做了详细的笔记，定期复习巩固。"
    }
  ],
  status: "submitted",
  time_spent_minutes: 45
};

const response = await seriesQuestionnaireService.submitSeriesAnswers(submitRequest);
```

### 3. AI评分（自动触发）

```typescript
// 系统自动进行AI评分
const gradingRequest = {
  submission_id: "submission-789",
  force_regrade: false
};

const gradingResponse = await seriesQuestionnaireService.aiGradeSeries(gradingRequest);
```

## 最佳实践

### 教师端：
1. **问题设计**：问题要具体明确，避免过于宽泛
2. **字数控制**：合理设置字数限制，既要保证回答质量又不能过于苛刻
3. **时间安排**：根据问题数量和复杂度合理设置时间限制
4. **技能标签**：准确标记相关技能，便于学生能力追踪

### 学生端：
1. **仔细阅读**：认真阅读问题要求和答题说明
2. **合理分配时间**：根据问题数量和时间限制合理安排
3. **及时保存**：利用草稿保存功能避免意外丢失
4. **检查答案**：提交前检查是否符合字数要求

## 技术集成

### 在现有课程中添加：

```typescript
// 1. 在课程类型中已包含 'series_questionnaire'
// 2. LessonContent 组件已支持渲染
// 3. 课程创建器已支持添加

// 使用示例：
<LessonContent
  selectedLesson={{
    id: "lesson-123",
    type: "series_questionnaire",
    title: "课程反思问答",
    content: {
      questionnaire: {
        // 系列问答数据
      }
    }
  }}
  // ... 其他属性
/>
```

这样，系列问答功能就完全集成到了现有的课程系统中，为学生提供了丰富的互动学习体验。
