import { useState, useEffect, useRef, useCallback } from "react";

export default function useWebSocket(token) {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const wsRef = useRef(null);
  const streamBufferRef = useRef("");

  useEffect(() => {
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "auth", token }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "auth_ok") {
        setAuthenticated(true);
        setUserName(msg.user);
        setError(null);
      }

      if (msg.type === "auth_error") {
        setError("Invalid token");
        setAuthenticated(false);
        localStorage.removeItem("claude-chat-token");
      }

      if (msg.type === "chunk") {
        streamBufferRef.current += msg.text;
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant" && last.streaming) {
            updated[updated.length - 1] = {
              ...last,
              text: streamBufferRef.current,
            };
          }
          return updated;
        });
      }

      if (msg.type === "done") {
        setStreaming(false);
        setSessionId(msg.sessionId);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.role === "assistant") {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      }

      if (msg.type === "error") {
        setStreaming(false);
        setError(msg.message);
      }

      if (msg.type === "new_conversation_ok") {
        setMessages([]);
        setSessionId(null);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setAuthenticated(false);
    };

    return () => ws.close();
  }, [token]);

  const sendMessage = useCallback((text) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "assistant", text: "", streaming: true },
    ]);
    streamBufferRef.current = "";
    setStreaming(true);
    setError(null);
    wsRef.current.send(JSON.stringify({ type: "message", text }));
  }, []);

  const newConversation = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "new_conversation" }));
  }, []);

  return {
    connected, authenticated, userName, messages, streaming, error, sessionId,
    sendMessage, newConversation,
  };
}
