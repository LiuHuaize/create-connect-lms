import React, { useEffect } from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
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

    // 处理编辑器mousedown事件
    const handleEditorMouseDown = (e: MouseEvent) => {
      // 获取点击的元素
      const target = e.target as HTMLElement;
      
      // 检查是否点击在编辑区域内部（排除工具栏等UI元素）
      const isEditableArea = !!target.closest('[contenteditable="true"]');
      if (!isEditableArea) return;
      
      // 找到编辑器内容区域，准备临时隐藏
      const contentArea = editorContainerRef.current?.querySelector('.bn-container') as HTMLElement | null;
      if (!contentArea) return;
      
      // 临时存储原有的opacity值
      const originalOpacity = contentArea.style.opacity;
      
      // 临时使编辑器透明，避免用户看到光标闪烁
      contentArea.style.opacity = '0';
      
      // 使用setTimeout让默认的光标定位先发生
      setTimeout(() => {
        try {
          // 获取当前光标位置
          const cursorPosition = editor.getTextCursorPosition();
          if (cursorPosition && cursorPosition.block) {
            // 将光标设置到当前块的末尾
            editor.setTextCursorPosition(cursorPosition.block, "end");
          }
          // 恢复编辑器可见性
          contentArea.style.opacity = originalOpacity;
        } catch (error) {
          // 发生错误时仍然恢复可见性
          contentArea.style.opacity = originalOpacity;
          console.error("设置光标位置失败:", error);
        }
      }, 10); // 稍微增加延时以确保默认处理完成
    };

    // 查找编辑器容器并添加mousedown事件监听
    if (editorContainerRef.current) {
      const editorElement = editorContainerRef.current.querySelector('[class*="bn-container"]');
      if (editorElement) {
        editorElement.addEventListener('mousedown', handleEditorMouseDown);
        
        // 返回清理函数
        return () => {
          editorElement.removeEventListener('mousedown', handleEditorMouseDown);
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

  return (
    <div 
      className={cn(
        "relative border rounded-md transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : "w-full", 
        className
      )}
      ref={editorContainerRef}
    >
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
              ? "min-h-[250px] pb-12 pl-10" 
              : "min-h-[300px] pl-10"
        )}
        style={{ 
          // 确保内容区域总是从顶部开始显示
          scrollPaddingTop: "60px"
        }}
      >
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          formattingToolbar={false} // 禁用内部工具栏
        />
      </div>

      {/* 移动设备底部保存按钮 */}
      {isMobile && !readOnly && onSave && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-end">
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
        </div>
      )}
    </div>
  );
};

export default BlockNoteEditor; 