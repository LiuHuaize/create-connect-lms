import React, { useState, useRef, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

// 导入节点类型
import { LinkNode } from '@lexical/link';
import { ListNode, ListItemNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';

// 导入自定义组件
import EditorToolbar from '@/components/editor/EditorToolbar';
import EditorTheme from '@/components/editor/EditorTheme';

// UI组件
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface LexicalEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

const LexicalEditor: React.FC<LexicalEditorProps> = ({
  initialContent,
  onChange,
  placeholder = '在此输入课程内容...',
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // 处理编辑器内容变化
  const handleEditorChange = useCallback(
    (editorState: any) => {
      if (onChange) {
        // 将编辑器状态转换为JSON字符串
        const editorStateJSON = editorState.toJSON();
        onChange(JSON.stringify(editorStateJSON));
      }
    },
    [onChange]
  );

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

  // 编辑器配置
  const initialConfig = {
    namespace: 'ConnectLmsEditor',
    theme: EditorTheme,
    onError: (error: Error) => {
      console.error('编辑器错误:', error);
    },
    // 注册所需的节点类型 - 这很重要！
    nodes: [
      LinkNode,
      ListNode,
      ListItemNode,
      HeadingNode,
      QuoteNode
    ]
  };

  return (
    <div 
      ref={editorContainerRef}
      className={`editor-container border rounded-md transition-all duration-300 ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-white overflow-auto p-6' 
          : 'relative w-full'
      }`}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <div className="editor-inner">
          <EditorToolbar />
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 z-10"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "退出全屏" : "全屏编辑"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
          
          <div className={`editor-content-area ${isFullscreen ? 'mt-16 h-[calc(100vh-120px)]' : 'h-[300px]'}`}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable 
                  className="editor-input min-h-[250px] px-4 py-3 focus:outline-none overflow-auto prose max-w-none"
                />
              }
              placeholder={<div className="editor-placeholder text-gray-400">{placeholder}</div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleEditorChange} />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <LinkPlugin />
            <ListPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
};

export default LexicalEditor; 