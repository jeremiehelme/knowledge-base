import { useState, useEffect } from "react";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import SessionSidebar from "./SessionSidebar.jsx";

export default function ChatView({
  messages,
  streaming,
  sessionId,
  userName,
  error,
  onSend,
  onNewConversation,
}) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex h-screen w-full">
      <SessionSidebar
        currentSessionId={sessionId}
        onNewConversation={onNewConversation}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-semibold">Claude Web Chat</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{userName}</span>
            <button
              onClick={() => setDark(!dark)}
              className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {dark ? "light" : "dark"}
            </button>
          </div>
        </header>
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <MessageList messages={messages} />
        <MessageInput onSend={onSend} disabled={streaming} />
      </div>
    </div>
  );
}
