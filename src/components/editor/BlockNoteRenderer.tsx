import React, { useMemo } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor, useCreateBlockNote } from "@blocknote/react";
import "./custom-blocknote.css"; // 保留自定义样式

interface BlockNoteRendererProps {
  content: string;
  className?: string;
}

/**
 * BlockNote富文本渲染组件
 * 用于将BlockNote格式的JSON字符串渲染为富文本视图
 */
const BlockNoteRenderer: React.FC<BlockNoteRendererProps> = ({ content, className }) => {
  // 自定义主题
  const customTheme = {
    colors: {
      editor: {
        text: "#2d3748", // 深灰色文本
        background: "#f8f5f0", // 米色纸张效果背景
      },
      menu: {
        text: "#ffffff",
        background: "#515151",
      },
      tooltip: {
        text: "#ffffff",
        background: "#515151",
      },
      hovered: {
        text: "#222222",
        background: "#eeeeee",
      },
      selected: {
        text: "#ffffff",
        background: "#6a994e", // 淡雅绿色选中效果
      },
      disabled: {
        text: "#cdcdcd",
        background: "#f8f5f0",
      },
      shadow: "#8f8f8f",
      border: "#e2d9c8", // 稍微带点米色的边框
      sideMenu: "#515151",
    },
    borderRadius: 6,
    fontFamily: "Inter, system-ui, sans-serif",
  };

  // 解析内容
  const parsedContent = useMemo(() => {
    try {
      console.log('BlockNoteRenderer - 尝试解析内容，长度:', content?.length);
      console.log('BlockNoteRenderer - 内容开始部分:', content?.substring(0, 50) + '...');
      
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        console.log("BlockNoteRenderer - 成功解析内容为JSON数组, 项目数:", parsed.length);
        return parsed;
      }
      console.warn("BlockNoteRenderer - 内容不是BlockNote期望的数组格式:", typeof parsed);
      return null;
    } catch (e) {
      console.warn("BlockNoteRenderer - 内容不是有效的JSON:", e);
      console.warn("BlockNoteRenderer - 内容预览:", content?.substring(0, 100));
      return null;
    }
  }, [content]);
  
  // 在顶层调用useCreateBlockNote钩子
  const editor = useCreateBlockNote({
    initialContent: parsedContent || [{ type: 'paragraph', content: [] }],
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
      },
      editor: {
        root: {
          className: 'custom-editor-root rounded-lg shadow-sm'
        }
      }
    },
    // 确保内容是只读的
    editable: false
  });

  // 如果解析失败，显示错误信息
  if (!parsedContent) {
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
        theme={customTheme}
      />
    </div>
  );
};

export default BlockNoteRenderer; 