# AI评分功能测试指南

## 概述

本指南介绍如何使用提供的测试脚本来验证AI评分功能的正常工作。

## 测试脚本说明

### 1. 快速AI测试 (`quick-ai-test.js`)

**用途**: 快速验证AI API连接和评分功能
**特点**: 
- 不涉及数据库操作
- 运行速度快（约10-20秒）
- 使用预设的测试数据
- 直接测试AI评分逻辑

**运行方法**:
```bash
cd scripts
npm run quick-ai-test
```

**输出示例**:
```
🚀 快速AI评分测试
✅ AI评分成功！

📊 评分结果:
总分: 85/100
总体反馈: 学生对软件工程基础知识有较好的理解...

📝 详细反馈:
问题1: 44分
反馈: 学生对软件工程的定义较为准确...

📈 分项评分:
完整性: 26分
准确性: 34分
深度: 25分

🎉 AI评分功能正常工作！
```

### 2. 完整AI评分测试 (`test-ai-grading.js`)

**用途**: 完整测试AI评分功能和数据库集成
**特点**:
- 创建完整的测试数据（课程、模块、课时、问卷、问题）
- 测试数据库操作和AI评分集成
- 自动清理测试数据
- 运行时间较长（约1-2分钟）

**运行方法**:
```bash
cd scripts
npm run test-ai-grading
```

**测试流程**:
1. 测试AI API连接
2. 创建测试课程和模块
3. 创建系列问答和问题
4. 创建学生提交
5. 执行AI评分
6. 验证评分结果
7. 清理测试数据

### 3. 系列问答AI集成测试 (`test-series-ai-integration.js`)

**用途**: 测试现有系列问答的AI评分集成
**特点**:
- 使用现有的问卷数据
- 测试系列问答服务层的AI评分集成
- 验证完整的评分流程
- 适用于生产环境验证

**运行方法**:
```bash
cd scripts
npm run test-series-ai
```

**前提条件**: 数据库中需要存在配置了AI评分的系列问答

## 环境配置

### 必需的环境变量

确保 `.env.local` 文件包含以下配置：

```env
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI服务配置
VITE_AIHUBMIX_API_KEY=your-aihubmix-api-key
```

### 安装依赖

```bash
cd scripts
npm install
```

## 测试建议

### 开发阶段
1. 首先运行 `quick-ai-test` 验证AI API连接
2. 然后运行 `test-ai-grading` 验证完整功能
3. 最后运行 `test-series-ai` 验证集成

### 生产部署前
1. 运行所有测试脚本确保功能正常
2. 检查评分结果的合理性
3. 验证错误处理机制

### 故障排查
1. 如果AI API连接失败，检查API密钥和网络连接
2. 如果数据库操作失败，检查Supabase配置和权限
3. 如果评分结果异常，检查提示词和评分标准

## 常见问题

### Q: 测试失败，提示API密钥错误
A: 检查 `.env.local` 文件中的 `VITE_AIHUBMIX_API_KEY` 是否正确配置

### Q: 数据库操作失败，提示权限错误
A: 确保使用的是 `SUPABASE_SERVICE_ROLE_KEY` 而不是匿名密钥

### Q: AI评分结果不合理
A: 检查评分提示词和标准是否合适，可以调整 `ai_grading_prompt` 和 `ai_grading_criteria`

### Q: 测试数据没有清理
A: 手动运行清理脚本或检查数据库中的测试数据

## 性能基准

### 快速测试
- 运行时间: 10-20秒
- API调用: 1次
- 数据库操作: 0次

### 完整测试
- 运行时间: 1-2分钟
- API调用: 2次（连接测试 + 评分）
- 数据库操作: 约10次（创建和清理）

### 集成测试
- 运行时间: 30-60秒
- API调用: 1次
- 数据库操作: 约5次

## 扩展测试

### 自定义测试数据
可以修改测试脚本中的 `testData` 对象来测试不同的问题和答案：

```javascript
const testData = {
  questionnaire: {
    title: '自定义问卷标题',
    max_score: 100,
    // ...
  },
  questions: [
    {
      title: '自定义问题',
      content: '问题内容',
      // ...
    }
  ],
  answers: [
    {
      answer_text: '学生答案',
      // ...
    }
  ]
};
```

### 批量测试
可以创建循环来测试多个不同的场景：

```javascript
const testCases = [
  { /* 测试用例1 */ },
  { /* 测试用例2 */ },
  // ...
];

for (const testCase of testCases) {
  await testAIGrading(testCase);
}
```

## 总结

通过这些测试脚本，可以全面验证AI评分功能的正确性和稳定性。建议在开发和部署过程中定期运行这些测试，确保功能始终正常工作。
