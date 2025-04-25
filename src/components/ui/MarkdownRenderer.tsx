import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  children: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
  return (
    <div className="markdown-content">
      <ReactMarkdown 
        components={{
          // 自定义渲染h1-h6，保持与当前设计一致的样式
          h1: ({ node, ...props }: any) => <h1 className="text-2xl font-bold text-ghibli-deepTeal mb-3" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold text-ghibli-deepTeal mb-3" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold text-ghibli-deepTeal mb-2" {...props} />,
          h4: ({ node, ...props }: any) => <h4 className="text-md font-bold text-ghibli-deepTeal mb-2" {...props} />,
          h5: ({ node, ...props }: any) => <h5 className="text-base font-bold text-ghibli-deepTeal mb-2" {...props} />,
          h6: ({ node, ...props }: any) => <h6 className="text-sm font-bold text-ghibli-deepTeal mb-2" {...props} />,
          // 段落、列表等
          p: ({ node, ...props }: any) => <p className="mb-3 text-ghibli-brown" {...props} />,
          ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-3 text-ghibli-brown" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-3 text-ghibli-brown" {...props} />,
          li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
          // 代码块和内联代码
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? 
              <code className="px-1 py-0.5 bg-gray-100 rounded text-ghibli-brown font-mono text-sm" {...props}>{children}</code> : 
              <pre className="p-3 bg-gray-100 rounded-md overflow-auto mb-3">
                <code className="text-ghibli-brown font-mono text-sm" {...props}>{children}</code>
              </pre>
          },
          // 其他元素
          blockquote: ({ node, ...props }: any) => <blockquote className="pl-4 border-l-4 border-ghibli-sand italic text-ghibli-brown mb-3" {...props} />,
          a: ({ node, ...props }: any) => <a className="text-ghibli-teal hover:underline" {...props} />,
          hr: ({ node, ...props }: any) => <hr className="my-5 border-ghibli-sand/40" {...props} />,
          img: ({ node, ...props }: any) => <img className="max-w-full h-auto rounded my-3" {...props} alt={props.alt || ''} />,
          table: ({ node, ...props }: any) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse" {...props} /></div>,
          th: ({ node, ...props }: any) => <th className="px-3 py-2 border border-ghibli-sand bg-ghibli-cream/40 text-ghibli-deepTeal font-medium" {...props} />,
          td: ({ node, ...props }: any) => <td className="px-3 py-2 border border-ghibli-sand text-ghibli-brown" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 