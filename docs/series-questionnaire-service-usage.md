# 系列问答服务使用指南

## 概述

`seriesQuestionnaireService` 提供了完整的系列问答功能，包括创建、更新、删除问答，学生答题，AI评分等功能。所有方法都已移除Edge Function调用，改为直接使用Supabase客户端。

## 主要功能

### 1. 教师端功能

#### 创建系列问答
```typescript
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';

const result = await seriesQuestionnaireService.createSeriesQuestionnaire({
  title: '课程反思问答',
  description: '请回答以下关于课程的问题',
  lesson_id: 'lesson-uuid',
  max_score: 100,
  time_limit_minutes: 60,
  allow_save_draft: true,
  skill_tags: ['Critical Thinking', 'Communication'],
  questions: [
    {
      title: '学习收获',
      question_text: '请描述你在本课程中的主要学习收获',
      order_index: 1,
      required: true,
      min_words: 50,
      max_words: 200
    },
    {
      title: '改进建议',
      question_text: '你对本课程有什么改进建议？',
      order_index: 2,
      required: false,
      min_words: 20
    }
  ]
});

if (result.success) {
  console.log('创建成功:', result.data);
} else {
  console.error('创建失败:', result.error);
}
```

#### 更新系列问答
```typescript
const result = await seriesQuestionnaireService.updateSeriesQuestionnaire({
  id: 'questionnaire-uuid',
  title: '更新后的标题',
  questions: [
    {
      id: 'question-uuid',
      title: '更新的问题标题',
      _action: 'update'
    },
    {
      title: '新增问题',
      question_text: '这是一个新问题',
      order_index: 3,
      _action: 'create'
    },
    {
      id: 'old-question-uuid',
      _action: 'delete'
    }
  ]
});
```

#### 获取提交列表
```typescript
const result = await seriesQuestionnaireService.getSubmissions({
  questionnaire_id: 'questionnaire-uuid',
  page: 1,
  limit: 20,
  status: 'submitted',
  sort_by: 'submitted_at',
  sort_order: 'desc'
});
```

### 2. 学生端功能

#### 保存草稿
```typescript
const result = await seriesQuestionnaireService.saveSeriesDraft({
  questionnaire_id: 'questionnaire-uuid',
  answers: [
    {
      question_id: 'question-1-uuid',
      answer_text: '这是我的部分答案...'
    }
  ],
  time_spent_minutes: 15
});
```

#### 提交答案
```typescript
const result = await seriesQuestionnaireService.submitSeriesAnswers({
  questionnaire_id: 'questionnaire-uuid',
  answers: [
    {
      question_id: 'question-1-uuid',
      answer_text: '我在本课程中学到了很多关于编程的知识...'
    },
    {
      question_id: 'question-2-uuid',
      answer_text: '建议增加更多实践练习...'
    }
  ],
  status: 'submitted',
  time_spent_minutes: 45
});

if (result.success && result.data?.redirect_to_grading) {
  // 自动跳转到评分页面
  console.log('提交成功，将进行AI评分');
}
```

### 3. 评分功能

#### AI评分
```typescript
const result = await seriesQuestionnaireService.triggerAIGrading({
  submission_id: 'submission-uuid',
  force_regrade: false
});

if (result.success) {
  console.log('AI评分结果:', result.data);
}
```

#### 教师评分
```typescript
const result = await seriesQuestionnaireService.teacherGradeSeries({
  submission_id: 'submission-uuid',
  teacher_score: 85,
  teacher_feedback: '回答很好，思路清晰，但可以更深入一些。'
});
```

## 数据验证

服务包含完整的数据验证：

- **问答验证**: 标题长度、描述长度、分数范围、时间限制等
- **问题验证**: 标题、内容、字数限制等
- **答案验证**: 必答题检查、字数限制检查等

## 错误处理

所有方法都返回统一的响应格式：

```typescript
interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
}
```

## 权限控制

- **教师权限**: 通过课程作者ID验证
- **学生权限**: 只能操作自己的提交
- **自动验证**: 所有操作都会自动验证用户权限

## 注意事项

1. **AI评分**: 目前返回模拟数据，实际使用时需要集成真实的AI评分服务
2. **事务处理**: 创建和更新操作包含适当的错误回滚机制
3. **性能优化**: 使用了适当的数据库查询优化和索引
4. **类型安全**: 完整的TypeScript类型定义确保类型安全

## 测试

运行测试：
```bash
npm test src/services/__tests__/seriesQuestionnaireService.test.ts
```
