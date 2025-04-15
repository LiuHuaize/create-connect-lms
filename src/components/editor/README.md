# BlockNoteEditor组件重构建议

## 当前问题

`BlockNoteEditor.tsx`组件过于庞大（约462行），包含了多种职责：
1. 本地化配置
2. 编辑器初始化
3. 编辑器UI渲染
4. 文件上传处理
5. 全屏模式管理
6. 主题集成

## 重构方案

### 1. 拆分本地化配置

将中文本地化字典提取到单独的文件中：

```
src/components/editor/locales/zh.ts
```

### 2. 拆分功能组件

将大型组件拆分为更小的功能组件：

1. **EditorToolbar.tsx** - 处理编辑器工具栏
2. **EditorContent.tsx** - 处理主要编辑区域
3. **FileUploadHandler.tsx** - 处理文件上传逻辑
4. **FullscreenToggle.tsx** - 处理全屏模式切换

### 3. 创建自定义Hook

抽取业务逻辑到自定义Hook中：

1. **useBlockNoteEditor.ts** - 处理编辑器初始化和主要逻辑
2. **useFileUpload.ts** - 处理文件上传逻辑
3. **useAutoSave.ts** - 处理自动保存功能

### 4. 目录结构

重构后的目录结构：

```
src/components/editor/
├── BlockNoteEditor.tsx              # 主组件（较小）
├── EditorToolbar.tsx                # 工具栏组件
├── EditorContent.tsx                # 编辑区域组件
├── FullscreenToggle.tsx             # 全屏切换组件
├── FileUploadHandler.tsx            # 文件上传处理
│
├── hooks/
│   ├── useBlockNoteEditor.ts        # 编辑器逻辑
│   ├── useFileUpload.ts             # 文件上传逻辑
│   └── useAutoSave.ts               # 自动保存逻辑
│
├── locales/
│   ├── zh.ts                        # 中文本地化
│   └── index.ts                     # 本地化导出
│
└── utils/
    ├── formatters.ts                # 格式化工具
    └── validators.ts                # 验证工具
```

### 5. 重构后主组件示例

```tsx
import React from 'react';
import { useBlockNoteEditor } from './hooks/useBlockNoteEditor';
import EditorToolbar from './EditorToolbar';
import EditorContent from './EditorContent';
import FullscreenToggle from './FullscreenToggle';
import { cn } from "@/lib/utils";

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
  const {
    editor,
    isFullscreen,
    setIsFullscreen,
    handleSave,
    handleFileUpload
  } = useBlockNoteEditor({
    initialContent,
    onChange,
    onSave,
    onFullscreenToggle,
    readOnly
  });

  // 安全检查
  if (!editor) return <div>加载编辑器中...</div>;

  return (
    <div className={cn(
      "flex flex-col border rounded-md overflow-hidden",
      isFullscreen ? "fixed inset-0 z-50 bg-white" : "relative",
      className
    )}>
      <EditorToolbar 
        editor={editor} 
        isFullscreen={isFullscreen}
        onSave={handleSave}
        onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
      />
      
      <EditorContent 
        editor={editor}
        placeholder={placeholder}
        readOnly={readOnly}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default BlockNoteEditor;
```

## 重构优势

1. **提高可读性**: 每个组件和文件都有明确的单一职责
2. **易于维护**: 更小的组件更容易理解和修改
3. **更好的测试**: 分离的逻辑更容易进行单元测试
4. **提高性能**: 组件更小，重渲染范围减少
5. **代码重用**: 抽取的hooks可以在其他地方重用

## 重构步骤

1. 首先提取本地化配置
2. 创建自定义hooks，提取业务逻辑
3. 创建子组件
4. 重构主组件，使用新创建的组件和hooks
5. 进行适当测试，确保功能一致 