import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import SessionSidebar from "./SessionSidebar.jsx";

export default function ChatView({
  messages,
  streaming,
  sessionId,
  sessions,
  error,
  onSend,
  onNewConversation,
  onSelectSession,
  onDeleteSession,
  agents,
  selectedAgent,
  onSelectAgent,
}) {
  function handleAgentChange(agentId) {
    onSelectAgent(agentId);
    onNewConversation();
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <SessionSidebar
        sessions={sessions}
        currentSessionId={sessionId}
        onNewConversation={onNewConversation}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
      />
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <label className="text-xs text-gray-500 dark:text-gray-400">Agent:</label>
          <select
            value={selectedAgent || "advisor"}
            onChange={(e) => handleAgentChange(e.target.value)}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(agents || []).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <MessageList messages={messages} />
        <MessageInput onSend={(text) => onSend(text, selectedAgent)} disabled={streaming} />
      </div>
    </div>
  );
}
