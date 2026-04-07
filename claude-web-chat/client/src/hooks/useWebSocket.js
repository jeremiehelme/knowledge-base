import { useState, useEffect, useRef, useCallback } from "react";

const MESSAGES_PREFIX = "claude-chat-messages-";
const SESSIONS_KEY = "claude-web-chat-sessions";

function loadStoredMessages(sessionId) {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_PREFIX + sessionId) || "[]");
  } catch {
    return [];
  }
}

function saveStoredMessages(sessionId, messages) {
  const cleaned = messages
    .filter((m) => m.text)
    .map(({ role, text }) => ({ role, text }));
  localStorage.setItem(MESSAGES_PREFIX + sessionId, JSON.stringify(cleaned));
}

function removeStoredMessages(sessionId) {
  localStorage.removeItem(MESSAGES_PREFIX + sessionId);
}

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export default function useWebSocket(token) {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState(loadSessions);
  const wsRef = useRef(null);
  const streamBufferRef = useRef("");
  const sessionIdRef = useRef(null);
  const messagesRef = useRef([]);

  // Keep refs in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Clean stale sessions on mount (older than 7 days)
  useEffect(() => {
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const currentSessions = loadSessions();
    const fresh = currentSessions.filter((s) => now - s.lastUsed < SEVEN_DAYS);
    const stale = currentSessions.filter((s) => now - s.lastUsed >= SEVEN_DAYS);
    if (stale.length > 0) {
      stale.forEach((s) => removeStoredMessages(s.id));
      saveSessions(fresh);
      setSessions(fresh);
    }
  }, []);

  // Track session in sidebar
  useEffect(() => {
    if (!sessionId) return;
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === sessionId);
      let updated;
      if (exists) {
        updated = prev.map((s) =>
          s.id === sessionId ? { ...s, lastUsed: Date.now() } : s
        );
      } else {
        const firstUserMsg = messagesRef.current.find((m) => m.role === "user");
        const title = firstUserMsg?.text?.slice(0, 80) || "New chat";
        updated = [{ id: sessionId, created: Date.now(), lastUsed: Date.now(), title }, ...prev];
      }
      saveSessions(updated);
      return updated;
    });
  }, [sessionId]);

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
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

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
          // Persist messages
          if (msg.sessionId) {
            saveStoredMessages(msg.sessionId, updated);
          }
          // Update title if it's the first message
          setSessions((prevSessions) => {
            const session = prevSessions.find((s) => s.id === msg.sessionId);
            if (session && session.title === "New chat") {
              const firstUserMsg = updated.find((m) => m.role === "user");
              if (firstUserMsg) {
                const newSessions = prevSessions.map((s) =>
                  s.id === msg.sessionId ? { ...s, title: firstUserMsg.text.slice(0, 80) } : s
                );
                saveSessions(newSessions);
                return newSessions;
              }
            }
            return prevSessions;
          });
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

      if (msg.type === "resume_conversation_ok") {
        setSessionId(msg.sessionId);
        const stored = loadStoredMessages(msg.sessionId);
        setMessages(stored);
      }

      if (msg.type === "delete_conversation_ok") {
        removeStoredMessages(msg.sessionId);
        setSessions((prev) => {
          const updated = prev.filter((s) => s.id !== msg.sessionId);
          saveSessions(updated);
          return updated;
        });
        if (sessionIdRef.current === msg.sessionId) {
          setMessages([]);
          setSessionId(null);
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setAuthenticated(false);
      setStreaming(false);
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
    // Save current messages before clearing
    if (sessionIdRef.current && messagesRef.current.length > 0) {
      saveStoredMessages(sessionIdRef.current, messagesRef.current);
    }
    wsRef.current.send(JSON.stringify({ type: "new_conversation" }));
  }, []);

  const resumeConversation = useCallback((targetSessionId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (targetSessionId === sessionIdRef.current) return;
    // Save current messages before switching
    if (sessionIdRef.current && messagesRef.current.length > 0) {
      saveStoredMessages(sessionIdRef.current, messagesRef.current);
    }
    wsRef.current.send(JSON.stringify({ type: "resume_conversation", sessionId: targetSessionId }));
  }, []);

  const deleteConversation = useCallback((targetSessionId) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "delete_conversation", sessionId: targetSessionId }));
  }, []);

  return {
    connected, authenticated, userName, messages, streaming, error, sessionId, sessions,
    sendMessage, newConversation, resumeConversation, deleteConversation,
  };
}
