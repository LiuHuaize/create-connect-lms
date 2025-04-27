import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BlockNoteEditor } from './index';
import { Button } from '@/components/ui/button';

// Define the context type
interface EditorOutletContext {
  onFullscreenChange: (isFullscreen: boolean) => void;
  isFullscreen: boolean;
}

// We no longer need this prop as we'll use the context
// interface BlockNoteEditorTestProps {
//   onEditorFullscreenChange?: (isFullscreen: boolean) => void;
// }

const BlockNoteEditorTest: React.FC = () => {
  const [content, setContent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Get the fullscreen context from the EditorLayout
  const { onFullscreenChange, isFullscreen } = useOutletContext<EditorOutletContext>();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    console.log('编辑器内容已更新:', newContent);
  };

  const handleSave = () => {
    alert('内容已保存!');
    console.log('保存的内容:', content);
  };

  const togglePreview = () => {
    setIsPreviewOpen(prev => !prev);
  };
  
  // Use the context handler
  const handleFullscreenToggle = (isFullscreen: boolean) => {
    onFullscreenChange(isFullscreen);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Hide header when in fullscreen mode */}
      {!isFullscreen && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">BlockNote编辑器测试</h2>
          <Button
            onClick={togglePreview}
            variant="outline"
          >
            {isPreviewOpen ? '关闭预览' : '查看JSON'}
          </Button>
        </div>
      )}
      
      <div className="mb-4">
        <BlockNoteEditor
          initialContent=""
          onChange={handleContentChange}
          placeholder="请在这里输入内容进行测试..."
          onSave={handleSave}
          onFullscreenToggle={handleFullscreenToggle}
        />
      </div>
      
      {isPreviewOpen && !isFullscreen && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">当前内容 (JSON):</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-80 dark:bg-gray-800 dark:text-gray-200">
            {content || '尚无内容'}
          </pre>
        </div>
      )}
    </div>
  );
};

export default BlockNoteEditorTest; 