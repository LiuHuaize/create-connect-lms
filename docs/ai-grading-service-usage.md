# AI评分服务使用指南

## 概述

AI评分服务集成了4.1mini模型，为系列问答提供智能评分功能。该服务支持单个评分、批量评分和重新评分等功能。

## 功能特性

- ✅ 使用4.1mini模型进行智能评分
- ✅ 支持自定义评分标准和提示词
- ✅ 提供详细的分项反馈
- ✅ 支持批量评分处理
- ✅ 支持强制重新评分
- ✅ 完整的错误处理和重试机制

## API配置

### 4.1mini模型配置
```typescript
const MINI_API_KEY = 'sk-LVuSMVbv6rcXN9BF555dC39001Ad46D28610D76b62285595';
const MINI_API_URL = 'https://api.gptapi.us/v1/chat/completions';
const MINI_MODEL_NAME = 'gpt-4.1-mini';
```

## 使用方法

### 1. 单个提交AI评分

```typescript
import { seriesQuestionnaireService } from '@/services/seriesQuestionnaireService';

// 触发AI评分
const result = await seriesQuestionnaireService.triggerAIGrading({
  submission_id: 'submission-uuid',
  force_regrade: false // 是否强制重新评分
});

if (result.success) {
  console.log('AI评分结果:', result.data);
  console.log('总分:', result.data.ai_score);
  console.log('反馈:', result.data.ai_feedback);
  console.log('详细反馈:', result.data.ai_detailed_feedback);
} else {
  console.error('评分失败:', result.error);
}
```

### 2. 批量AI评分

```typescript
// 批量评分所有已提交的答案
const batchResult = await seriesQuestionnaireService.batchAIGrading({
  questionnaire_id: 'questionnaire-uuid',
  force_regrade: false
});

if (batchResult.success) {
  console.log('批量评分结果:');
  console.log('总处理数:', batchResult.data.total_processed);
  console.log('成功数:', batchResult.data.successful_gradings);
  console.log('失败数:', batchResult.data.failed_gradings);
  
  // 查看每个提交的评分结果
  batchResult.data.results.forEach(result => {
    if (result.success) {
      console.log(`提交 ${result.submission_id} 评分成功`);
    } else {
      console.log(`提交 ${result.submission_id} 评分失败: ${result.error}`);
    }
  });
}
```

### 3. 指定提交批量评分

```typescript
// 只评分指定的提交
const specificBatchResult = await seriesQuestionnaireService.batchAIGrading({
  questionnaire_id: 'questionnaire-uuid',
  submission_ids: ['submission-1', 'submission-2', 'submission-3'],
  force_regrade: true
});
```

### 4. 强制重新评分

```typescript
// 重新评分已有结果
const regradeResult = await seriesQuestionnaireService.triggerAIGrading({
  submission_id: 'submission-uuid',
  force_regrade: true // 强制重新评分
});
```

## 评分结果格式

### AI评分结果结构
```typescript
interface AIGradingResult {
  overall_score: number;           // 总分
  overall_feedback: string;        // 总体反馈
  detailed_feedback: Array<{       // 详细反馈
    question_id: string;
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>;
  criteria_scores: Record<string, number>; // 各项标准得分
  suggestions: string[];           // 改进建议
}
```

### 数据库存储格式
```typescript
interface SeriesAIGrading {
  id: string;
  submission_id: string;
  ai_score: number;                // AI评分
  ai_feedback: string;             // AI反馈
  ai_detailed_feedback: any[];     // 详细反馈数据
  teacher_score?: number;          // 教师评分（可选）
  teacher_feedback?: string;       // 教师反馈（可选）
  final_score: number;             // 最终分数
  grading_criteria_used: string;   // 使用的评分标准
  graded_at: string;               // 评分时间
  teacher_reviewed_at?: string;    // 教师复核时间
}
```

## 评分流程

### 1. 自动评分流程
1. 学生提交答案后，如果配置了AI评分，系统会自动触发评分
2. AI服务分析问题、答案和评分标准
3. 生成详细的评分结果和反馈
4. 保存到数据库并更新提交状态

### 2. 教师批量评分流程
1. 教师在管理界面选择需要评分的提交
2. 系统逐个调用AI评分服务
3. 为避免API限制，每次评分间隔2秒
4. 返回批量处理结果统计

### 3. 重新评分流程
1. 获取之前的评分结果作为参考
2. 在提示词中包含之前的结果
3. AI进行独立重新评分
4. 更新数据库中的评分记录

## 错误处理

### 常见错误类型
- `用户未登录`: 需要先登录
- `提交记录不存在`: 检查submission_id是否正确
- `无权访问此提交`: 只有教师或学生本人可以访问
- `只能对已提交的答案进行评分`: 检查提交状态
- `此问答未配置AI评分`: 需要先配置评分标准和提示词
- `已存在AI评分结果`: 使用force_regrade=true强制重新评分

### 重试机制
- API调用失败时会自动重试
- 批量评分中单个失败不影响其他评分
- 网络错误和服务器错误会触发重试

## 性能优化

### API限制处理
- 批量评分时每次间隔2秒避免API限制
- 使用较低的temperature(0.3)确保评分一致性
- 设置合理的max_tokens限制响应长度

### 缓存策略
- 已评分的提交不会重复评分（除非强制）
- 评分结果永久保存在数据库中
- 支持教师后续修改和复核

## 配置要求

### 问答配置
- `ai_grading_prompt`: AI评分提示词
- `ai_grading_criteria`: 评分标准描述
- `max_score`: 最高分数

### 权限要求
- 单个评分: 教师或学生本人
- 批量评分: 仅限课程作者（教师）
- 重新评分: 教师或学生本人

## 最佳实践

1. **评分标准设置**
   - 提供清晰具体的评分标准
   - 包含评分维度和权重说明
   - 给出评分示例和参考答案

2. **提示词优化**
   - 使用具体的评分指导语
   - 要求AI提供建设性反馈
   - 指定返回格式和结构

3. **批量处理**
   - 分批处理大量提交避免超时
   - 监控API使用量和成本
   - 定期检查评分质量

4. **质量控制**
   - 教师定期抽查AI评分结果
   - 对争议评分进行人工复核
   - 根据反馈调整评分标准
