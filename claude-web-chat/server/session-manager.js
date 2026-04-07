import { spawn } from "child_process";
import { getConfig } from "./auth.js";

const sessions = new Map();

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
  ];

  if (existing?.sessionId) {
    args.push("--resume", existing.sessionId);
  }

  args.push("-p", text);

  const proc = spawn("claude", args, {
    stdio: ["pipe", "pipe", "ignore"],
  });

  const entry = {
    proc,
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
    buffer = lines.pop();

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

  proc.on("close", () => {
    const session = sessions.get(userId);
    if (session) {
      session.busy = false;
      session.lastActivity = Date.now();
      resetIdleTimer(userId);
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

  const { idleTimeoutMinutes = 10 } = getConfig();
  session.idleTimer = setTimeout(() => {
    sessions.delete(userId);
  }, idleTimeoutMinutes * 60 * 1000);
}

export function startNewConversation(userId) {
  const existing = sessions.get(userId);
  if (existing) {
    if (existing.idleTimer) clearTimeout(existing.idleTimer);
    if (existing.proc && existing.busy) {
      existing.proc.kill("SIGTERM");
    }
  }
  sessions.delete(userId);
}

export function isUserBusy(userId) {
  return sessions.get(userId)?.busy || false;
}
