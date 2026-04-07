export default function SessionSidebar({ sessions, currentSessionId, onNewConversation, onSelectSession, onDeleteSession }) {
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
        {(sessions || []).map((session) => (
          <div
            key={session.id}
            className={`group flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              session.id === currentSessionId
                ? "bg-gray-200 dark:bg-gray-800 font-medium"
                : ""
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <span className="flex-1 truncate">
              {session.title || new Date(session.created).toLocaleDateString()}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-opacity"
              title="Delete chat"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
