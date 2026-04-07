# Claude Web Chat — Design Spec

A self-hosted web chat interface that lets a small team interact with Claude Code CLI on a VPS, using the host's Claude Code subscription (no API key).

## Architecture

```
┌─────────────┐      WebSocket       ┌──────────────────┐     stdin/stdout     ┌─────────────┐
│  React App  │  ◄──────────────────► │  Express Server  │ ◄──────────────────► │  claude CLI  │
│  (Tailwind) │                       │  + WS Server     │    (one per user)    │  --print     │
└─────────────┘                       └──────────────────┘                      └─────────────┘
```

Three layers:
- **React frontend** — chat UI, one conversation per user, communicates over WebSocket
- **Express backend** — authenticates users, manages Claude CLI processes, relays messages
- **Claude CLI processes** — one per conversation, using `--print --output-format stream-json`

## Backend

### Tech stack
- Node.js + Express
- `ws` library for WebSocket
- `child_process.spawn` for Claude CLI

### Auth
- Token-based, no database
- Config file `config.json`:
  ```json
  {
    "users": [
      { "name": "Alice", "token": "abc123" },
      { "name": "Bob", "token": "def456" }
    ],
    "idleTimeoutMinutes": 10
  }
  ```
- WebSocket connection authenticates on first message
- Invalid token closes the connection

### Session manager
- In-memory map: `userId → { process, sessionId, lastActivity }`
- **New conversation:** `claude --print --output-format stream-json -p "<message>"`
- **Continue conversation:** `claude --print --output-format stream-json --resume <sessionId> -p "<message>"`
- Session ID parsed from Claude's JSON output for resumption
- Idle processes killed after configurable timeout (default 10 min)
- One active conversation per user at a time; queued if Claude is still responding

### WebSocket protocol

All communication over a single WebSocket connection per client.

**Client → Server:**
- `{ "type": "auth", "token": "abc123" }` — first message, authenticates
- `{ "type": "message", "text": "..." }` — send a prompt to Claude
- `{ "type": "new_conversation" }` — start a fresh conversation

**Server → Client:**
- `{ "type": "auth_ok", "user": "Alice" }` — authentication successful
- `{ "type": "auth_error" }` — bad token, connection will close
- `{ "type": "chunk", "text": "..." }` — streamed response text
- `{ "type": "done", "sessionId": "..." }` — response complete
- `{ "type": "error", "message": "..." }` — error occurred

No REST API. Everything goes through WebSocket.

## Frontend

### Tech stack
- React 18+
- Tailwind CSS
- Vite for bundling
- `markdown-it` or `react-markdown` for rendering

### Views

**Login screen:**
- Token input field
- Token stored in localStorage
- Auto-login on return if token is valid

**Chat view:**
- Message list: user messages and Claude responses
- Text input with Send button, Shift+Enter for multiline
- Streaming indicator while Claude responds
- "New conversation" button in header
- Auto-scroll to bottom, "scroll to bottom" button when scrolled up
- Markdown rendering for responses (code blocks, lists, inline code)

**Session sidebar (minimal):**
- List of past session IDs with timestamps, stored in localStorage
- Click to resume a previous conversation (uses `--resume`)
- Only shows sessions created in this browser (no server-side session listing)

### Design
- Clean, minimal aesthetic
- Dark/light mode toggle
- Responsive — works on mobile

## What this is NOT

- No file browser or diff viewer
- No terminal output display
- No tool call visibility
- No admin panel
- No database — all state is in-memory or in Claude Code's session system
- No API key management — uses the host's Claude Code subscription

## Deployment

- Run behind Nginx reverse proxy with TLS (Let's Encrypt)
- Backend serves the built React app as static files
- Single `npm start` command to run everything
- PM2 or systemd for process management

## Project structure

```
claude-web-chat/
├── package.json
├── config.json              # User tokens
├── server/
│   ├── index.js             # Express + WebSocket server entry
│   ├── auth.js              # Token validation
│   ├── session-manager.js   # Claude process lifecycle
│   └── ws-handler.js        # WebSocket message routing
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── LoginScreen.jsx
│   │   │   ├── ChatView.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── MessageInput.jsx
│   │   │   └── SessionSidebar.jsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.js
│   │   └── styles/
│   │       └── index.css    # Tailwind imports
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```
