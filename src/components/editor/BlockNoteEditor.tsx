import React from 'react';
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
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
    setIsFullscreen
  } = useBlockNoteEditor({
    initialContent,
    onChange,
    theme: 'light'
  });

  // 创建一个ref来引用编辑器内容区域
  const editorContentRef = React.useRef<HTMLDivElement>(null);

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
    
    // 当切换到全屏模式时，确保编辑器获得焦点并滚动到顶部
    if (isFullscreen && editor) {
      // 增加延迟以确保DOM和编辑器已更新
      setTimeout(() => {
        // 尝试聚焦编辑器
        editor.focus();
        
        // 如果有内容区域ref，滚动到顶部
        if (editorContentRef.current) {
          editorContentRef.current.scrollTop = 0; // 使用scrollTop直接设置
        }
      }, 200); // 增加延迟到 200ms
    }
    
    // 派发自定义事件通知应用的其他部分编辑器全屏状态变化
    const event = new CustomEvent(EDITOR_FULLSCREEN_EVENT, { 
      detail: { isFullscreen } 
    });
    document.dispatchEvent(event);
    
  }, [isFullscreen, onFullscreenToggle, editor]);

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
      
      {/* 编辑器主体内容 */}
      <div 
        ref={editorContentRef}
        className={cn(
          "w-full h-full overflow-auto",
          // 全屏模式增加整体padding，非全屏模式增加左侧padding给side menu留空间
          isFullscreen ? "p-8 pt-6" : 
          isMobile ? "min-h-[250px] pb-12 pl-10" : "min-h-[300px] pl-10"
        )}
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