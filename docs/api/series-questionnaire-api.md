# 系列问答功能 API 接口规范

## 概述

系列问答功能提供了一套完整的API接口，支持教师创建和管理系列问答，学生提交答案，以及AI自动评分等功能。

## 基础信息

- **基础URL**: `/functions/v1/`
- **认证方式**: Supabase JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## API 接口列表

### 1. 教师端接口

#### 1.1 创建系列问答

**接口地址**: `POST /create-series-questionnaire`

**请求参数**:
```typescript
{
  title: string;                    // 问卷标题
  description?: string;             // 问卷描述
  instructions?: string;            // 答题说明
  lesson_id: string;               // 关联课时ID
  ai_grading_prompt?: string;      // AI评分提示
  ai_grading_criteria?: string;    // AI评分标准
  max_score?: number;              // 最高分数，默认100
  time_limit_minutes?: number;     // 时间限制（分钟）
  allow_save_draft?: boolean;      // 是否允许保存草稿，默认true
  skill_tags?: string[];           // 技能标签
  questions: Array<{               // 问题列表
    title: string;                 // 问题标题
    description?: string;          // 问题描述
    question_text: string;         // 问题内容
    order_index: number;           // 排序索引
    required?: boolean;            // 是否必答，默认true
    min_words?: number;            // 最少字数，默认0
    max_words?: number;            // 最多字数
    placeholder_text?: string;     // 占位符文本
  }>;
}
```

**响应格式**:
```typescript
{
  success: boolean;
  message?: string;
  error?: string;
  data?: SeriesQuestionnaire;
}
```

#### 1.2 更新系列问答

**接口地址**: `POST /update-series-questionnaire`

**请求参数**: 与创建接口类似，但所有字段都是可选的，需要包含 `id` 字段

#### 1.3 获取系列问答详情

**接口地址**: `GET /series-questionnaires/{id}`

**响应格式**:
```typescript
{
  success: boolean;
  data?: {
    ...SeriesQuestionnaire,
    questions: SeriesQuestion[];
    stats?: SeriesQuestionnaireStats;
  };
}
```

#### 1.4 获取系列问答列表

**接口地址**: `GET /series-questionnaires`

**查询参数**:
- `lesson_id`: 课时ID
- `page`: 页码，默认1
- `limit`: 每页数量，默认10
- `search`: 搜索关键词
- `status`: 状态筛选

#### 1.5 删除系列问答

**接口地址**: `DELETE /series-questionnaires/{id}`

### 2. 学生端接口

#### 2.1 获取学生提交状态

**接口地址**: `GET /series-questionnaires/{id}/submission-status`

**响应格式**:
```typescript
{
  success: boolean;
  data?: {
    submission?: SeriesSubmission;
    has_submission: boolean;
    can_submit: boolean;
    time_remaining?: number;
  };
}
```

#### 2.2 保存草稿

**接口地址**: `POST /save-series-draft`

**请求参数**:
```typescript
{
  questionnaire_id: string;
  answers: Array<{
    question_id: string;
    answer_text: string;
    word_count?: number;
  }>;
  time_spent_minutes?: number;
}
```

#### 2.3 提交答案

**接口地址**: `POST /submit-series-answers`

**请求参数**:
```typescript
{
  questionnaire_id: string;
  answers: Array<{
    question_id: string;
    answer_text: string;
    word_count?: number;
  }>;
  status: 'submitted';
  time_spent_minutes?: number;
}
```

**响应格式**:
```typescript
{
  success: boolean;
  data?: {
    submission: SeriesSubmission;
    redirect_to_grading?: boolean;
  };
}
```

### 3. AI评分接口

#### 3.1 触发AI评分

**接口地址**: `POST /ai-grade-series`

**请求参数**:
```typescript
{
  submission_id: string;
  force_regrade?: boolean;
}
```

**响应格式**:
```typescript
{
  success: boolean;
  data?: SeriesAIGrading;
}
```

#### 3.2 教师评分

**接口地址**: `POST /teacher-grade-series`

**请求参数**:
```typescript
{
  submission_id: string;
  teacher_score: number;
  teacher_feedback: string;
}
```

### 4. 提交管理接口

#### 4.1 获取提交列表（教师用）

**接口地址**: `GET /series-submissions`

**查询参数**:
- `questionnaire_id`: 问卷ID（必需）
- `page`: 页码
- `limit`: 每页数量
- `status`: 状态筛选
- `student_id`: 学生ID筛选
- `sort_by`: 排序字段
- `sort_order`: 排序方向

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如重复提交） |
| 500 | 服务器内部错误 |

## 数据库函数

系统使用以下数据库函数来优化性能：

1. `get_series_questionnaire_details(p_questionnaire_id)` - 获取问卷详情
2. `get_student_submission_status(p_questionnaire_id, p_student_id)` - 获取学生提交状态
3. `calculate_submission_word_count(p_submission_id)` - 计算提交字数
4. `update_submission_word_count()` - 自动更新字数触发器

## 权限控制

- **教师权限**: 可以创建、编辑、删除自己课程中的系列问答
- **学生权限**: 可以查看已发布的系列问答，提交答案，查看自己的评分结果
- **系统权限**: AI评分功能需要系统级权限

## 缓存策略

- 问卷详情缓存5分钟
- 提交状态缓存1分钟
- 评分结果缓存10分钟

## 限制说明

- 单个问卷最多50个问题
- 单个答案最多10000字
- 草稿自动保存间隔30秒
- AI评分超时时间60秒
