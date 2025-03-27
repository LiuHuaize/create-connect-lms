import React, { useState, useCallback, useEffect } from 'react';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { locales } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from 'next-themes';

// 创建中文本地化配置，基于英文字典
const zhDictionary = {
  ...locales.en,
  // 覆盖占位符
  placeholders: {
    ...locales.en.placeholders,
    default: "输入文本或键入 '/' 使用命令",
    emptyDocument: "在此输入内容...",
  },
  // 覆盖斜线菜单项
  slash_menu: {
    ...locales.en.slash_menu,
    // 修改标题类项目
    heading: {
      ...locales.en.slash_menu.heading,
      title: "一级标题",
      subtext: "大型章节标题", 
      group: "标题", // 分组名称
    },
    heading_2: {
      ...locales.en.slash_menu.heading_2,
      title: "二级标题",
      subtext: "中型章节标题",
      group: "标题", // 分组名称
    },
    heading_3: {
      ...locales.en.slash_menu.heading_3,
      title: "三级标题",
      subtext: "小型章节标题",
      group: "标题", // 分组名称
    },
    paragraph: {
      ...locales.en.slash_menu.paragraph,
      title: "段落",
      subtext: "文档主体",
      group: "基本块", // 分组名称
    },
    bullet_list: {
      ...locales.en.slash_menu.bullet_list,
      title: "无序列表",
      subtext: "无编号的列表项",
      group: "基本块",
    },
    numbered_list: {
      ...locales.en.slash_menu.numbered_list,
      title: "有序列表",
      subtext: "带编号的列表项",
      group: "基本块",
    },
    check_list: {
      ...locales.en.slash_menu.check_list,
      title: "任务列表",
      subtext: "带复选框的列表",
      group: "基本块",
    },
    table: {
      ...locales.en.slash_menu.table,
      title: "表格",
      subtext: "带可编辑单元格的表格",
      group: "高级", // 分组名称
    },
    code_block: {
      ...locales.en.slash_menu.code_block,
      title: "代码块",
      subtext: "带语法高亮的代码块",
      group: "基本块",
    },
    image: {
      ...locales.en.slash_menu.image,
      title: "图片",
      subtext: "上传图片",
      group: "媒体", // 改为媒体分组
    },
    // 添加媒体相关菜单项
    video: {
      ...locales.en.slash_menu.video,
      title: "视频",
      subtext: "可调整大小的带字幕视频",
      group: "媒体",
    },
    audio: {
      ...locales.en.slash_menu.audio,
      title: "音频",
      subtext: "嵌入式带字幕音频",
      group: "媒体",
    },
    file: {
      ...locales.en.slash_menu.file,
      title: "文件",
      subtext: "嵌入式文件",
      group: "媒体",
    },
    emoji: {
      ...locales.en.slash_menu.emoji,
      title: "表情符号",
      subtext: "搜索并插入表情符号",
      group: "其他",
    }
  },
  // 添加分组名称翻译
  menu_section_labels: {
    media: "媒体",
    others: "其他",
    basic_blocks: "基本块",
    headings: "标题",
    advanced: "高级",
  },
};

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
  
  // 处理本地图片上传
  const handleFileUpload = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // 将文件转换为base64字符串
        const base64String = reader.result as string;
        resolve(base64String);
      };
      reader.readAsDataURL(file);
    });
  };
  
  // 创建BlockNote编辑器实例
  const editor = useCreateBlockNote({
    initialContent: initialContent ? safelyParseContent(initialContent) : undefined,
    uploadFile: handleFileUpload, // 添加图片上传处理函数
    dictionary: zhDictionary, // 添加中文本地化支持
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

  // 检测是否是移动设备
  const [isMobile, setIsMobile] = useState(false);
  
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
      {/* 移动设备将工具栏放在底部 */}
      {!isMobile && (
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
      )}
      
      <div className={cn(
        "w-full h-full overflow-auto",
        isFullscreen ? "p-8 pt-14" : isMobile ? "min-h-[250px] pb-12" : "min-h-[300px]"
      )}>
        <BlockNoteView
          editor={editor}
          theme={editorTheme}
          editable={!readOnly}
        />
      </div>

      {/* 移动设备底部工具栏 */}
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 flex justify-end gap-2">
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
              <span className="ml-1 text-xs">保存</span>
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
            <span className="ml-1 text-xs">{isFullscreen ? "退出全屏" : "全屏"}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlockNoteEditor; 