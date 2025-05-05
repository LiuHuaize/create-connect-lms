import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const CustomEditor: React.FC<CustomEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容...',
  className = '',
  minHeight = '100px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const initialRenderRef = useRef(true);

  // 仅在组件挂载或value从父组件显式更新时更新内容
  useEffect(() => {
    if (editorRef.current) {
      // 跳过第一次渲染后的自动更新，防止光标位置重置
      if (initialRenderRef.current) {
        editorRef.current.innerText = value || '';
        initialRenderRef.current = false;
        setLocalValue(value || '');
      } else if (value !== localValue && !isFocused) {
        // 仅当不是用户正在编辑时才从父组件更新内容
        editorRef.current.innerText = value || '';
        setLocalValue(value || '');
      }
    }
  }, [value]);

  // 处理输入
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const content = (e.target as HTMLDivElement).innerText;
    setLocalValue(content);
    onChange(content);
  };

  // 阻止事件冒泡
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const stopEvents = (e: Event) => {
      e.stopPropagation();
    };

    editor.addEventListener('click', stopEvents, true);
    editor.addEventListener('mousedown', stopEvents, true);
    editor.addEventListener('keydown', stopEvents, true);
    editor.addEventListener('focus', stopEvents, true);
    editor.addEventListener('blur', stopEvents, true);

    return () => {
      editor.removeEventListener('click', stopEvents, true);
      editor.removeEventListener('mousedown', stopEvents, true);
      editor.removeEventListener('keydown', stopEvents, true);
      editor.removeEventListener('focus', stopEvents, true);
      editor.removeEventListener('blur', stopEvents, true);
    };
  }, []);

  // 当点击容器时自动聚焦到编辑区域
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editorRef.current && e.target !== editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    e.stopPropagation();
    setIsFocused(false);
    
    // 确保失去焦点时也能保存更新
    if (editorRef.current) {
      const content = editorRef.current.innerText;
      setLocalValue(content);
      onChange(content);
    }
  };

  return (
    <div 
      className={cn(
        'border rounded-md p-3 custom-editor-container', 
        className
      )}
      onClick={handleContainerClick}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="focus:outline-none w-full custom-editor-area"
        style={{ 
          minHeight,
          cursor: 'text'
        }}
        onInput={handleInput}
        onFocus={(e) => {
          e.stopPropagation();
          setIsFocused(true);
        }}
        onBlur={handleBlur}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default CustomEditor; 