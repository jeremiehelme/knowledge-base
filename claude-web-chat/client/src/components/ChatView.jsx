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
}) {
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
