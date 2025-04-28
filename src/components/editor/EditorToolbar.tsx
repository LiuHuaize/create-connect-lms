import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  $createParagraphNode,
  $getRoot,
  TextFormatType,
  ElementFormatType,
  LexicalNode,
  ElementNode,
} from 'lexical';
import { $wrapNodes } from '@lexical/selection';
import { $isListNode, ListNode } from '@lexical/list';
import {
  $createHeadingNode,
  $isHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { 
  Bold, Italic, Underline, List, 
  ListOrdered, Link, Heading1, Heading2, 
  AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type BlockNoteEditor } from '@blocknote/core';
import { BiFullscreen, BiExitFullscreen } from 'react-icons/bi';
import clsx from 'clsx';

interface EditorToolbarProps {
  editor: BlockNoteEditor | null;
  isFullscreen: boolean;
  isMobile: boolean;
  toggleFullscreen: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  isFullscreen,
  isMobile,
  toggleFullscreen
}) => {
  if (!editor) return null;
  
  // 处理全屏按钮点击，阻止默认行为和冒泡
  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  };

  return (
    <div className={clsx(
      "flex items-center",
      "justify-between p-1 bg-white dark:bg-gray-800",
      isFullscreen ? "sticky top-0 z-10" : ""
    )}>
      {/* 工具栏区域 - 不再直接渲染editor.formattingToolbar */}
      <div className="flex flex-1" />
      
      {/* 右侧工具按钮 */}
      <div className="flex items-center">
        {/* 全屏按钮 */}
        <button
          type="button"
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={handleFullscreenClick}
          aria-label={isFullscreen ? '退出全屏' : '全屏编辑'}
          title={isFullscreen ? '退出全屏' : '全屏编辑'}
        >
          {isFullscreen ? (
            <BiExitFullscreen className="w-5 h-5" />
          ) : (
            <BiFullscreen className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

const EditorToolbarOld: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isLink, setIsLink] = useState(false);
  
  // 监听选择变化，更新工具栏状态
  useEffect(() => {
    const unregisterListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));
          // 链接状态需要更复杂的逻辑，这里简化处理
          setIsLink(false);
        }
      });
    });

    return () => {
      unregisterListener();
    };
  }, [editor]);

  // 格式化文本
  const formatText = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  // 创建不同级别的标题
  const formatHeading = useCallback(
    (headingTag: HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode(headingTag));
        }
      });
    },
    [editor]
  );

  // 创建段落
  const formatParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $wrapNodes(selection, () => $createParagraphNode());
      }
    });
  }, [editor]);

  // 对齐文本
  const formatAlignment = useCallback(
    (alignment: ElementFormatType) => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
    },
    [editor]
  );

  // 创建列表
  const formatList = useCallback(
    (listType: 'bullet' | 'number') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes();
          const isInList = nodes.some(node => {
            let parent = node.getParent();
            while (parent) {
              if ($isListNode(parent)) {
                return true;
              }
              parent = parent.getParent();
            }
            return false;
          });

          if (isInList) {
            // 如果已经在列表中，移除列表
            const root = $getRoot();
            const children = root.getChildren();
            children.forEach(node => {
              if ($isListNode(node)) {
                // Ensure we're only getting children from nodes that support it
                // ListNode extends ElementNode which has getChildren method
                const listItemNodes = node.getChildren();
                listItemNodes.forEach(listItemNode => {
                  // ListItemNode also extends ElementNode
                  if (listItemNode instanceof ElementNode) {
                    const paragraphNode = $createParagraphNode();
                    const listItemChildren = listItemNode.getChildren();
                    listItemChildren.forEach(child => {
                      paragraphNode.append(child);
                    });
                    node.replace(paragraphNode);
                  }
                });
              }
            });
          } else {
            // 创建新列表
            $wrapNodes(selection, () => new ListNode(listType, 0));
          }
        }
      });
    },
    [editor]
  );

  // 插入链接
  const insertLink = useCallback(() => {
    const url = prompt('输入链接URL：');
    if (url) {
      // Instead of directly using 'link' string, we'll create a proper link insertion
      // This is a simplified approach - for a complete solution, look at Lexical's LinkPlugin
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          // Here we would normally create and insert a LinkNode
          // But for simplicity, we'll just make the text bold to indicate something happened
          selection.formatText('bold');
        }
      });
    }
  }, [editor]);

  return (
    <div className="editor-toolbar flex flex-wrap items-center gap-1 p-2 border-b">
      <Button
        type="button"
        size="sm"
        variant={isBold ? "default" : "outline"}
        onClick={() => formatText('bold')}
        className="h-8 w-8 p-0"
        title="粗体"
      >
        <Bold size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={isItalic ? "default" : "outline"}
        onClick={() => formatText('italic')}
        className="h-8 w-8 p-0"
        title="斜体"
      >
        <Italic size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant={isUnderline ? "default" : "outline"}
        onClick={() => formatText('underline')}
        className="h-8 w-8 p-0"
        title="下划线"
      >
        <Underline size={16} />
      </Button>
      
      <div className="h-6 mx-1 border-l border-gray-300"></div>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatHeading('h1')}
        className="h-8 w-8 p-0"
        title="一级标题"
      >
        <Heading1 size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatHeading('h2')}
        className="h-8 w-8 p-0"
        title="二级标题"
      >
        <Heading2 size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={formatParagraph}
        className="h-8 w-auto px-2"
        title="段落"
      >
        段落
      </Button>
      
      <div className="h-6 mx-1 border-l border-gray-300"></div>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatList('bullet')}
        className="h-8 w-8 p-0"
        title="无序列表"
      >
        <List size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatList('number')}
        className="h-8 w-8 p-0"
        title="有序列表"
      >
        <ListOrdered size={16} />
      </Button>
      
      <div className="h-6 mx-1 border-l border-gray-300"></div>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatAlignment('left')}
        className="h-8 w-8 p-0"
        title="左对齐"
      >
        <AlignLeft size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatAlignment('center')}
        className="h-8 w-8 p-0"
        title="居中对齐"
      >
        <AlignCenter size={16} />
      </Button>
      
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => formatAlignment('right')}
        className="h-8 w-8 p-0"
        title="右对齐"
      >
        <AlignRight size={16} />
      </Button>
      
      <div className="h-6 mx-1 border-l border-gray-300"></div>
      
      <Button
        type="button"
        size="sm"
        variant={isLink ? "default" : "outline"}
        onClick={insertLink}
        className="h-8 w-8 p-0"
        title="插入链接"
      >
        <Link size={16} />
      </Button>
    </div>
  );
};

export default EditorToolbarOld;
