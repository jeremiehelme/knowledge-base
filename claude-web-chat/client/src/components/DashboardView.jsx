import { useState, useEffect } from "react";

export default function DashboardView({ files, loading, fetchFiles, sessions, onNavigate, onSendMessage }) {
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const recentFiles = files.slice(0, 5);
  const recentSessions = sessions.slice(0, 5);

  function handlePromptSubmit(e) {
    e.preventDefault();
    if (!promptText.trim()) return;
    onSendMessage(promptText.trim());
    setPromptText("");
  }

  function handleFileClick(file) {
    if (file.type === "web" && file.url) {
      window.open(file.url, "_blank");
    } else {
      onNavigate("files");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Recent Files */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Files</h2>
            <button
              onClick={() => onNavigate("files")}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              View all
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : recentFiles.length === 0 ? (
            <p className="text-sm text-gray-400">No files yet. Add documents via chat.</p>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleFileClick(file)}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.title}</p>
                    <div className="flex gap-1 mt-1">
                      {file.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{file.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Conversations</h2>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onNavigate(`chat/${session.id}`)}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <p className="text-sm font-medium truncate flex-1">{session.title || "Untitled"}</p>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {new Date(session.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ask the CEO prompt */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Ask the CEO</h2>
        <form onSubmit={handlePromptSubmit} className="flex gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="What would you like to discuss?"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!promptText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
