/**
 * Lexical编辑器主题配置
 */
const EditorTheme = {
  // 文本格式化
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'line-through',
    subscript: 'text-xs align-sub',
    superscript: 'text-xs align-super',
    code: 'font-mono bg-gray-100 p-1 rounded',
    highlight: 'bg-yellow-200',
  },

  // 段落样式
  paragraph: 'my-2',

  // 标题样式
  heading: {
    h1: 'text-3xl font-bold my-4',
    h2: 'text-2xl font-bold my-3',
    h3: 'text-xl font-bold my-2',
    h4: 'text-lg font-bold my-2',
    h5: 'text-base font-bold my-1',
    h6: 'text-sm font-bold my-1',
  },

  // 列表样式
  list: {
    ul: 'list-disc ml-5 my-2',
    ol: 'list-decimal ml-5 my-2',
    listitem: 'my-1',
    nested: {
      listitem: 'my-1',
    },
    checklist: 'flex items-center gap-2',
  },

  // 链接样式
  link: 'text-blue-500 underline cursor-pointer',

  // 引用样式
  quote: 'border-l-4 border-gray-300 pl-4 italic my-2',

  // 表格样式
  table: 'border-collapse border border-gray-300 my-4',
  tableCell: 'border border-gray-300 p-2',
  tableRow: 'border-b border-gray-300',

  // 代码块样式
  code: 'font-mono bg-gray-100 p-3 rounded my-2 overflow-auto',

  // 图片样式
  image: 'max-w-full h-auto my-2',

  // 编辑器根元素样式
  root: 'prose max-w-none focus:outline-none',
};

export default EditorTheme; 