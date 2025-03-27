import React, { useState, useEffect } from 'react';
import Editor from '@yoopta/editor';
import { HeadingOne, HeadingTwo, HeadingThree } from '@yoopta/headings';
import { Paragraph } from '@yoopta/paragraph';
import { Blockquote } from '@yoopta/blockquote';
import { BulletedList, NumberedList } from '@yoopta/lists';
import { Link } from '@yoopta/link';
import { Code } from '@yoopta/code';
import { Image } from '@yoopta/image';
import { Divider } from '@yoopta/divider';
import { Bold, Italic, Underline, CodeMark } from '@yoopta/marks';
import type { YooptaValue } from '@yoopta/editor';

const extensions = [
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Paragraph,
  Blockquote,
  BulletedList,
  NumberedList,
  Link,
  Code,
  Image,
  Divider,
  Bold,
  Italic,
  Underline,
  CodeMark
];

// Convert markdown to Yoopta JSON format
const convertMarkdownToYoopta = (markdown: string): YooptaValue => {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const content: YooptaValue = [];
  
  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      content.push({
        id: `h1-${index}`,
        type: 'heading-1',
        children: [{ text: line.substring(2) }],
      });
    } else if (line.startsWith('## ')) {
      content.push({
        id: `h2-${index}`,
        type: 'heading-2',
        children: [{ text: line.substring(3) }],
      });
    } else if (line.startsWith('### ')) {
      content.push({
        id: `h3-${index}`,
        type: 'heading-3',
        children: [{ text: line.substring(4) }],
      });
    } else if (line.startsWith('> ')) {
      content.push({
        id: `quote-${index}`,
        type: 'blockquote',
        children: [{ text: line.substring(2) }],
      });
    } else if (line.trim() === '---') {
      content.push({
        id: `divider-${index}`,
        type: 'divider',
        children: [{ text: '' }],
      });
    } else if (line.trim() !== '') {
      // Apply basic formatting
      let processedLine = line;
      
      // Process for bold, italic, etc.
      const boldRegex = /\*\*(.*?)\*\*/g;
      const italicRegex = /\*(.*?)\*/g;
      
      const textParts = [];
      let lastIndex = 0;
      let match;
      
      // Process bold
      while ((match = boldRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) {
          textParts.push({ text: processedLine.substring(lastIndex, match.index) });
        }
        textParts.push({ text: match[1], bold: true });
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < processedLine.length) {
        textParts.push({ text: processedLine.substring(lastIndex) });
      }
      
      content.push({
        id: `p-${index}`,
        type: 'paragraph',
        children: textParts.length > 0 ? textParts : [{ text: line }],
      });
    } else if (content.length > 0 && content[content.length - 1].type === 'paragraph') {
      // Add a line break to the previous paragraph for empty lines
      content.push({
        id: `p-empty-${index}`,
        type: 'paragraph',
        children: [{ text: '' }],
      });
    }
  });
  
  return content;
};

interface YooptaViewerProps {
  content: string;
}

const YooptaViewer: React.FC<YooptaViewerProps> = ({ content }) => {
  const [editorContent, setEditorContent] = useState<YooptaValue>([]);
  
  useEffect(() => {
    setEditorContent(convertMarkdownToYoopta(content));
  }, [content]);
  
  return (
    <div className="bg-white rounded-lg">
      <Editor
        value={editorContent}
        plugins={extensions}
        readOnly={true}
        className="prose max-w-none"
      />
    </div>
  );
};

export default YooptaViewer;
