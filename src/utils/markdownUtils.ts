/**
 * 检测文本是否包含markdown语法
 * @param text 要检查的文本
 * @returns 是否包含Markdown语法
 */
export const containsMarkdown = (text: string): boolean => {
  // 检查常见的markdown标记
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
    /\|(.+\|)+/                  // 表格
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
}; 