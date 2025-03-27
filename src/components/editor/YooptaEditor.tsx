
import React, { useState, useEffect } from 'react';
import Editor from '@yoopta/editor';
import { createHeadingExtension } from '@yoopta/headings';
import { createParagraphExtension } from '@yoopta/paragraph';
import { createBlockquoteExtension } from '@yoopta/blockquote';
import { createBulletedListExtension, createNumberedListExtension } from '@yoopta/lists';
import { createLinkExtension } from '@yoopta/link';
import { createCodeExtension } from '@yoopta/code';
import { createImageExtension } from '@yoopta/image';
import { createDividerExtension } from '@yoopta/divider';
import { createBoldExtension, createItalicExtension, createUnderlineExtension, createCodeMarkExtension } from '@yoopta/marks';
import type { JSONContent } from '@yoopta/editor';

// Define available extensions based on the Yoopta documentation
const extensions = [
  createHeadingExtension(),
  createParagraphExtension(),
  createBlockquoteExtension(),
  createBulletedListExtension(),
  createNumberedListExtension(),
  createLinkExtension(),
  createCodeExtension(),
  createImageExtension(),
  createDividerExtension(),
  createBoldExtension(),
  createItalicExtension(),
  createUnderlineExtension(),
  createCodeMarkExtension(),
];

// Convert markdown to Yoopta JSON format
const convertMarkdownToYoopta = (markdown: string): JSONContent => {
  if (!markdown) return [];
  
  const lines = markdown.split('\n');
  const content: JSONContent = [];
  
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

// Convert Yoopta JSON to markdown format
const convertYooptaToMarkdown = (content: JSONContent): string => {
  if (!content || content.length === 0) return '';
  
  let markdown = '';
  
  content.forEach((node) => {
    if (node.type === 'heading-1') {
      markdown += `# ${node.children?.map(child => child.text).join('') || ''}\n\n`;
    } else if (node.type === 'heading-2') {
      markdown += `## ${node.children?.map(child => child.text).join('') || ''}\n\n`;
    } else if (node.type === 'heading-3') {
      markdown += `### ${node.children?.map(child => child.text).join('') || ''}\n\n`;
    } else if (node.type === 'blockquote') {
      markdown += `> ${node.children?.map(child => child.text).join('') || ''}\n\n`;
    } else if (node.type === 'divider') {
      markdown += `---\n\n`;
    } else if (node.type === 'paragraph') {
      const paragraphText = node.children?.map((child) => {
        let text = child.text || '';
        if (child.bold) text = `**${text}**`;
        if (child.italic) text = `*${text}*`;
        if (child.code) text = '`' + text + '`';
        return text;
      }).join('') || '';
      
      markdown += `${paragraphText}\n\n`;
    } else if (node.type === 'code') {
      markdown += `\`\`\`\n${node.content || ''}\n\`\`\`\n\n`;
    } else if (node.type === 'image') {
      markdown += `![${node.alt || ''}](${node.url || ''})\n\n`;
    }
  });
  
  return markdown.trim();
};

interface YooptaEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const YooptaEditor: React.FC<YooptaEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
}) => {
  const [content, setContent] = useState<JSONContent>([]);
  
  useEffect(() => {
    // Convert initial markdown to Yoopta JSON format
    setContent(convertMarkdownToYoopta(initialValue));
  }, [initialValue]);
  
  const handleEditorChange = (newContent: JSONContent) => {
    setContent(newContent);
    if (onChange) {
      // Convert back to markdown for storage
      const markdown = convertYooptaToMarkdown(newContent);
      onChange(markdown);
    }
  };
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <Editor
        value={content}
        onChange={handleEditorChange}
        plugins={extensions}
        placeholder={placeholder}
        readOnly={readOnly}
        className="min-h-[300px] p-4 focus:outline-none"
      />
    </div>
  );
};

export default YooptaEditor;
