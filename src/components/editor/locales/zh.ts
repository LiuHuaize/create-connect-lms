import { locales } from "@blocknote/core";
import type { I18n } from '@blocknote/core';

// 创建中文本地化配置，基于英文字典
export const zhDictionary: Partial<I18n> = {
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
  // 文本格式相关
  'Text Formatting': '文本格式',
  Bold: '粗体',
  Italic: '斜体',
  Underline: '下划线',
  Strikethrough: '删除线',
  Code: '代码',
  'Text Color': '文字颜色',
  'Background Color': '背景颜色',
  
  // 段落格式相关
  'Paragraph Formatting': '段落格式',
  'Normal Text': '正文',
  'Heading 1': '标题1',
  'Heading 2': '标题2',
  'Heading 3': '标题3',
  'Bullet List': '无序列表',
  'Numbered List': '有序列表',
  'Check List': '任务列表',
  'Increase Indent': '增加缩进',
  'Decrease Indent': '减少缩进',
  'Text Alignment': '文字对齐',
  'Align Left': '左对齐',
  'Align Center': '居中对齐',
  'Align Right': '右对齐',
  'Justify': '两端对齐',
  
  // 块操作相关
  'Block Actions': '块操作',
  'Add Block After': '在后面添加块',
  'Add Block Before': '在前面添加块',
  'Duplicate Block': '复制块',
  'Delete Block': '删除块',
  
  // 插入项相关
  Insert: '插入',
  Image: '图片',
  Link: '链接',
  Divider: '分割线',
  'Code Block': '代码块',
  'Edit Link': '编辑链接',
  'Remove Link': '移除链接',
  'Link URL': '链接URL',
  
  // 引用和表格
  Quote: '引用',
  Table: '表格',
  
  // 其他
  Cancel: '取消',
  Apply: '应用',
  None: '无'
}; 