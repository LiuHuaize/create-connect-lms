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
  // 颜色选择器翻译
  color_picker: {
    text_title: "文本",
    background_title: "背景色",
    colors: {
      default: "默认",
      gray: "灰色",
      brown: "棕色",
      red: "红色",
      orange: "橙色",
      yellow: "黄色",
      green: "绿色",
      blue: "蓝色",
      purple: "紫色",
      pink: "粉色",
    },
  },
  // 工具栏颜色按钮翻译
  formatting_toolbar: {
    ...locales.en.formatting_toolbar,
    bold: {
      tooltip: "加粗",
      secondary_tooltip: "Mod+B",
    },
    italic: {
      tooltip: "斜体",
      secondary_tooltip: "Mod+I",
    },
    underline: {
      tooltip: "下划线",
      secondary_tooltip: "Mod+U",
    },
    strike: {
      tooltip: "删除线",
      secondary_tooltip: "Mod+Shift+S",
    },
    code: {
      tooltip: "代码标记",
      secondary_tooltip: "",
    },
    colors: {
      tooltip: "颜色",
    },
    // 添加文本对齐按钮翻译
    align_left: {
      tooltip: "左对齐文本",
    },
    align_center: {
      tooltip: "居中对齐文本",
    },
    align_right: {
      tooltip: "右对齐文本",
    },
    align_justify: {
      tooltip: "两端对齐文本",
    },
    link: {
      tooltip: "添加链接",
      secondary_tooltip: "Mod+K",
    },
    file_caption: {
      tooltip: "编辑标题",
      input_placeholder: "编辑标题",
    },
    file_replace: {
      tooltip: {
        image: "替换图片",
        video: "替换视频",
        audio: "替换音频",
        file: "替换文件",
      },
    },
    // 添加文件删除按钮翻译
    file_delete: {
      tooltip: {
        image: "删除图片",
        video: "删除视频",
        audio: "删除音频",
        file: "删除文件",
      },
    },
    // 添加链接删除按钮翻译
    delete: {
      tooltip: "移除链接",
    },
  },
  // 添加侧边菜单和拖动手柄翻译
  side_menu: {
    add_block_label: "添加块",
    drag_handle_label: "打开块菜单",
  },
  drag_handle: {
    delete_menuitem: "删除",
    colors_menuitem: "颜色",
    header_row_menuitem: "表头行",
    header_column_menuitem: "表头列",
  },
  // 表格操作翻译
  table_handle: {
    delete_column_menuitem: "删除列",
    delete_row_menuitem: "删除行",
    add_left_menuitem: "左侧添加列",
    add_right_menuitem: "右侧添加列",
    add_above_menuitem: "上方添加行",
    add_below_menuitem: "下方添加行",
    split_cell_menuitem: "拆分单元格",
    merge_cells_menuitem: "合并单元格",
    background_color_menuitem: "背景色",
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
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // 调用父组件的回调函数
    if (onFullscreenToggle) {
      onFullscreenToggle(newFullscreenState);
    }
  }, [isFullscreen, onFullscreenToggle]);

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