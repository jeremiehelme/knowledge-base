import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function scrollToBottom() {
    userScrolledUpRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          Send a message to start chatting with Claude
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text || (msg.streaming ? "..." : "")}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{msg.text}</p>
            )}
            {msg.streaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
