import React, { useState } from 'react';
import { LexicalEditor } from './index';

const TextEditorTest: React.FC = () => {
  const [content, setContent] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    console.log('编辑器内容已更新:', newContent);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Lexical编辑器测试</h2>
      <div className="mb-4">
        <LexicalEditor
          initialContent=""
          onChange={handleContentChange}
          placeholder="请在这里输入内容进行测试..."
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">当前内容 (JSON):</h3>
        <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default TextEditorTest; 