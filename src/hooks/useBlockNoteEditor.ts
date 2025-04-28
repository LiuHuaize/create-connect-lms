import { useEffect, useState, useCallback, useRef } from 'react';
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
  
  // 编辑器容器引用
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  
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
    dictionary: {
      ...zhDictionary,
      placeholders: {
        ...zhDictionary.placeholders,
        // 仅覆盖标题块的占位符为空字符串
        heading: "",
        // 保留default和emptyDocument的默认值，让用户看到提示
        // default: "在此输入文本或输入 '/' 使用命令",
        // emptyDocument: "开始输入...",
      },
    },
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

  // 监听全屏状态变化，在进入全屏时滚动到顶部
  useEffect(() => {
    if (isFullscreen) {
      // 首先滚动整个窗口到顶部
      window.scrollTo(0, 0);
      
      // 添加一个较长的延迟，确保DOM完全渲染
      setTimeout(() => {
        // 尝试多种方法找到可滚动的容器
        
        // 1. 使用editorContainerRef
        if (editorContainerRef.current) {
          const scrollElements = editorContainerRef.current.querySelectorAll('.overflow-auto');
          scrollElements.forEach(element => {
            if (element instanceof HTMLElement) {
              element.scrollTop = 0;
            }
          });
        }
        
        // 2. 查找编辑器相关的容器
        const editorElements = document.querySelectorAll('.bn-container, .bn-editor, [class*="blocknote"]');
        editorElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = 0;
            
            // 查找父级可滚动元素
            let parent = element.parentElement;
            while (parent) {
              if (parent instanceof HTMLElement) {
                const style = window.getComputedStyle(parent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                  parent.scrollTop = 0;
                }
              }
              parent = parent.parentElement;
            }
          }
        });
        
        // 3. 查找页面中所有的overflow: auto/scroll元素
        const allScrollableElements = document.querySelectorAll('[class*="overflow-auto"], [class*="overflow-scroll"]');
        allScrollableElements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.scrollTop = 0;
          }
        });
        
        // 4. 如果编辑器实例存在，尝试聚焦并滚动
        if (editor) {
          editor.focus();
        }
      }, 300);
    }
  }, [isFullscreen, editor]);

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
    setIsFullscreen,
    editorContainerRef
  };
}; 