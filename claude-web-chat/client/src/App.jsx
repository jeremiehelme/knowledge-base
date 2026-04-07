import { useState } from "react";
import useWebSocket from "./hooks/useWebSocket.js";
import LoginScreen from "./components/LoginScreen.jsx";
import ChatView from "./components/ChatView.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("claude-chat-token"));
  const ws = useWebSocket(token);

  function handleLogin(newToken) {
    localStorage.setItem("claude-chat-token", newToken);
    setToken(newToken);
  }

  if (!token || (ws.connected && !ws.authenticated)) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        error={ws.error}
      />
    );
  }

  if (!ws.connected) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Connecting...</p>
      </div>
    );
  }

  return (
    <ChatView
      messages={ws.messages}
      streaming={ws.streaming}
      sessionId={ws.sessionId}
      userName={ws.userName}
      error={ws.error}
      onSend={ws.sendMessage}
      onNewConversation={ws.newConversation}
    />
  );
}
