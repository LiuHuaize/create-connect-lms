import React, { useState } from 'react';
import { BlockNoteEditor } from './index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DividerTest: React.FC = () => {
  const [content, setContent] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 预设的测试内容，包含分割线
  const testContent = JSON.stringify([
    {
      type: "heading",
      props: {
        level: 1,
        textAlignment: "center"
      },
      content: [{ type: "text", text: "分割线功能测试", styles: {} }]
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "这是第一段内容。下面将插入一条分割线。", styles: {} }]
    },
    {
      type: "divider",
      props: {
        style: "solid",
        thickness: "medium",
        color: "gray"
      }
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "这是分割线后的内容。让我们再插入一条不同样式的分割线。", styles: {} }]
    },
    {
      type: "divider",
      props: {
        style: "dashed",
        thickness: "thick",
        color: "blue"
      }
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "这是第二条分割线后的内容。", styles: {} }]
    },
    {
      type: "divider",
      props: {
        style: "dotted",
        thickness: "thin",
        color: "red"
      }
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "最后一段内容。", styles: {} }]
    }
  ]);

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

  const loadTestContent = () => {
    setContent(testContent);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>分割线功能测试</CardTitle>
          <p className="text-sm text-gray-600">
            测试BlockNote编辑器的分割线功能。你可以：
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>输入 "/" 然后选择 "分割线" 来插入分割线</li>
            <li>或者搜索 "divider", "separator", "hr", "line", "分割线", "分隔线", "水平线"</li>
            <li>点击分割线可以选择和删除它</li>
            <li>分割线支持不同的样式、粗细和颜色</li>
          </ul>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button onClick={loadTestContent} variant="outline">
              加载测试内容
            </Button>
            <Button onClick={togglePreview} variant="outline">
              {isPreviewOpen ? '隐藏JSON' : '查看JSON'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>编辑器</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockNoteEditor
            initialContent={content}
            onChange={handleContentChange}
            placeholder="请在这里测试分割线功能。输入 '/' 然后选择分割线..."
            onSave={handleSave}
          />
        </CardContent>
      </Card>
      
      {isPreviewOpen && (
        <Card>
          <CardHeader>
            <CardTitle>当前内容 (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 dark:bg-gray-800 dark:text-gray-200">
              {content || '尚无内容'}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DividerTest;
