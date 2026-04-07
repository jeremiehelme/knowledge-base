# Claude Web Chat — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-hosted web chat UI that wraps Claude Code CLI, enabling a small team to chat with Claude through their browser.

**Architecture:** Node.js Express backend spawns Claude CLI processes (`claude --print --output-format stream-json --verbose --bare`) per user, relays streamed JSON events over WebSocket to a React+Tailwind frontend. Auth via pre-shared tokens in a config file.

**Tech Stack:** Node.js, Express, ws, React 18, Vite, Tailwind CSS, react-markdown

---

## File Structure

```
claude-web-chat/
├── package.json                 # Root package with workspaces
├── config.json                  # User tokens + settings
├── server/
│   ├── index.js                 # Express + WS server entry point
│   ├── auth.js                  # Token validation from config
│   ├── session-manager.js       # Claude CLI process lifecycle
│   └── ws-handler.js            # WebSocket message routing
├── client/
│   ├── index.html               # Vite entry HTML
│   ├── vite.config.js           # Vite config with proxy
│   ├── tailwind.config.js       # Tailwind config
│   ├── postcss.config.js        # PostCSS for Tailwind
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Root component with routing
│   │   ├── index.css            # Tailwind imports
│   │   ├── hooks/
│   │   │   └── useWebSocket.js  # WebSocket connection + message handling
│   │   └── components/
│   │       ├── LoginScreen.jsx  # Token auth screen
│   │       ├── ChatView.jsx     # Main chat layout (sidebar + messages + input)
│   │       ├── MessageList.jsx  # Renders message history with markdown
│   │       ├── MessageInput.jsx # Text input with send/shift+enter
│   │       └── SessionSidebar.jsx # Past sessions list
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `claude-web-chat/package.json`
- Create: `claude-web-chat/config.json`
- Create: `claude-web-chat/.gitignore`

- [ ] **Step 1: Create project directory and root package.json**

```bash
mkdir -p claude-web-chat
cd claude-web-chat
```

Write `package.json`:

```json
{
  "name": "claude-web-chat",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "node --watch server/index.js",
    "dev:client": "cd client && npx vite",
    "build": "cd client && npx vite build",
    "start": "NODE_ENV=production node server/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

- [ ] **Step 2: Create config.json**

```json
{
  "users": [
    { "name": "Alice", "token": "change-me-alice-token" },
    { "name": "Bob", "token": "change-me-bob-token" }
  ],
  "idleTimeoutMinutes": 10,
  "port": 3000
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
client/dist/
.env
```

- [ ] **Step 4: Install dependencies**

```bash
cd claude-web-chat && npm install
```

Expected: `package-lock.json` created, `node_modules/` populated.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json config.json .gitignore
git commit -m "feat: scaffold claude-web-chat project"
```

---

### Task 2: Auth Module

**Files:**
- Create: `claude-web-chat/server/auth.js`

- [ ] **Step 1: Write auth.js**

This module reads `config.json` and validates tokens.

```js
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, "..", "config.json");

let config = null;

function loadConfig() {
  const raw = readFileSync(configPath, "utf-8");
  config = JSON.parse(raw);
  return config;
}

export function getConfig() {
  if (!config) loadConfig();
  return config;
}

export function authenticateToken(token) {
  const { users } = getConfig();
  const user = users.find((u) => u.token === token);
  return user ? { name: user.name } : null;
}
```

- [ ] **Step 2: Verify it works**

```bash
cd claude-web-chat && node -e "
import { authenticateToken, getConfig } from './server/auth.js';
console.log('config:', getConfig().users.length, 'users');
console.log('valid:', authenticateToken('change-me-alice-token'));
console.log('invalid:', authenticateToken('wrong'));
"
```

Expected:
```
config: 2 users
valid: { name: 'Alice' }
invalid: null
```

- [ ] **Step 3: Commit**

```bash
git add server/auth.js
git commit -m "feat: add token auth module"
```

---

### Task 3: Session Manager

**Files:**
- Create: `claude-web-chat/server/session-manager.js`

- [ ] **Step 1: Write session-manager.js**

Manages Claude CLI processes per user. Spawns `claude --print --output-format stream-json --verbose --bare`, parses streamed JSON, and emits events via callbacks.

```js
import { spawn } from "child_process";
import { getConfig } from "./auth.js";

const sessions = new Map(); // userId -> { sessionId, busy, lastActivity, idleTimer }

export function getSession(userId) {
  return sessions.get(userId) || null;
}

export function sendMessage(userId, text, { onChunk, onDone, onError }) {
  const existing = sessions.get(userId);

  if (existing?.busy) {
    onError("Claude is still responding. Please wait.");
    return;
  }

  const args = [
    "--print",
    "--output-format", "stream-json",
    "--verbose",
    "--bare",
    "-p", text,
  ];

  // Resume existing session
  if (existing?.sessionId) {
    args.push("--resume", existing.sessionId);
  }

  const proc = spawn("claude", args, {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const entry = {
    sessionId: existing?.sessionId || null,
    busy: true,
    lastActivity: Date.now(),
    idleTimer: null,
  };
  sessions.set(userId, entry);

  let buffer = "";

  proc.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        handleEvent(userId, event, { onChunk, onDone, onError });
      } catch {
        // skip malformed lines
      }
    }
  });

  proc.stderr.on("data", (data) => {
    // stderr may contain warnings, ignore unless critical
  });

  proc.on("close", (code) => {
    const session = sessions.get(userId);
    if (session) {
      session.busy = false;
      session.lastActivity = Date.now();
      resetIdleTimer(userId);
    }
    if (code !== 0 && code !== null) {
      onError(`Claude process exited with code ${code}`);
    }
  });

  proc.on("error", (err) => {
    const session = sessions.get(userId);
    if (session) session.busy = false;
    onError(`Failed to start Claude: ${err.message}`);
  });
}

function handleEvent(userId, event, { onChunk, onDone, onError }) {
  const session = sessions.get(userId);

  if (event.type === "system" && event.subtype === "init") {
    // Capture session ID for resume
    if (session && event.session_id) {
      session.sessionId = event.session_id;
    }
  }

  if (event.type === "assistant" && event.message?.content) {
    for (const block of event.message.content) {
      if (block.type === "text" && block.text) {
        onChunk(block.text);
      }
    }
  }

  if (event.type === "result") {
    if (session && event.session_id) {
      session.sessionId = event.session_id;
    }
    onDone(event.session_id);
  }
}

function resetIdleTimer(userId) {
  const session = sessions.get(userId);
  if (!session) return;

  if (session.idleTimer) clearTimeout(session.idleTimer);

  const { idleTimeoutMinutes } = getConfig();
  session.idleTimer = setTimeout(() => {
    sessions.delete(userId);
  }, idleTimeoutMinutes * 60 * 1000);
}

export function startNewConversation(userId) {
  const existing = sessions.get(userId);
  if (existing?.idleTimer) clearTimeout(existing.idleTimer);
  sessions.delete(userId);
}

export function isUserBusy(userId) {
  return sessions.get(userId)?.busy || false;
}
```

- [ ] **Step 2: Verify module loads without errors**

```bash
cd claude-web-chat && node -e "
import { sendMessage, startNewConversation, isUserBusy } from './server/session-manager.js';
console.log('session-manager loaded OK');
console.log('isUserBusy:', isUserBusy('test'));
"
```

Expected:
```
session-manager loaded OK
isUserBusy: false
```

- [ ] **Step 3: Commit**

```bash
git add server/session-manager.js
git commit -m "feat: add session manager for Claude CLI processes"
```

---

### Task 4: WebSocket Handler

**Files:**
- Create: `claude-web-chat/server/ws-handler.js`

- [ ] **Step 1: Write ws-handler.js**

Routes WebSocket messages through auth and session manager.

```js
import { authenticateToken } from "./auth.js";
import { sendMessage, startNewConversation, isUserBusy } from "./session-manager.js";

// Map ws connection -> authenticated user
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

    // Auth gate
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

    // All other messages require auth
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

    if (msg.type === "message") {
      if (!msg.text?.trim()) {
        ws.send(JSON.stringify({ type: "error", message: "Empty message" }));
        return;
      }

      if (isUserBusy(user.name)) {
        ws.send(JSON.stringify({ type: "error", message: "Claude is still responding" }));
        return;
      }

      sendMessage(user.name, msg.text, {
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
```

- [ ] **Step 2: Commit**

```bash
git add server/ws-handler.js
git commit -m "feat: add WebSocket message handler"
```

---

### Task 5: Express Server Entry Point

**Files:**
- Create: `claude-web-chat/server/index.js`

- [ ] **Step 1: Write server/index.js**

Express serves the built React app in production and upgrades HTTP to WebSocket.

```js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getConfig } from "./auth.js";
import { handleConnection } from "./ws-handler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const clientDist = join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

// WebSocket server
const wss = new WebSocketServer({ server });
wss.on("connection", handleConnection);

// Start
const { port } = getConfig();
const listenPort = port || 3000;

server.listen(listenPort, () => {
  console.log(`Claude Web Chat running on http://localhost:${listenPort}`);
  console.log(`WebSocket accepting connections on ws://localhost:${listenPort}`);
});
```

- [ ] **Step 2: Test the server starts**

```bash
cd claude-web-chat && node server/index.js &
sleep 1
curl -s http://localhost:3000 || echo "Server running (no static files yet)"
kill %1
```

Expected: Server starts without errors, prints the startup message.

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: add Express + WebSocket server entry point"
```

---

### Task 6: React Client Scaffolding

**Files:**
- Create: `claude-web-chat/client/index.html`
- Create: `claude-web-chat/client/vite.config.js`
- Create: `claude-web-chat/client/tailwind.config.js`
- Create: `claude-web-chat/client/postcss.config.js`
- Create: `claude-web-chat/client/src/main.jsx`
- Create: `claude-web-chat/client/src/index.css`
- Create: `claude-web-chat/client/src/App.jsx`

- [ ] **Step 1: Initialize client dependencies**

```bash
cd claude-web-chat/client
npm init -y
npm install react react-dom react-markdown
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Write vite.config.js**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
});
```

- [ ] **Step 3: Write tailwind.config.js**

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 4: Write postcss.config.js**

```js
export default {
  plugins: {},
};
```

- [ ] **Step 5: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Web Chat</title>
  </head>
  <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Write src/index.css**

```css
@import "tailwindcss";
```

- [ ] **Step 7: Write src/main.jsx**

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 8: Write src/App.jsx (shell)**

```jsx
import { useState } from "react";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  if (!token) {
    return <div className="flex items-center justify-center h-screen">Login placeholder</div>;
  }

  return <div className="flex h-screen">Chat placeholder</div>;
}
```

- [ ] **Step 9: Verify client builds**

```bash
cd claude-web-chat/client && npx vite build
```

Expected: Build succeeds, `dist/` created.

- [ ] **Step 10: Commit**

```bash
cd claude-web-chat
git add client/
git commit -m "feat: scaffold React client with Vite and Tailwind"
```

---

### Task 7: useWebSocket Hook

**Files:**
- Create: `claude-web-chat/client/src/hooks/useWebSocket.js`

- [ ] **Step 1: Write useWebSocket.js**

Custom hook that manages the WebSocket connection, auth handshake, and message state.

```jsx
import { useState, useEffect, useRef, useCallback } from "react";

export default function useWebSocket(token) {
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState(null);
  const [messages, setMessages] = useState([]); // { role: "user"|"assistant", text: string }
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
        localStorage.removeItem("token");
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
    connected,
    authenticated,
    userName,
    messages,
    streaming,
    error,
    sessionId,
    sendMessage,
    newConversation,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat
git add client/src/hooks/useWebSocket.js
git commit -m "feat: add useWebSocket hook for WS connection and state"
```

---

### Task 8: Login Screen

**Files:**
- Create: `claude-web-chat/client/src/components/LoginScreen.jsx`

- [ ] **Step 1: Write LoginScreen.jsx**

```jsx
import { useState } from "react";

export default function LoginScreen({ onLogin, error }) {
  const [token, setToken] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (token.trim()) {
      onLogin(token.trim());
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Claude Web Chat</h1>
        <label className="block text-sm font-medium mb-2" htmlFor="token">
          Access Token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your token"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md transition-colors"
        >
          Connect
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/LoginScreen.jsx
git commit -m "feat: add login screen component"
```

---

### Task 9: MessageList Component

**Files:**
- Create: `claude-web-chat/client/src/components/MessageList.jsx`

- [ ] **Step 1: Write MessageList.jsx**

Renders the chat history with markdown support and auto-scroll.

```jsx
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const userScrolledUpRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = container;
      userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 100;
    }

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!userScrolledUpRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function scrollToBottom() {
    userScrolledUpRef.current = false;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-400">
          Send a message to start chatting with Claude
        </div>
      )}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-4 py-2 ${
              msg.role === "user"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            {msg.role === "assistant" ? (
              <div className="prose dark:prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text || (msg.streaming ? "..." : "")}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{msg.text}</p>
            )}
            {msg.streaming && (
              <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
      {userScrolledUpRef.current && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700"
        >
          ↓
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/MessageList.jsx
git commit -m "feat: add message list with markdown rendering"
```

---

### Task 10: MessageInput Component

**Files:**
- Create: `claude-web-chat/client/src/components/MessageInput.jsx`

- [ ] **Step 1: Write MessageInput.jsx**

Text area that submits on Enter, inserts newline on Shift+Enter.

```jsx
import { useState, useRef } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");
  const textareaRef = useRef(null);

  function handleSubmit() {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e) {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Claude..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/MessageInput.jsx
git commit -m "feat: add message input with auto-resize and keyboard shortcuts"
```

---

### Task 11: Session Sidebar

**Files:**
- Create: `claude-web-chat/client/src/components/SessionSidebar.jsx`

- [ ] **Step 1: Write SessionSidebar.jsx**

Stores past sessions in localStorage, lets user resume or start new.

```jsx
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

export default function SessionSidebar({ currentSessionId, onNewConversation, onResume }) {
  const [sessions, setSessions] = useState(loadSessions);

  // Save current session when it changes
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
          <button
            key={session.id}
            onClick={() => onResume(session.id)}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-800 truncate ${
              session.id === currentSessionId
                ? "bg-gray-200 dark:bg-gray-800 font-medium"
                : ""
            }`}
          >
            {new Date(session.created).toLocaleDateString()}{" "}
            {new Date(session.created).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/SessionSidebar.jsx
git commit -m "feat: add session sidebar with localStorage persistence"
```

---

### Task 12: ChatView Component

**Files:**
- Create: `claude-web-chat/client/src/components/ChatView.jsx`

- [ ] **Step 1: Write ChatView.jsx**

Assembles sidebar, message list, and input.

```jsx
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import SessionSidebar from "./SessionSidebar.jsx";

export default function ChatView({
  messages,
  streaming,
  sessionId,
  userName,
  error,
  onSend,
  onNewConversation,
}) {
  return (
    <div className="flex h-screen w-full">
      <SessionSidebar
        currentSessionId={sessionId}
        onNewConversation={onNewConversation}
        onResume={() => {/* resume is handled by starting new + sending to session */}}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-semibold">Claude Web Chat</h1>
          <span className="text-sm text-gray-500">{userName}</span>
        </header>
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ChatView.jsx
git commit -m "feat: add chat view layout component"
```

---

### Task 13: Wire Up App.jsx

**Files:**
- Modify: `claude-web-chat/client/src/App.jsx`

- [ ] **Step 1: Update App.jsx to connect all components**

```jsx
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

  // Show login if no token or auth failed
  if (!token || (ws.connected && !ws.authenticated)) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        error={ws.error}
      />
    );
  }

  // Waiting for connection
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/App.jsx
git commit -m "feat: wire up App with auth flow and chat view"
```

---

### Task 14: Dark Mode Toggle

**Files:**
- Modify: `claude-web-chat/client/src/components/ChatView.jsx`

- [ ] **Step 1: Add dark mode toggle to ChatView header**

Add a toggle button in the header that adds/removes the `dark` class on `<html>`:

```jsx
import { useState, useEffect } from "react";
import MessageList from "./MessageList.jsx";
import MessageInput from "./MessageInput.jsx";
import SessionSidebar from "./SessionSidebar.jsx";

export default function ChatView({
  messages,
  streaming,
  sessionId,
  userName,
  error,
  onSend,
  onNewConversation,
}) {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="flex h-screen w-full">
      <SessionSidebar
        currentSessionId={sessionId}
        onNewConversation={onNewConversation}
        onResume={() => {}}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="font-semibold">Claude Web Chat</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{userName}</span>
            <button
              onClick={() => setDark(!dark)}
              className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </header>
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
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/ChatView.jsx
git commit -m "feat: add dark mode toggle"
```

---

### Task 15: WebSocket Path in Server

**Files:**
- Modify: `claude-web-chat/server/index.js`

- [ ] **Step 1: Add WebSocket path filtering**

Update the WebSocket server to only accept connections on `/ws` path, matching the Vite proxy and production setup:

```js
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getConfig } from "./auth.js";
import { handleConnection } from "./ws-handler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Serve built React app in production
if (process.env.NODE_ENV === "production") {
  const clientDist = join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
}

// WebSocket server on /ws path
const wss = new WebSocketServer({ noServer: true });
wss.on("connection", handleConnection);

server.on("upgrade", (request, socket, head) => {
  const { pathname } = new URL(request.url, `http://${request.headers.host}`);
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start
const { port } = getConfig();
const listenPort = port || 3000;

server.listen(listenPort, () => {
  console.log(`Claude Web Chat running on http://localhost:${listenPort}`);
});
```

- [ ] **Step 2: Commit**

```bash
git add server/index.js
git commit -m "feat: restrict WebSocket to /ws path"
```

---

### Task 16: End-to-End Test

- [ ] **Step 1: Start the full stack in dev mode**

```bash
cd claude-web-chat && npm run dev
```

- [ ] **Step 2: Open browser and test login**

Open `http://localhost:5173`. Enter token `change-me-alice-token`. Verify auth succeeds and chat view appears.

- [ ] **Step 3: Send a test message**

Type "Hello, what is 2+2?" and press Enter. Verify:
- Message appears in the chat as user bubble
- Streaming indicator shows
- Claude's response streams in with markdown formatting
- "Done" state reached, input re-enabled

- [ ] **Step 4: Test new conversation**

Click "New Chat" in sidebar. Verify messages clear and a new conversation starts.

- [ ] **Step 5: Test dark mode toggle**

Click the theme toggle button. Verify colors switch between light and dark.

- [ ] **Step 6: Build for production and test**

```bash
cd claude-web-chat && npm run build
NODE_ENV=production node server/index.js
```

Open `http://localhost:3000`, repeat login + send message test.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete claude-web-chat v1"
```
