// 简单的JavaScript测试文件，用于在浏览器控制台中测试

// 复制containsMarkdown函数的逻辑
function containsMarkdown(text) {
  const markdownPatterns = [
    /[*_]{1,2}[^*_]+[*_]{1,2}/,  // 斜体或粗体
    /^#+\s/m,                    // 标题
    /!\[.*?\]\(.*?\)/,           // 图片
    /\[.*?\]\(.*?\)/,            // 链接
    /^-\s/m,                     // 无序列表
    /^[0-9]+\.\s/m,              // 有序列表
    /`{1,3}[^`]+`{1,3}/,         // 代码块或内联代码
    /^>\s/m,                     // 引用
    /^---+$/m,                   // 水平线
    /\|(.+\|)+/,                 // 表格
    /\n\s*\n/                    // 包含空行（两个换行符之间可能有空白字符）
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}

// 测试用例
const testCases = [
  {
    name: '用户输入的文本',
    text: '**新问题**',
    expected: true
  },
  {
    name: '另一个加粗示例',
    text: '这是**加粗文字**的示例',
    expected: true
  },
  {
    name: '斜体示例',
    text: '这是*斜体文字*的示例',
    expected: true
  },
  {
    name: '普通文本',
    text: '新问题',
    expected: false
  }
];

console.log('开始测试 containsMarkdown 函数...\n');

testCases.forEach((testCase, index) => {
  const result = containsMarkdown(testCase.text);
  const passed = result === testCase.expected;
  
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`  输入: "${testCase.text}"`);
  console.log(`  期望: ${testCase.expected}`);
  console.log(`  结果: ${result}`);
  console.log(`  状态: ${passed ? '✅ 通过' : '❌ 失败'}`);
  console.log('');
});

// 特别测试加粗正则表达式
const boldPattern = /[*_]{1,2}[^*_]+[*_]{1,2}/;
console.log('测试加粗正则表达式:');
console.log(`"**新问题**" 匹配结果: ${boldPattern.test('**新问题**')}`);
console.log(`"**新问题**" 匹配内容: ${JSON.stringify('**新问题**'.match(boldPattern))}`);
