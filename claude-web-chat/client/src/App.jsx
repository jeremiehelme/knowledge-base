import { useState, useEffect } from "react";
import useWebSocket from "./hooks/useWebSocket.js";
import useRouter from "./hooks/useRouter.js";
import useFiles from "./hooks/useFiles.js";
import LoginScreen from "./components/LoginScreen.jsx";
import AppShell from "./components/AppShell.jsx";
import DashboardView from "./components/DashboardView.jsx";
import FilesView from "./components/FilesView.jsx";
import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("claude-chat-token"));
  const ws = useWebSocket(token);
  const { route, navigate } = useRouter();
  const filesApi = useFiles(token);

  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  function handleLogin(newToken) {
    localStorage.setItem("claude-chat-token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("claude-chat-token");
    setToken(null);
  }

  function handleDashboardSend(text) {
    ws.newConversation();
    navigate("chat");
    setTimeout(() => ws.sendMessage(text), 100);
  }

  function handleNavigate(path) {
    if (path.startsWith("chat/")) {
      const sessionId = path.slice(5);
      ws.resumeConversation(sessionId);
    }
    navigate(path);
  }

  if (!token || ws.error === "Invalid token" || (ws.connected && !ws.authenticated)) {
    return <LoginScreen onLogin={handleLogin} error={ws.error} />;
  }

  if (!ws.connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Connecting...</p>
      </div>
    );
  }

  function renderView() {
    switch (route.name) {
      case "files":
        return (
          <FilesView
            files={filesApi.files}
            loading={filesApi.loading}
            fetchFiles={filesApi.fetchFiles}
            fetchFileContent={filesApi.fetchFileContent}
            deleteFile={filesApi.deleteFile}
          />
        );
      case "chat":
        return (
          <ChatView
            messages={ws.messages}
            streaming={ws.streaming}
            sessionId={ws.sessionId}
            sessions={ws.sessions}
            error={ws.error}
            onSend={ws.sendMessage}
            onNewConversation={ws.newConversation}
            onSelectSession={(id) => handleNavigate(`chat/${id}`)}
            onDeleteSession={ws.deleteConversation}
          />
        );
      default:
        return (
          <DashboardView
            files={filesApi.files}
            loading={filesApi.loading}
            fetchFiles={filesApi.fetchFiles}
            sessions={ws.sessions}
            onNavigate={handleNavigate}
            onSendMessage={handleDashboardSend}
          />
        );
    }
  }

  return (
    <AppShell
      currentRoute={route.name}
      onNavigate={handleNavigate}
      userName={ws.userName}
      onLogout={handleLogout}
    >
      {renderView()}
    </AppShell>
  );
}
