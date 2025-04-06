import React, { useMemo } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "./custom-blocknote.css"; // 引入自定义样式

interface BlockNoteRendererProps {
  content: string;
  className?: string;
}

/**
 * BlockNote富文本渲染组件
 * 用于将BlockNote格式的JSON字符串渲染为富文本视图
 */
const BlockNoteRenderer: React.FC<BlockNoteRendererProps> = ({ content, className }) => {
  // 创建只读编辑器
  const editor = useMemo(() => {
    try {
      // 尝试解析内容
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
        console.log("成功解析内容为JSON:", typeof parsedContent, Array.isArray(parsedContent));
      } catch (e) {
        console.warn("内容不是有效的JSON:", e);
        return null;
      }

      // 确保内容是数组格式
      if (!Array.isArray(parsedContent)) {
        console.warn("内容不是BlockNote期望的数组格式:", parsedContent);
        return null;
      }

      // 创建编辑器实例
      return useCreateBlockNote({
        initialContent: parsedContent,
        // 自定义代码块样式，确保深色主题下代码块背景是白色
        domAttributes: {
          // 为代码块容器添加类名
          codeBlock: {
            code: {
              className: 'bg-white text-gray-900 dark:bg-white dark:text-gray-900 preview-code-block'
            },
            container: {
              className: 'bg-white border border-gray-200 dark:border-gray-700 preview-code-container'
            }
          }
        },
        // 确保内容是只读的
        editable: false
      });
    } catch (error) {
      console.error("创建BlockNote编辑器失败:", error);
      return null;
    }
  }, [content]);

  // 如果没有编辑器实例，显示错误信息
  if (!editor) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded text-yellow-800">
        <p className="font-medium">无法渲染内容</p>
        <p className="text-sm">内容格式不兼容或无效</p>
      </div>
    );
  }

  return (
    <div className={`${className} preview-mode`}>
      <BlockNoteView 
        editor={editor} 
        editable={false}
        theme="light"
      />
    </div>
  );
};

export default BlockNoteRenderer; 