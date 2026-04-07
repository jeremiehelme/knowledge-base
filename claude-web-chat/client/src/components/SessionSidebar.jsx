import { useState, useEffect } from "react";

const STORAGE_KEY = "claude-web-chat-sessions";

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function SessionSidebar({ currentSessionId, onNewConversation }) {
  const [sessions, setSessions] = useState(loadSessions);

  useEffect(() => {
    if (!currentSessionId) return;
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === currentSessionId);
      let updated;
      if (exists) {
        updated = prev.map((s) =>
          s.id === currentSessionId ? { ...s, lastUsed: Date.now() } : s
        );
      } else {
        updated = [{ id: currentSessionId, created: Date.now(), lastUsed: Date.now() }, ...prev];
      }
      saveSessions(updated);
      return updated;
    });
  }, [currentSessionId]);

  return (
    <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      <div className="p-3">
        <button
          onClick={onNewConversation}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
        >
          + New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`w-full text-left px-3 py-2 text-sm truncate ${
              session.id === currentSessionId
                ? "bg-gray-200 dark:bg-gray-800 font-medium"
                : ""
            }`}
          >
            {new Date(session.created).toLocaleDateString()}{" "}
            {new Date(session.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        ))}
      </div>
    </div>
  );
}
