import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FileSlideOver({ file, fetchContent, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchContent(file.path).then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, [file.path]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg truncate">{file.title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : content ? (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown>{content.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-red-400">Failed to load file content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
