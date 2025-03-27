import React, { useState, useCallback, useEffect } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

interface BlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onSave?: () => void;
  readOnly?: boolean;
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  initialContent = '',
  onChange,
  placeholder = '在此输入课程内容...',
  className = '',
  onSave,
  readOnly = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme } = useTheme();
  
  // 安全解析内容函数
  function safelyParseContent(content: string) {
    // 如果是空字符串，直接返回默认块
    if (!content.trim()) {
      return [
        {
          type: "paragraph",
          content: ""
        }
      ];
    }
    
    try {
      // 尝试作为JSON解析
      return JSON.parse(content);
    } catch (e) {
      // 如果不是有效的JSON，那么创建一个默认段落块
      console.warn('初始内容不是有效的JSON格式，将创建默认段落块');
      return [
        {
          type: "paragraph",
          content: content
        }
      ];
    }
  }
  
  // 创建BlockNote编辑器实例
  const editor = useCreateBlockNote({
    initialContent: initialContent ? safelyParseContent(initialContent) : undefined,
  });

  // 处理编辑器内容变化
  useEffect(() => {
    if (onChange && editor) {
      // 创建一个处理变化的函数
      const handleChange = () => {
        const content = JSON.stringify(editor.document);
        onChange(content);
      };
      
      // 使用onChange方法，这会在每次内容变化时自动触发
      const unsubscribe = editor.onChange(handleChange);
      
      // 返回清理函数
      return unsubscribe;
    }
  }, [editor, onChange]);

  // 切换全屏模式
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 监听ESC键，用于退出全屏模式
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isFullscreen]);

  // 处理保存操作
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
    }
  }, [onSave]);

  // 根据主题确定编辑器主题
  const editorTheme = theme === 'dark' ? 'dark' : 'light';

  return (
    <div 
      className={cn(
        "relative border rounded-md transition-all duration-300",
        isFullscreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-900" : "w-full", 
        className
      )}
    >
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {!readOnly && onSave && (
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
        )}
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "退出全屏" : "全屏编辑"}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isFullscreen ? 
            <Minimize2 size={18} className="text-gray-700 dark:text-gray-300" /> : 
            <Maximize2 size={18} className="text-gray-700 dark:text-gray-300" />
          }
        </Button>
      </div>
      
      <div className={cn(
        "w-full h-full overflow-auto",
        isFullscreen ? "p-8 pt-14" : "min-h-[300px]"
      )}>
        <BlockNoteView
          editor={editor}
          theme={editorTheme}
          editable={!readOnly}
        />
      </div>
    </div>
  );
};

export default BlockNoteEditor; 