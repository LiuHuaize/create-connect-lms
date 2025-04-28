import React, { useEffect } from 'react';
import { TextLessonContent as TextLessonContentType } from '@/types/course';
import BlockNoteRenderer from '@/components/editor/BlockNoteRenderer';

interface TextLessonContentProps {
  content: TextLessonContentType;
}

const TextLessonContent: React.FC<TextLessonContentProps> = ({ content }) => {
  // 添加useEffect监听内容变化
  useEffect(() => {
    console.log('TextLessonContent - 内容已更新:', content?.text?.substring(0, 50) + '...');
  }, [content]);

  if (!content?.text) {
    console.log('TextLessonContent - 内容为空');
    return <p>此课时暂无内容</p>;
  }

  try {
    const text = content.text;
    console.log('TextLessonContent - 尝试渲染内容类型:', 
      text.trim().startsWith('[') ? 'BlockNote格式' : '其他格式');
    
    // 检查是否可能是BlockNote格式
    if (text.trim().startsWith('[')) {
      try {
        // 尝试使用专用渲染组件
        return <BlockNoteRenderer content={text} />;
      } catch (error) {
        console.error('BlockNote渲染失败:', error);
      }
    }
    
    // 如果不是BlockNote格式或渲染失败，尝试其他格式解析
    try {
      // 尝试解析文本内容
      const parsed = JSON.parse(text);
      // 检查是否是数组
      if (Array.isArray(parsed)) {
        console.log('TextLessonContent - 成功解析为数组格式, 长度:', parsed.length);
        const paragraphs = parsed.map((block: any, index: number) => {
          if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
            return (
              <p key={index}>
                {block.content.map((item: any) => item.text || '').join('')}
              </p>
            );
          }
          return null;
        });
        return <>{paragraphs}</>;
      } else {
        // 如果不是预期的格式，直接显示文本
        console.log('TextLessonContent - 内容为非数组JSON格式');
        return <p>{text}</p>;
      }
    } catch (error) {
      // 解析失败时,直接显示原始文本
      console.error('解析文本内容失败:', error);
      return <p>{text}</p>;
    }
  } catch (error) {
    console.error('处理课程内容失败:', error);
    return <p>内容无法显示</p>;
  }
};

export default TextLessonContent; 