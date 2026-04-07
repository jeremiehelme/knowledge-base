# Dashboard & File Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dashboard home page, file management page, and persistent sidebar navigation to the knowledge base chat app.

**Architecture:** Hash-based client routing with an AppShell layout wrapper. New REST API endpoints on the Express server to read/delete files from the user's INDEX.md. Sidebar nav replaces the current full-screen chat layout.

**Tech Stack:** React 19, Tailwind CSS 4, Express 4, Node fs/path APIs, react-markdown for file viewer.

---

## File Structure

### New server files
- `server/api.js` — Express router with REST endpoints (GET /api/files, GET /api/files/:path/content, DELETE /api/files/:path)
- `server/index-parser.js` — Parses INDEX.md into structured JSON array
- `server/middleware.js` — Express middleware for token auth on REST endpoints

### New client files
- `client/src/components/AppShell.jsx` — Layout wrapper: sidebar nav + content area
- `client/src/components/Sidebar.jsx` — Persistent left nav (Dashboard, Files, Chat icons + user menu)
- `client/src/components/DashboardView.jsx` — Dashboard page with widgets + chat prompt
- `client/src/components/FilesView.jsx` — File management page with card grid, search, tag filter
- `client/src/components/FileCard.jsx` — Individual file card
- `client/src/components/FileSlideOver.jsx` — Slide-over panel for viewing document content
- `client/src/components/TagFilter.jsx` — Tag chip filter bar
- `client/src/hooks/useRouter.js` — Simple hash-based router hook
- `client/src/hooks/useFiles.js` — Hook for fetching/deleting files via REST API

### Modified files
- `server/index.js` — Mount API router, add JSON body parsing
- `client/src/App.jsx` — Use router, wrap views in AppShell
- `client/src/components/ChatView.jsx` — Remove header/user menu (moved to Sidebar), integrate SessionSidebar inline
- `client/vite.config.js` — Add proxy for /api routes

---

### Task 1: Vite proxy for API routes

**Files:**
- Modify: `claude-web-chat/client/vite.config.js`

- [ ] **Step 1: Add /api proxy to vite config**

```js
// In vite.config.js, add /api proxy alongside the existing /ws proxy
server: {
  port: 5173,
  proxy: {
    "/ws": {
      target: "ws://localhost:3000",
      ws: true,
    },
    "/api": {
      target: "http://localhost:3000",
    },
  },
},
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/vite.config.js && git commit -m "feat: add /api proxy to vite dev server"
```

---

### Task 2: Server auth middleware for REST endpoints

**Files:**
- Create: `claude-web-chat/server/middleware.js`

- [ ] **Step 1: Create auth middleware**

```js
import { authenticateToken } from "./auth.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  const token = header.slice(7);
  const user = authenticateToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = user;
  next();
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add server/middleware.js && git commit -m "feat: add REST auth middleware"
```

---

### Task 3: INDEX.md parser

**Files:**
- Create: `claude-web-chat/server/index-parser.js`

The INDEX.md is a markdown file maintained by Claude during ingestion. Entries follow this pattern (from the kb-ingest skill): each entry has a title, date, tags, word count, summary, and a file path. The format is markdown with entries grouped by category.

Since the INDEX.md format is freeform markdown written by Claude, and the actual source files have YAML front matter, the most reliable approach is to scan the source files directly and parse their front matter, using INDEX.md summaries as supplementary data.

- [ ] **Step 1: Create the parser that scans source files and reads front matter**

```js
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";

function parseYamlFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontMatter: {}, body: content };
  const body = content.slice(match[0].length).trim();
  const frontMatter = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Handle arrays like [tag1, tag2]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
    } else {
      value = value.replace(/^["']|["']$/g, "");
    }
    frontMatter[key] = value;
  }
  return { frontMatter, body };
}

function scanDirectory(dir, knowledgeDir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, knowledgeDir));
    } else if (entry.name.endsWith(".md") && entry.name !== "INDEX.md") {
      const content = readFileSync(fullPath, "utf-8");
      const { frontMatter, body } = parseYamlFrontMatter(content);
      const relativePath = relative(knowledgeDir, fullPath);
      const stat = statSync(fullPath);
      files.push({
        title: frontMatter.title || entry.name.replace(/\.md$/, ""),
        summary: body.split("\n").filter((l) => l.trim() && !l.startsWith("#")).slice(0, 2).join(" ").slice(0, 200),
        tags: Array.isArray(frontMatter.tags) ? frontMatter.tags : [],
        date: frontMatter.added_date || frontMatter.publication_date || stat.mtime.toISOString().slice(0, 10),
        type: frontMatter.type || guessType(relativePath),
        path: relativePath,
        url: frontMatter.source_url || null,
      });
    }
  }
  return files;
}

function guessType(relativePath) {
  if (relativePath.startsWith("sources/web")) return "web";
  if (relativePath.startsWith("sources/articles")) return "article";
  if (relativePath.startsWith("sources/notes")) return "note";
  if (relativePath.startsWith("wiki")) return "wiki";
  return "unknown";
}

export function listFiles(knowledgeDir) {
  const files = [
    ...scanDirectory(join(knowledgeDir, "sources"), knowledgeDir),
    ...scanDirectory(join(knowledgeDir, "wiki"), knowledgeDir),
  ];
  // Sort by date descending
  files.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return files;
}

export function readFileContent(knowledgeDir, filePath) {
  const fullPath = join(knowledgeDir, filePath);
  if (!existsSync(fullPath)) return null;
  // Prevent path traversal
  if (!fullPath.startsWith(knowledgeDir)) return null;
  const content = readFileSync(fullPath, "utf-8");
  const { frontMatter, body } = parseYamlFrontMatter(content);
  return {
    title: frontMatter.title || filePath.split("/").pop().replace(/\.md$/, ""),
    content: body,
  };
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add server/index-parser.js && git commit -m "feat: add knowledge base file parser"
```

---

### Task 4: REST API routes

**Files:**
- Create: `claude-web-chat/server/api.js`
- Modify: `claude-web-chat/server/index.js`

- [ ] **Step 1: Create API router**

```js
import { Router } from "express";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { unlinkSync, readFileSync, writeFileSync, existsSync } from "fs";
import { requireAuth } from "./middleware.js";
import { listFiles, readFileContent } from "./index-parser.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspacesDir = join(__dirname, "..", "workspaces");

const router = Router();
router.use(requireAuth);

function userKnowledgeDir(userName) {
  return join(workspacesDir, userName.toLowerCase(), "knowledge");
}

router.get("/files", (req, res) => {
  const dir = userKnowledgeDir(req.user.name);
  if (!existsSync(dir)) return res.json([]);
  const files = listFiles(dir);
  res.json(files);
});

router.get("/files/*", (req, res) => {
  // Extract path after /files/
  const filePath = req.params[0];
  if (!filePath) return res.status(400).json({ error: "Missing path" });

  // Check if it ends with /content
  if (filePath.endsWith("/content")) {
    const actualPath = filePath.slice(0, -"/content".length);
    const dir = userKnowledgeDir(req.user.name);
    const result = readFileContent(dir, actualPath);
    if (!result) return res.status(404).json({ error: "File not found" });
    return res.json(result);
  }

  res.status(400).json({ error: "Invalid path" });
});

router.delete("/files/*", (req, res) => {
  const filePath = req.params[0];
  if (!filePath) return res.status(400).json({ error: "Missing path" });

  const dir = userKnowledgeDir(req.user.name);
  const fullPath = join(dir, filePath);

  // Prevent path traversal
  if (!fullPath.startsWith(dir)) return res.status(403).json({ error: "Forbidden" });
  if (!existsSync(fullPath)) return res.status(404).json({ error: "File not found" });

  unlinkSync(fullPath);

  // Remove entry from INDEX.md
  const indexPath = join(dir, "INDEX.md");
  if (existsSync(indexPath)) {
    const indexContent = readFileSync(indexPath, "utf-8");
    // Remove lines that reference this file path
    const lines = indexContent.split("\n");
    const filtered = lines.filter((line) => !line.includes(filePath));
    writeFileSync(indexPath, filtered.join("\n"));
  }

  res.json({ ok: true });
});

export default router;
```

- [ ] **Step 2: Mount API router in server/index.js**

Add these lines to `server/index.js`:

After the existing imports, add:
```js
import apiRouter from "./api.js";
```

After `const app = express();`, add:
```js
app.use(express.json());
app.use("/api", apiRouter);
```

- [ ] **Step 3: Commit**

```bash
cd claude-web-chat && git add server/api.js server/index.js && git commit -m "feat: add REST API for files"
```

---

### Task 5: Hash-based router hook

**Files:**
- Create: `claude-web-chat/client/src/hooks/useRouter.js`

- [ ] **Step 1: Create useRouter hook**

```jsx
import { useState, useEffect, useCallback } from "react";

export default function useRouter() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash(window.location.hash));
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((path) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}

function parseHash(hash) {
  const path = hash.replace(/^#\/?/, "") || "dashboard";
  const segments = path.split("/");
  const name = segments[0];
  const params = segments.slice(1);
  return { name, params, path };
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/hooks/useRouter.js && git commit -m "feat: add hash-based router hook"
```

---

### Task 6: useFiles hook

**Files:**
- Create: `claude-web-chat/client/src/hooks/useFiles.js`

- [ ] **Step 1: Create useFiles hook**

```jsx
import { useState, useCallback } from "react";

export default function useFiles(token) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files", { headers });
      if (res.ok) setFiles(await res.json());
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFileContent = useCallback(async (filePath) => {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}/content`, { headers });
    if (!res.ok) return null;
    return res.json();
  }, [token]);

  const deleteFile = useCallback(async (filePath) => {
    const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
      method: "DELETE",
      headers,
    });
    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.path !== filePath));
    }
    return res.ok;
  }, [token]);

  return { files, loading, fetchFiles, fetchFileContent, deleteFile };
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/hooks/useFiles.js && git commit -m "feat: add useFiles hook for REST API"
```

---

### Task 7: Sidebar component

**Files:**
- Create: `claude-web-chat/client/src/components/Sidebar.jsx`

- [ ] **Step 1: Create Sidebar component**

```jsx
export default function Sidebar({ currentRoute, onNavigate, userName, onLogout }) {
  const links = [
    { name: "dashboard", label: "Dashboard", icon: HomeIcon },
    { name: "files", label: "Files", icon: FolderIcon },
    { name: "chat", label: "Chat", icon: ChatIcon },
  ];

  return (
    <div className="w-16 bg-gray-900 flex flex-col items-center py-4 gap-2">
      {links.map((link) => (
        <button
          key={link.name}
          onClick={() => onNavigate(link.name)}
          title={link.label}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
            currentRoute === link.name
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          }`}
        >
          <link.icon />
        </button>
      ))}
      <div className="flex-1" />
      <div className="relative group">
        <button
          title={userName}
          className="w-10 h-10 rounded-full bg-gray-700 text-white text-sm font-medium flex items-center justify-center hover:bg-gray-600"
        >
          {userName?.[0]?.toUpperCase() || "?"}
        </button>
        <div className="absolute left-12 bottom-0 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-36">
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              {userName}
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/Sidebar.jsx && git commit -m "feat: add Sidebar navigation component"
```

---

### Task 8: AppShell layout wrapper

**Files:**
- Create: `claude-web-chat/client/src/components/AppShell.jsx`

- [ ] **Step 1: Create AppShell component**

```jsx
import Sidebar from "./Sidebar.jsx";

export default function AppShell({ currentRoute, onNavigate, userName, onLogout, children }) {
  return (
    <div className="flex h-screen w-full">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        userName={userName}
        onLogout={onLogout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/AppShell.jsx && git commit -m "feat: add AppShell layout wrapper"
```

---

### Task 9: TagFilter component

**Files:**
- Create: `claude-web-chat/client/src/components/TagFilter.jsx`

- [ ] **Step 1: Create TagFilter component**

```jsx
export default function TagFilter({ tags, activeTags, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeTags.includes(tag)
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/TagFilter.jsx && git commit -m "feat: add TagFilter component"
```

---

### Task 10: FileCard component

**Files:**
- Create: `claude-web-chat/client/src/components/FileCard.jsx`

- [ ] **Step 1: Create FileCard component**

```jsx
export default function FileCard({ file, onView, onDelete }) {
  function handleClick() {
    if (file.type === "web" && file.url) {
      window.open(file.url, "_blank");
    } else {
      onView(file);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors flex flex-col gap-2"
    >
      <div className="flex items-start justify-between">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
          {file.title}
        </h3>
        {file.type === "web" && file.url && (
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )}
      </div>
      {file.summary && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{file.summary}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-auto">
        {file.tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
        <span>{file.date}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file);
          }}
          className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/FileCard.jsx && git commit -m "feat: add FileCard component"
```

---

### Task 11: FileSlideOver component

**Files:**
- Create: `claude-web-chat/client/src/components/FileSlideOver.jsx`

- [ ] **Step 1: Create FileSlideOver component**

```jsx
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FileSlideOver({ file, fetchContent, onClose }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchContent(file.path).then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, [file.path]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl flex flex-col overflow-hidden animate-slide-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg truncate">{file.title}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : content ? (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown>{content.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-red-400">Failed to load file content.</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add slide-in animation to CSS**

In `client/src/index.css` (or wherever global styles are), add:

```css
@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}
```

If the project uses Tailwind 4 with `@import "tailwindcss"`, add the keyframes after that import.

- [ ] **Step 3: Commit**

```bash
cd claude-web-chat && git add client/src/components/FileSlideOver.jsx client/src/index.css && git commit -m "feat: add FileSlideOver component"
```

Note: If there's no `index.css`, check what CSS file exists (e.g. `client/src/main.css` or similar) and add the animation there.

---

### Task 12: FilesView page

**Files:**
- Create: `claude-web-chat/client/src/components/FilesView.jsx`

- [ ] **Step 1: Create FilesView component**

```jsx
import { useState, useEffect, useMemo } from "react";
import FileCard from "./FileCard.jsx";
import FileSlideOver from "./FileSlideOver.jsx";
import TagFilter from "./TagFilter.jsx";

export default function FilesView({ files, loading, fetchFiles, fetchFileContent, deleteFile }) {
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState([]);
  const [viewingFile, setViewingFile] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    files.forEach((f) => f.tags.forEach((t) => tagSet.add(t)));
    return [...tagSet].sort();
  }, [files]);

  const filtered = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = !search ||
        f.title.toLowerCase().includes(search.toLowerCase()) ||
        (f.summary && f.summary.toLowerCase().includes(search.toLowerCase()));
      const matchesTags = activeTags.length === 0 ||
        activeTags.some((t) => f.tags.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [files, search, activeTags]);

  function handleToggleTag(tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleDelete(file) {
    setDeleteConfirm(file);
  }

  async function confirmDelete() {
    if (deleteConfirm) {
      await deleteFile(deleteConfirm.path);
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold mb-3">Files</h1>
        <input
          type="text"
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
        />
        {allTags.length > 0 && (
          <TagFilter tags={allTags} activeTags={activeTags} onToggle={handleToggleTag} />
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-gray-400">Loading files...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No files found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((file) => (
              <FileCard
                key={file.path}
                file={file}
                onView={setViewingFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {viewingFile && (
        <FileSlideOver
          file={viewingFile}
          fetchContent={fetchFileContent}
          onClose={() => setViewingFile(null)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="font-semibold mb-2">Delete file?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              This will permanently delete <strong>{deleteConfirm.title}</strong> and remove it from the index.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/FilesView.jsx && git commit -m "feat: add FilesView page component"
```

---

### Task 13: DashboardView page

**Files:**
- Create: `claude-web-chat/client/src/components/DashboardView.jsx`

- [ ] **Step 1: Create DashboardView component**

```jsx
import { useState, useEffect } from "react";

export default function DashboardView({ files, loading, fetchFiles, sessions, onNavigate, onSendMessage }) {
  const [promptText, setPromptText] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const recentFiles = files.slice(0, 5);
  const recentSessions = sessions.slice(0, 5);

  function handlePromptSubmit(e) {
    e.preventDefault();
    if (!promptText.trim()) return;
    onSendMessage(promptText.trim());
    setPromptText("");
  }

  function handleFileClick(file) {
    if (file.type === "web" && file.url) {
      window.open(file.url, "_blank");
    } else {
      // Navigate to files view — the slide-over is on that page
      onNavigate("files");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-lg font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Recent Files */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Files</h2>
            <button
              onClick={() => onNavigate("files")}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              View all
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : recentFiles.length === 0 ? (
            <p className="text-sm text-gray-400">No files yet. Add documents via chat.</p>
          ) : (
            <div className="space-y-2">
              {recentFiles.map((file) => (
                <div
                  key={file.path}
                  onClick={() => handleFileClick(file)}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.title}</p>
                    <div className="flex gap-1 mt-1">
                      {file.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-500 dark:text-gray-400">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{file.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Conversations */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Recent Conversations</h2>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400">No conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => onNavigate(`chat/${session.id}`)}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <p className="text-sm font-medium truncate flex-1">{session.title || "Untitled"}</p>
                  <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                    {new Date(session.lastUsed).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ask the CEO prompt */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h2 className="font-medium text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Ask the CEO</h2>
        <form onSubmit={handlePromptSubmit} className="flex gap-2">
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="What would you like to discuss?"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button
            type="submit"
            disabled={!promptText.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/DashboardView.jsx && git commit -m "feat: add DashboardView page component"
```

---

### Task 14: Update ChatView — remove header, keep SessionSidebar inline

**Files:**
- Modify: `claude-web-chat/client/src/components/ChatView.jsx`

- [ ] **Step 1: Simplify ChatView**

Remove the header bar (dark mode toggle, user menu — now handled by Sidebar/AppShell). Keep SessionSidebar as an integrated panel. The dark mode state moves to App.jsx.

Replace the entire contents of `ChatView.jsx` with:

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/components/ChatView.jsx && git commit -m "feat: simplify ChatView, move header to AppShell"
```

---

### Task 15: Update App.jsx — routing + AppShell integration

**Files:**
- Modify: `claude-web-chat/client/src/App.jsx`

- [ ] **Step 1: Rewrite App.jsx with routing**

Replace the entire contents of `App.jsx` with:

```jsx
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

  // Handle "Ask the CEO" prompt from dashboard
  function handleDashboardSend(text) {
    ws.newConversation();
    navigate("chat");
    // Small delay to ensure new conversation is ready
    setTimeout(() => ws.sendMessage(text), 100);
  }

  // Handle navigation — if navigating to chat/:sessionId, resume that session
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
```

- [ ] **Step 2: Commit**

```bash
cd claude-web-chat && git add client/src/App.jsx && git commit -m "feat: integrate routing, AppShell, and all views"
```

---

### Task 16: CSS animation + verify build

**Files:**
- Modify: CSS file (find the right one)

- [ ] **Step 1: Find and update the CSS file**

```bash
ls claude-web-chat/client/src/*.css
```

Add the slide-in animation to whatever CSS file exists (likely `index.css` or `main.css`):

```css
@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}
```

- [ ] **Step 2: Verify the app builds without errors**

```bash
cd claude-web-chat/client && npx vite build
```

Expected: Build completes successfully with no errors.

- [ ] **Step 3: Commit**

```bash
cd claude-web-chat && git add -A && git commit -m "feat: add slide-in animation and verify build"
```

---

### Task 17: Manual testing + fix issues

- [ ] **Step 1: Start the dev server**

```bash
cd claude-web-chat && npm run dev
```

- [ ] **Step 2: Test the following flows**

Open http://localhost:5173 in a browser:

1. **Login** → should redirect to dashboard (hash should be `#/dashboard` or empty)
2. **Dashboard** → should show Recent Files, Recent Conversations, Ask the CEO prompt
3. **Sidebar** → click Files icon → should show files page
4. **Sidebar** → click Chat icon → should show chat with session sidebar
5. **Sidebar** → click Dashboard icon → should return to dashboard
6. **Ask the CEO** → type a message → should navigate to chat and send it
7. **Recent Conversations** → click one → should open that chat session
8. **Files page** → if files exist, cards should appear with search and tag filter

- [ ] **Step 3: Fix any issues found during testing**

- [ ] **Step 4: Final commit if fixes were needed**

```bash
cd claude-web-chat && git add -A && git commit -m "fix: address issues from manual testing"
```
