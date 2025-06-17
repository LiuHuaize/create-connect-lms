import React from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { customSchema } from "@/components/editor/customSchema";
import "@blocknote/mantine/style.css";
import "../editor/custom-blocknote.css";

/**
 * BlockNote主题测试组件
 * 用于验证在不同系统主题下BlockNote是否始终使用light主题
 */
const BlockNoteThemeTest: React.FC = () => {
  const editor = useCreateBlockNote({
    schema: customSchema,
    initialContent: [
      {
        type: "heading",
        props: {
          level: 1,
          textAlignment: "center"
        },
        content: "BlockNote主题测试"
      },
      {
        type: "paragraph",
        content: "这是一个测试页面，用于验证BlockNote编辑器在不同系统主题下的显示效果。"
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "无论你的系统是",
            styles: {}
          },
          {
            type: "text", 
            text: "深色模式",
            styles: { bold: true }
          },
          {
            type: "text",
            text: "还是",
            styles: {}
          },
          {
            type: "text",
            text: "浅色模式",
            styles: { bold: true }
          },
          {
            type: "text",
            text: "，这个编辑器都应该显示为浅色主题，文字清晰可读。",
            styles: {}
          }
        ]
      },
      {
        type: "paragraph",
        content: "如果你在Edge浏览器中看到文字模糊或颜色异常，说明主题修复还需要进一步调整。"
      },
      {
        type: "divider"
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "测试要点：",
            styles: { bold: true, textColor: "blue" }
          }
        ]
      },
      {
        type: "bulletListItem",
        content: "文字应该是深灰色，背景是白色"
      },
      {
        type: "bulletListItem", 
        content: "菜单和工具栏应该是白色背景"
      },
      {
        type: "bulletListItem",
        content: "选中文字时应该有蓝色高亮"
      },
      {
        type: "bulletListItem",
        content: "在Edge和Chrome中显示效果应该一致"
      }
    ]
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">BlockNote主题测试页面</h1>
        <p className="text-gray-600">
          这个页面用于测试BlockNote编辑器的主题修复是否生效。
          请在不同浏览器（特别是Edge）中查看效果。
        </p>
      </div>
      
      <div className="border rounded-lg p-4 bg-white">
        <BlockNoteView 
          editor={editor} 
          theme="light"
          formattingToolbar={true}
        />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">系统信息：</h3>
        <p className="text-sm text-gray-600">
          当前用户代理: {navigator.userAgent}
        </p>
        <p className="text-sm text-gray-600">
          系统主题偏好: {window.matchMedia('(prefers-color-scheme: dark)').matches ? '深色' : '浅色'}
        </p>
      </div>
    </div>
  );
};

export default BlockNoteThemeTest;
