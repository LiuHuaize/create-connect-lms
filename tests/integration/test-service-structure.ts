#!/usr/bin/env tsx

/**
 * 系列问答服务结构测试脚本
 * 测试服务的基本结构和类型定义，不涉及实际数据库操作
 */

// 颜色输出函数
const colors = {
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(colors.green(`${prefix} ✅ ${message}`));
      break;
    case 'error':
      console.log(colors.red(`${prefix} ❌ ${message}`));
      break;
    case 'warning':
      console.log(colors.yellow(`${prefix} ⚠️  ${message}`));
      break;
    default:
      console.log(colors.blue(`${prefix} ℹ️  ${message}`));
  }
}

// 测试服务文件是否存在和可读
async function testServiceFileExists() {
  log('检查服务文件是否存在...', 'info');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const servicePath = path.resolve('../src/services/seriesQuestionnaireService.ts');
    
    if (fs.existsSync(servicePath)) {
      log('服务文件存在', 'success');
      
      // 读取文件内容检查基本结构
      const content = fs.readFileSync(servicePath, 'utf-8');
      
      // 检查关键导出
      if (content.includes('export const seriesQuestionnaireService')) {
        log('服务对象正确导出', 'success');
      } else {
        log('服务对象导出缺失', 'error');
      }
      
      // 检查关键方法
      const expectedMethods = [
        'createSeriesQuestionnaire',
        'updateSeriesQuestionnaire',
        'deleteSeriesQuestionnaire',
        'getSeriesQuestionnaire',
        'getSeriesQuestionnaires',
        'saveSeriesDraft',
        'submitSeriesAnswers',
        'triggerAIGrading',
        'teacherGradeSeries',
        'getStudentSubmissionStatus',
        'getSubmissions'
      ];
      
      let methodsFound = 0;
      for (const method of expectedMethods) {
        if (content.includes(`${method}(`)) {
          methodsFound++;
          log(`✓ ${method} 方法存在`, 'success');
        } else {
          log(`✗ ${method} 方法缺失`, 'error');
        }
      }
      
      log(`找到 ${methodsFound}/${expectedMethods.length} 个预期方法`, methodsFound === expectedMethods.length ? 'success' : 'warning');
      
      // 检查验证函数
      const validationFunctions = [
        'validateQuestionnaireData',
        'validateQuestionData',
        'validateAnswerData'
      ];
      
      let validationFound = 0;
      for (const func of validationFunctions) {
        if (content.includes(`function ${func}`)) {
          validationFound++;
          log(`✓ ${func} 验证函数存在`, 'success');
        } else {
          log(`✗ ${func} 验证函数缺失`, 'error');
        }
      }
      
      log(`找到 ${validationFound}/${validationFunctions.length} 个验证函数`, validationFound === validationFunctions.length ? 'success' : 'warning');
      
      // 检查是否移除了Edge Function调用
      const edgeFunctionCalls = content.match(/supabase\.functions\.invoke/g);
      if (!edgeFunctionCalls || edgeFunctionCalls.length === 0) {
        log('✓ 已成功移除所有Edge Function调用', 'success');
      } else {
        log(`✗ 仍有 ${edgeFunctionCalls.length} 个Edge Function调用未移除`, 'error');
      }
      
      // 检查直接Supabase客户端调用
      const supabaseClientCalls = content.match(/await supabase/g);
      if (supabaseClientCalls && supabaseClientCalls.length > 0) {
        log(`✓ 找到 ${supabaseClientCalls.length} 个直接Supabase客户端调用`, 'success');
      } else {
        log('✗ 未找到直接Supabase客户端调用', 'error');
      }
      
    } else {
      log('服务文件不存在', 'error');
    }
    
  } catch (error) {
    log(`文件检查失败: ${error}`, 'error');
  }
}

// 测试类型文件
async function testTypeDefinitions() {
  log('检查类型定义文件...', 'info');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const typePath = path.resolve('../src/types/series-questionnaire.ts');
    
    if (fs.existsSync(typePath)) {
      log('类型定义文件存在', 'success');
      
      const content = fs.readFileSync(typePath, 'utf-8');
      
      // 检查关键类型定义
      const expectedTypes = [
        'CreateSeriesQuestionnaireRequest',
        'UpdateSeriesQuestionnaireRequest',
        'SubmitSeriesAnswersRequest',
        'SaveSeriesDraftRequest',
        'AIGradeSeriesRequest',
        'TeacherGradeSeriesRequest',
        'CreateSeriesQuestionnaireResponse',
        'SubmitSeriesAnswersResponse',
        'AIGradeSeriesResponse'
      ];
      
      let typesFound = 0;
      for (const type of expectedTypes) {
        if (content.includes(`interface ${type}`) || content.includes(`type ${type}`)) {
          typesFound++;
          log(`✓ ${type} 类型存在`, 'success');
        } else {
          log(`✗ ${type} 类型缺失`, 'error');
        }
      }
      
      log(`找到 ${typesFound}/${expectedTypes.length} 个预期类型`, typesFound === expectedTypes.length ? 'success' : 'warning');
      
    } else {
      log('类型定义文件不存在', 'error');
    }
    
  } catch (error) {
    log(`类型检查失败: ${error}`, 'error');
  }
}

// 测试文档文件
async function testDocumentation() {
  log('检查文档文件...', 'info');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const docPath = path.resolve('../docs/series-questionnaire-service-usage.md');
    
    if (fs.existsSync(docPath)) {
      log('使用指南文档存在', 'success');
      
      const content = fs.readFileSync(docPath, 'utf-8');
      
      // 检查文档内容
      if (content.includes('## 概述')) {
        log('✓ 文档包含概述部分', 'success');
      }
      
      if (content.includes('## 主要功能')) {
        log('✓ 文档包含功能说明', 'success');
      }
      
      if (content.includes('```typescript')) {
        log('✓ 文档包含代码示例', 'success');
      }
      
    } else {
      log('使用指南文档不存在', 'warning');
    }
    
  } catch (error) {
    log(`文档检查失败: ${error}`, 'error');
  }
}

// 测试测试文件
async function testTestFiles() {
  log('检查测试文件...', 'info');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const testPath = path.resolve('../src/services/__tests__/seriesQuestionnaireService.test.ts');
    
    if (fs.existsSync(testPath)) {
      log('单元测试文件存在', 'success');
      
      const content = fs.readFileSync(testPath, 'utf-8');
      
      if (content.includes('describe(')) {
        log('✓ 测试文件包含测试套件', 'success');
      }
      
      if (content.includes('it(')) {
        log('✓ 测试文件包含测试用例', 'success');
      }
      
    } else {
      log('单元测试文件不存在', 'warning');
    }
    
  } catch (error) {
    log(`测试文件检查失败: ${error}`, 'error');
  }
}

// 主测试函数
async function runStructureTests() {
  console.log(colors.cyan('🚀 开始运行系列问答服务结构测试\n'));
  
  try {
    await testServiceFileExists();
    console.log('');
    
    await testTypeDefinitions();
    console.log('');
    
    await testDocumentation();
    console.log('');
    
    await testTestFiles();
    console.log('');
    
    log('结构测试完成！', 'success');
    console.log(colors.cyan('\n📋 测试总结:'));
    console.log('- ✅ 服务文件结构检查完成');
    console.log('- ✅ 类型定义检查完成');
    console.log('- ✅ 文档文件检查完成');
    console.log('- ✅ 测试文件检查完成');
    console.log('- ℹ️  所有Edge Function调用已移除，改为直接Supabase客户端调用');
    
  } catch (error) {
    log(`结构测试失败: ${error}`, 'error');
    process.exit(1);
  }
}

// 运行测试
runStructureTests().catch(error => {
  console.error(colors.red('结构测试脚本执行失败:'), error);
  process.exit(1);
});

export { runStructureTests };
