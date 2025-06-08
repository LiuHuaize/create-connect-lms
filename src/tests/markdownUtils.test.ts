import { containsMarkdown } from '@/utils/markdownUtils';

// 简单的测试函数
function runTests() {
  console.log('开始测试 containsMarkdown 函数...\n');

  const testCases = [
    {
      name: '包含加粗文字',
      text: '这是**加粗文字**的示例',
      expected: true
    },
    {
      name: '包含斜体文字',
      text: '这是*斜体文字*的示例',
      expected: true
    },
    {
      name: '包含空行',
      text: `第一行文字

第二行文字`,
      expected: true
    },
    {
      name: '包含多个空行',
      text: `第一行

第二行

第三行`,
      expected: true
    },
    {
      name: '包含空行和格式',
      text: `这是第一段

**重要提示**：请仔细阅读

最后一段`,
      expected: true
    },
    {
      name: '普通单行文本',
      text: '这是普通的单行文本',
      expected: false
    },
    {
      name: '包含换行但无空行',
      text: '第一行\n第二行\n第三行',
      expected: false
    },
    {
      name: '空字符串',
      text: '',
      expected: false
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((testCase, index) => {
    const result = containsMarkdown(testCase.text);
    const passed = result === testCase.expected;
    
    console.log(`测试 ${index + 1}: ${testCase.name}`);
    console.log(`  输入: ${JSON.stringify(testCase.text)}`);
    console.log(`  期望: ${testCase.expected}`);
    console.log(`  结果: ${result}`);
    console.log(`  状态: ${passed ? '✅ 通过' : '❌ 失败'}\n`);
    
    if (passed) {
      passedTests++;
    }
  });

  console.log(`测试完成: ${passedTests}/${totalTests} 通过`);
  
  if (passedTests === totalTests) {
    console.log('🎉 所有测试都通过了！');
  } else {
    console.log('⚠️ 有测试失败，请检查实现');
  }
}

// 运行测试
runTests();

export { runTests };
