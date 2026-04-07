import { useState, useEffect } from "react";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import SessionSidebar from "./SessionSidebar.jsx";

export default function ChatView({
  messages,
  streaming,
  sessionId,
  sessions,
  userName,
  error,
  onSend,
  onNewConversation,
  onSelectSession,
  onDeleteSession,
  onLogout,
}) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex h-screen w-full">
      <SessionSidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onNewConversation={onNewConversation}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-semibold">Claude Web Chat</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark(!dark)}
              className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {dark ? "light" : "dark"}
            </button>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {userName}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 z-20 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg py-1">
                    <button
                      onClick={onLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
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
