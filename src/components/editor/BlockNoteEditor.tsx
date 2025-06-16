import React, { useEffect } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { Button } from "@/components/ui/button";
import { Save, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlockNoteEditor } from "@/hooks/useBlockNoteEditor";
import { EditorToolbar } from "./EditorToolbar";

// 定义自定义事件名称常量
export const EDITOR_FULLSCREEN_EVENT = 'editor-fullscreen-change';

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onSave?: () => void;
  readOnly?: boolean;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = '在此输入课程内容...',
  className = '',
  onSave,
  readOnly = false,
  onFullscreenToggle,
}) => {
  // 使用自定义Hook，集中管理编辑器逻辑
  const {
    editor,
    isFullscreen,
    isMobile,
    setIsFullscreen,
    editorContainerRef
  } = useBlockNoteEditor({
    initialContent,
    onChange,
    theme: 'light'
  });

  // 自定义toggleFullscreen函数，确保阻止导航
  const toggleFullscreen = React.useCallback((e?: React.MouseEvent) => {
    // 如果有事件对象，阻止默认行为和冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    setIsFullscreen(prev => !prev);
  }, [setIsFullscreen]);

  // 处理全屏状态变化并通知父组件
  React.useEffect(() => {
    if (onFullscreenToggle) {
      onFullscreenToggle(isFullscreen);
    }

    // 当切换到全屏模式时，确保编辑器获得焦点
    if (isFullscreen && editor) {
      // 增加延迟以确保DOM和编辑器已更新
      setTimeout(() => {
        // 尝试聚焦编辑器
        editor.focus();

        // 确保全屏模式下整个页面滚动到顶部
        window.scrollTo(0, 0);
      }, 200);
    }

    // 派发自定义事件通知应用的其他部分编辑器全屏状态变化
    const event = new CustomEvent(EDITOR_FULLSCREEN_EVENT, {
      detail: { isFullscreen }
    });
    document.dispatchEvent(event);

  }, [isFullscreen, onFullscreenToggle, editor]);

  // 添加鼠标按下事件处理，修复光标位置问题，并避免闪烁
  React.useEffect(() => {
    if (!editor || readOnly) return;

    // 添加对回车键的特殊处理
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        try {
          // 获取当前光标位置
          const cursorPosition = editor.getTextCursorPosition();
          if (!cursorPosition || !cursorPosition.block) return;

          // 简化逻辑：只检查是否可以安全插入块
          // 创建新的空段落
          const newBlock = editor.insertBlocks(
            [{ type: 'paragraph', content: [] }],
            cursorPosition.block,
            'after'
          );

          // 将光标移动到新创建的块
          if (newBlock.length > 0) {
            setTimeout(() => {
              editor.setTextCursorPosition(newBlock[0], 'start');
            }, 0);
          }

          // 阻止默认行为
          e.preventDefault();
        } catch (error) {
          console.error("处理回车键失败:", error);
        }
      }
    };

    // 查找编辑器容器并添加事件监听
    if (editorContainerRef.current) {
      const editorElement = editorContainerRef.current.querySelector('[class*="bn-container"]');
      if (editorElement) {
        editorElement.addEventListener('keydown', handleKeyDown);

        // 返回清理函数
        return () => {
          editorElement.removeEventListener('keydown', handleKeyDown);
        };
      }
    }
  }, [editor, readOnly, editorContainerRef]);

  // 使用额外的useEffect来强制滚动条位置
  useEffect(() => {
    if (isFullscreen) {
      // 确保在完全渲染后执行滚动操作
      const timerId = setTimeout(() => {
        // 获取所有可能的滚动容器并重置它们的滚动位置
        const scrollContainers = document.querySelectorAll('.overflow-auto');
        scrollContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.scrollTop = 0;
          }
        });

        // 滚动主窗口
        window.scrollTo(0, 0);
      }, 300);

      return () => clearTimeout(timerId);
    }
  }, [isFullscreen]);

  // 处理保存操作
  const handleSave = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // 插入分割线
  const insertDivider = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!editor) return;

    console.log("插入分割线按钮被点击");
    try {
      // 获取当前光标位置
      const currentPosition = editor.getTextCursorPosition();
      console.log("当前光标位置:", currentPosition);

      if (currentPosition && currentPosition.block) {
        console.log("在当前位置后插入分割线");
        editor.insertBlocks([{
          type: "divider"
        }], currentPosition.block, "after");
      } else {
        console.log("在文档末尾插入分割线");
        // 如果无法获取当前位置，则在文档末尾插入
        const blocks = editor.document;
        if (blocks.length > 0) {
          editor.insertBlocks([{
            type: "divider"
          }], blocks[blocks.length - 1], "after");
        } else {
          // 如果文档为空，直接插入
          editor.insertBlocks([{
            type: "divider"
          }]);
        }
      }
      console.log("分割线插入完成");
    } catch (error) {
      console.error("插入分割线时出错:", error);
    }
  }, [editor]);

  // 添加自定义样式到文档头
  React.useEffect(() => {
    // 创建样式元素
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      /* 侧边菜单按钮悬停增强样式 */
      .bn-side-menu-button {
        transition: background-color 0.2s ease;
      }
      .bn-side-menu-button:hover {
        background-color: rgba(0, 0, 0, 0.1) !important;
        border-radius: 4px;
      }

      /* 自定义对齐菜单样式 */
      .bn-side-menu-custom {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        overflow: hidden;
        min-width: 120px;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .bn-side-menu-custom button {
        transition: all 0.15s ease;
        font-size: 14px;
      }

      .bn-side-menu-custom button:hover {
        background-color: #f0f0f0 !important;
      }

      .bn-side-menu-custom button[data-alignment="left"]:before {
        content: "⬅️ ";
      }

      .bn-side-menu-custom button[data-alignment="center"]:before {
        content: "↔️ ";
      }

      .bn-side-menu-custom button[data-alignment="right"]:before {
        content: "➡️ ";
      }

      .bn-side-menu-custom button[data-alignment="justify"]:before {
        content: "⬌ ";
      }

      /* 表格样式增强 */
      .bn-container table {
        border-collapse: collapse;
        width: 100%;
        margin: 10px 0;
      }

      .bn-container th, .bn-container td {
        border: 1px solid #e0e0e0;
        padding: 8px;
        transition: background-color 0.2s ease;
      }

      .bn-container th {
        background-color: #f5f5f5;
      }

      .bn-container tr:nth-child(even) {
        background-color: #fafafa;
      }

      /* 文本对齐样式增强 */
      [data-text-alignment="center"] {
        text-align: center;
      }

      [data-text-alignment="right"] {
        text-align: right;
      }

      [data-text-alignment="justify"] {
        text-align: justify;
      }

      /* 分割线样式优化 - 确保在编辑端和展示端都可见 */
      .bn-container .bn-divider-container {
        margin: 16px 0 !important;
        width: 100% !important;
        display: block !important;
      }

      .bn-container .bn-divider {
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        height: 0 !important;
        border-top: 1px solid #9ca3af !important;
        opacity: 0.8 !important;
      }

      /* 更强的选择器确保在编辑模式下也可见 */
      .bn-editor .bn-divider-container,
      [data-node-type="divider"] .bn-divider-container {
        margin: 16px 0 !important;
        width: 100% !important;
        display: block !important;
      }

      .bn-editor .bn-divider,
      [data-node-type="divider"] .bn-divider {
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        height: 0 !important;
        border-top: 1px solid #9ca3af !important;
        opacity: 0.8 !important;
      }

      /* 针对可能的其他分割线元素 */
      [data-content-type="divider"] hr,
      [data-node-type="divider"] hr {
        width: 100% !important;
        margin: 0 !important;
        border: none !important;
        height: 0 !important;
        border-top: 1px solid #9ca3af !important;
        opacity: 0.8 !important;
      }
    `;

    // 添加到文档头
    document.head.appendChild(styleElement);

    // 清理函数
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div
      className={cn(
        "relative border rounded-md transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : "w-full",
        className
      )}
      ref={editorContainerRef}
    >
      {/* 桌面端左上角分割线按钮 */}
      {!isMobile && !readOnly && (
        <div className="absolute top-2 left-2 z-10">
          {/* 分割线按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertDivider}
            aria-label="插入分割线"
            className="hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
            title="点击插入分割线（用于分隔内容）"
          >
            <Minus size={16} className="text-gray-700 dark:text-gray-300" />
            <span className="text-xs text-gray-600 dark:text-gray-400">分割线</span>
          </Button>
        </div>
      )}

      {/* 桌面端右上角保存按钮 */}
      {!isMobile && !readOnly && onSave && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSave}
            aria-label="保存"
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
            title="保存内容"
          >
            <Save size={18} className="text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
      )}

      {/* 编辑器工具栏 */}
      <EditorToolbar
        editor={editor}
        isFullscreen={isFullscreen}
        isMobile={isMobile}
        toggleFullscreen={toggleFullscreen}
      />

      {/* 编辑器主体内容 - 使用固定高度和顶部边距确保"输入文本"提示可见 */}
      <div
        className={cn(
          "w-full overflow-auto",
          // 全屏模式下使用不同的样式，确保编辑器界面固定在可见区域
          isFullscreen
            ? "h-[calc(100vh-60px)] pt-4 px-8"
            : isMobile
              ? "min-h-[250px] pb-12 pl-4"
              : "min-h-[300px] pl-4"
        )}
        style={{
          // 确保内容区域总是从顶部开始显示
          scrollPaddingTop: "60px"
        }}
      >
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          formattingToolbar={true} // 启用格式工具栏以支持文本对齐等功能
          theme={{
            colors: {
              editor: {
                background: "#ffffff",
                text: "#374151"
              },
              menu: {
                background: "#ffffff",
                text: "#374151"
              },
              tooltip: {
                background: "#ffffff",
                text: "#374151"
              },
              hovered: {
                background: "#f3f4f6",
                text: "#1f2937"
              },
              selected: {
                background: "#3b82f6",
                text: "#ffffff"
              },
              border: "#e5e7eb",
              shadow: "rgba(0, 0, 0, 0.05)",
              sideMenu: "#9ca3af"
            },
            borderRadius: 8,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
          }}
        />
      </div>

      {/* 移动设备底部按钮组 */}
      {isMobile && !readOnly && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-end gap-2">
          {/* 分割线按钮 */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertDivider}
            aria-label="插入分割线"
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Minus size={18} className="text-gray-700 dark:text-gray-300" />
            <span className="ml-1 text-xs">分割线</span>
          </Button>

          {/* 保存按钮 */}
          {onSave && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSave}
              aria-label="保存"
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Save size={18} className="text-gray-700 dark:text-gray-300" />
              <span className="ml-1 text-xs">保存</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default BlockNoteEditor;