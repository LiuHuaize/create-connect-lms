import { useEffect, useState, useCallback } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { zhDictionary } from "@/components/editor/locales/zh";
import { handleBlockNoteFileUpload } from "@/services/fileUploadService";

interface UseBlockNoteEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  theme?: 'light' | 'dark';
}

export const useBlockNoteEditor = ({
  initialContent = '',
  onChange,
  theme = 'light'
}: UseBlockNoteEditorProps) => {
  // 编辑器全屏状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // 检测移动设备
  const [isMobile, setIsMobile] = useState(false);
  
  // 安全解析内容函数
  const safelyParseContent = (content: string) => {
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
  };
  
  // 创建BlockNote编辑器实例
  const editor = useCreateBlockNote({
    initialContent: initialContent ? safelyParseContent(initialContent) : undefined,
    uploadFile: handleBlockNoteFileUpload, // 使用文件上传服务
    dictionary: zhDictionary, // 使用中文本地化
    // 自定义代码块样式，确保深色主题下代码块背景是白色
    domAttributes: {
      // 为代码块容器添加类名
      codeBlock: {
        code: {
          className: 'bg-white text-gray-900 dark:bg-white dark:text-gray-900'
        }
      }
    }
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

  // 监听窗口大小变化，检测移动设备
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 切换全屏模式 - 修改为避免触发导航操作
  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    // 如果传入了事件，阻止默认行为和冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsFullscreen(prev => !prev);
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

  return {
    editor,
    isFullscreen,
    isMobile,
    toggleFullscreen,
    setIsFullscreen
  };
}; 