import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface QuizMarkdownRendererProps {
  children: string;
}

const QuizMarkdownRenderer: React.FC<QuizMarkdownRendererProps> = ({ children }) => {
  return (
    <div className="quiz-markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          // 自定义渲染h1-h6，使用macaron主题颜色
          h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-macaron-deepLavender mb-3" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-macaron-deepLavender mb-3" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-macaron-deepLavender mb-2" {...props} />,
          h4: ({ node, ...props }: any) => <h4 className="text-md font-bold text-macaron-deepLavender mb-2" {...props} />,
          h5: ({ node, ...props }: any) => <h5 className="text-base font-bold text-macaron-deepLavender mb-2" {...props} />,
          h6: ({ node, ...props }: any) => <h6 className="text-sm font-bold text-macaron-deepLavender mb-2" {...props} />,
          // 段落、列表等，使用macaron主题颜色
          p: ({ node, ...props }: any) => <p className="mb-3 text-macaron-darkGray" {...props} />,
          ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-3 text-macaron-darkGray" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-3 text-macaron-darkGray" {...props} />,
          li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
          // 加粗和斜体，使用更明显的样式
          strong: ({ node, ...props }: any) => <strong className="font-bold text-macaron-darkGray" {...props} />,
          em: ({ node, ...props }: any) => <em className="italic text-macaron-darkGray" {...props} />,
          // 代码块和内联代码
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? 
              <code className="px-1 py-0.5 bg-macaron-cream/50 rounded text-macaron-darkGray font-mono text-sm" {...props}>{children}</code> : 
              <pre className="p-3 bg-macaron-cream/50 rounded-md overflow-auto mb-3">
                <code className="text-macaron-darkGray font-mono text-sm" {...props}>{children}</code>
              </pre>
          },
          // 其他元素，使用macaron主题颜色
          blockquote: ({ node, ...props }: any) => <blockquote className="pl-4 border-l-4 border-macaron-lavender italic text-macaron-darkGray mb-3" {...props} />,
          a: ({ node, ...props }: any) => <a className="text-macaron-deepLavender hover:underline" {...props} />,
          hr: ({ node, ...props }: any) => <hr className="my-5 border-macaron-lightGray" {...props} />,
          img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded my-3" {...props} alt={props.alt || ''} />,
          table: ({ node, ...props }: any) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse" {...props} /></div>,
          th: ({ node, ...props }: any) => <th className="px-3 py-2 border border-macaron-lightGray bg-macaron-cream/40 text-macaron-deepLavender font-medium" {...props} />,
          td: ({ node, ...props }: any) => <td className="px-3 py-2 border border-macaron-lightGray text-macaron-darkGray" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default QuizMarkdownRenderer;
