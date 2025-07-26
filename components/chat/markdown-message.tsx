import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold mb-2 mt-4 text-gray-900">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold mb-2 mt-3 text-gray-900">{children}</h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-semibold mb-2 mt-3 text-gray-900">{children}</h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-semibold mb-2 mt-3 text-gray-900">{children}</h6>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-gray-800">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-800">{children}</em>
  ),
  code: ({ children, className }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ) : (
      <code className="bg-transparent p-0 text-gray-100">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 text-gray-700 italic">{children}</blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside mb-4 ml-6 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside mb-4 ml-6 space-y-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-gray-800 mb-3 leading-relaxed">{children}</li>
  ),
  a: ({ children, href }) => (
    <a href={href} className="text-blue-600 hover:text-blue-800 underline transition-colors">{children}</a>
  ),
  hr: () => <hr className="border-gray-300 my-6" />,
  table: ({ children }) => (
    <table className="w-full border-collapse border border-gray-300 mb-4">{children}</table>
  ),
  th: ({ children }) => (
    <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-300 px-4 py-2">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="even:bg-gray-50">{children}</tr>
  )
};

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export default function MarkdownMessage({ content, className = "" }: MarkdownMessageProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
} 