import { authenticateToken } from "./auth.js";
import { sendMessage, startNewConversation, resumeSession, deleteSession, isUserBusy } from "./session-manager.js";
import { AGENTS } from "./agents.js";

const connections = new Map();

export function handleConnection(ws) {
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    if (msg.type === "auth") {
      const user = authenticateToken(msg.token);
      if (user) {
        connections.set(ws, user);
        ws.send(JSON.stringify({ type: "auth_ok", user: user.name }));
      } else {
        ws.send(JSON.stringify({ type: "auth_error" }));
        ws.close();
      }
      return;
    }

    const user = connections.get(ws);
    if (!user) {
      ws.send(JSON.stringify({ type: "error", message: "Not authenticated" }));
      ws.close();
      return;
    }

    if (msg.type === "new_conversation") {
      startNewConversation(user.name);
      ws.send(JSON.stringify({ type: "new_conversation_ok" }));
      return;
    }

    if (msg.type === "resume_conversation") {
      if (!msg.sessionId) {
        ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
        return;
      }
      resumeSession(user.name, msg.sessionId);
      ws.send(JSON.stringify({ type: "resume_conversation_ok", sessionId: msg.sessionId }));
      return;
    }

    if (msg.type === "delete_conversation") {
      if (!msg.sessionId) {
        ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
        return;
      }
      deleteSession(user.name, msg.sessionId);
      ws.send(JSON.stringify({ type: "delete_conversation_ok", sessionId: msg.sessionId }));
      return;
    }

    if (msg.type === "message") {
      if (!msg.text?.trim()) {
        ws.send(JSON.stringify({ type: "error", message: "Empty message" }));
        return;
      }

      if (isUserBusy(user.name)) {
        ws.send(JSON.stringify({ type: "error", message: "Claude is still responding" }));
        return;
      }

      let text = msg.text;
      if (msg.agentId && msg.agentId !== "advisor") {
        const agent = AGENTS.find(a => a.id === msg.agentId);
        if (agent) {
          text = `[System context: ${agent.systemPrompt}]\n\n${text}`;
        }
      }

      sendMessage(user.name, text, {
        onChunk: (text) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "chunk", text }));
          }
        },
        onDone: (sessionId) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "done", sessionId }));
          }
        },
        onError: (message) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "error", message }));
          }
        },
      });
      return;
    }

    ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
  });

  ws.on("close", () => {
    connections.delete(ws);
  });
}
