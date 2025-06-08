import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import QuizMarkdownRenderer from '@/components/ui/QuizMarkdownRenderer';
import { containsMarkdown } from '@/utils/markdownUtils';

const QuizMarkdownTest: React.FC = () => {
  const [questionText, setQuestionText] = useState(`这是第一段问题描述

这是第二段，中间有空行

**重要提示**：请仔细阅读

- 第一个要点
- 第二个要点：*斜体强调*
- 第三个要点：**加粗重点**

最后一段说明文字`);

  const [optionText, setOptionText] = useState(`这是一个多行选项

包含**加粗文字**和*斜体文字*

还有空行分隔`);

  const testCases = [
    {
      name: '数据库中的实际问题文本',
      text: '**新问题**\n新问题'
    },
    {
      name: '包含空行的普通文本',
      text: `第一行文字

第二行文字

第三行文字`
    },
    {
      name: '包含加粗的文本',
      text: '这是**加粗文字**的示例'
    },
    {
      name: '包含斜体的文本',
      text: '这是*斜体文字*的示例'
    },
    {
      name: '混合格式',
      text: `问题标题：**什么是最重要的商业原则？**

请仔细阅读以下内容：

1. 第一个要点：*诚信经营*
2. 第二个要点：**客户至上**
3. 第三个要点：持续创新

请选择正确答案。`
    },
    {
      name: '单行普通文本',
      text: '这是普通的单行文本，没有任何格式'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-macaron-darkGray">题目Markdown格式测试</h1>
      
      {/* 交互式测试区域 */}
      <div className="mb-8 border border-macaron-lightGray rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-macaron-deepLavender">交互式测试</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 题目文本测试 */}
          <div>
            <h3 className="text-md font-medium mb-2 text-macaron-darkGray">题目文本编辑</h3>
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="输入问题内容&#10;&#10;支持Markdown格式：&#10;**加粗文字**&#10;*斜体文字*&#10;&#10;按Enter键可创建空行"
              className="min-h-[150px] mb-3"
              rows={6}
            />
            <p className="text-xs text-gray-500 mb-3">
              支持Markdown格式：**加粗**、*斜体*，按Enter键可创建空行
            </p>
            
            <div className="border border-macaron-lightGray rounded p-4 bg-white">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                渲染效果 (包含Markdown: {containsMarkdown(questionText) ? '✅ 是' : '❌ 否'})
              </h4>
              {containsMarkdown(questionText) ? (
                <QuizMarkdownRenderer>{questionText}</QuizMarkdownRenderer>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }} className="text-macaron-darkGray">
                  {questionText}
                </span>
              )}
            </div>
          </div>
          
          {/* 选项文本测试 */}
          <div>
            <h3 className="text-md font-medium mb-2 text-macaron-darkGray">选项文本编辑</h3>
            <Textarea
              value={optionText}
              onChange={(e) => setOptionText(e.target.value)}
              placeholder="输入选项内容（支持Markdown格式）"
              className="min-h-[150px] mb-3"
              rows={6}
            />
            
            <div className="border border-macaron-lightGray rounded p-4 bg-white">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                渲染效果 (包含Markdown: {containsMarkdown(optionText) ? '✅ 是' : '❌ 否'})
              </h4>
              {containsMarkdown(optionText) ? (
                <QuizMarkdownRenderer>{optionText}</QuizMarkdownRenderer>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }} className="text-macaron-darkGray">
                  {optionText}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 预设测试用例 */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-macaron-deepLavender">预设测试用例</h2>
        
        {testCases.map((testCase, index) => (
          <div key={index} className="border border-macaron-lightGray rounded-lg p-4">
            <h3 className="text-md font-semibold mb-3 text-macaron-deepLavender">
              {index + 1}. {testCase.name}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">原始文本：</h4>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-32">
                  {JSON.stringify(testCase.text)}
                </pre>
                <p className="text-xs text-gray-500 mt-1">
                  包含Markdown: {containsMarkdown(testCase.text) ? '✅ 是' : '❌ 否'}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">渲染效果：</h4>
                <div className="border border-macaron-lightGray rounded p-3 bg-white min-h-[100px]">
                  {containsMarkdown(testCase.text) ? (
                    <QuizMarkdownRenderer>{testCase.text}</QuizMarkdownRenderer>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }} className="text-macaron-darkGray">
                      {testCase.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-macaron-cream/30 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-macaron-deepLavender">功能说明</h2>
        <ul className="list-disc pl-5 text-macaron-darkGray space-y-1">
          <li>题目和选项文本现在支持多行输入</li>
          <li>支持基本Markdown格式：**加粗**、*斜体*</li>
          <li>空行会被正确保留和显示</li>
          <li>包含Markdown语法或空行的文本使用 MarkdownRenderer 渲染</li>
          <li>普通单行文本使用 pre-wrap 样式保持原始格式</li>
        </ul>
      </div>
    </div>
  );
};

export default QuizMarkdownTest;
