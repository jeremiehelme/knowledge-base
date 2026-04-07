# Dashboard & File Management — Design Spec

## Overview

Add a dashboard home page and a file management page to the knowledge base chat app. Introduce persistent sidebar navigation to move between Dashboard, Files, and Chat views.

## Navigation

Persistent left sidebar with icon links:
- **Dashboard** (home icon) — landing page after login
- **Files** (folder icon) — file management page
- **Chat** (message icon) — full chat view (existing ChatView)
- User avatar/menu at bottom (existing logout dropdown)

The current SessionSidebar (chat history list) moves inside the Chat page as an integrated panel.

## Client Routing

Hash-based routing (no external router dependency):
- `#/dashboard` — Dashboard (default after login)
- `#/files` — Files management
- `#/chat` — Chat view (new conversation)
- `#/chat/:sessionId` — Resume specific conversation

## Dashboard Page

Layout: Widget Grid + Chat Prompt (two cards on top, prompt bar below).

### Recent Files Widget
- Shows last 5 files from INDEX.md (title, tags, date)
- "View all" link navigates to Files page
- Click a file: documents open slide-over panel, web links open original URL in new tab

### Recent Conversations Widget
- Shows last 5 chat sessions from localStorage (title, date)
- Click navigates to `#/chat/:sessionId`

### Ask the CEO Prompt Bar
- Text input at the bottom of the dashboard
- On submit: creates a new conversation, navigates to `#/chat` with the message pre-sent

## Files Page

Layout: Card Grid with search and tag filtering.

### Search & Filter
- Search bar at top — filters cards by title and summary text (client-side)
- Tag filter chips — extracted from the file list response, clickable to toggle filter

### File Cards
Each card displays:
- Title
- Summary excerpt (from INDEX.md)
- Tags (colored chips)
- Date

**Click behavior by type:**
- Documents (articles, notes, wiki) → slide-over panel from the right with rendered markdown
- Web links → open original URL in new tab

**Delete:** Each card has a delete button with confirmation dialog. Deletes the file from workspace and removes entry from INDEX.md.

### Slide-Over Panel
- Slides in from the right over the card grid
- Shows rendered markdown content
- Close button returns to the grid
- File title in the panel header

## Server API Endpoints

All endpoints require authentication (token in Authorization header, same as WebSocket auth).

### GET /api/files
Parses the user's `knowledge/INDEX.md` and returns structured JSON.

Response:
```json
[
  {
    "title": "Market Analysis",
    "summary": "Comprehensive analysis of market trends...",
    "tags": ["strategy", "market"],
    "date": "2026-04-05",
    "type": "article",
    "path": "sources/articles/market-analysis.md",
    "url": null
  },
  {
    "title": "Competitor Pricing Page",
    "summary": "Competitor X pricing page snapshot...",
    "tags": ["competitor", "pricing"],
    "date": "2026-04-03",
    "type": "web",
    "path": "sources/web/competitor-pricing.md",
    "url": "https://competitor.com/pricing"
  }
]
```

### GET /api/files/:path/content
Returns raw markdown content for a specific file. `:path` is the relative path within the knowledge directory (URL-encoded).

Response:
```json
{
  "title": "Market Analysis",
  "content": "# Market Analysis\n\n## Overview\n..."
}
```

### DELETE /api/files/:path
Deletes the file from the user's workspace and removes its entry from INDEX.md.

Response: `{ "ok": true }`

## Authentication for REST Endpoints

Reuse existing token-based auth. Client sends `Authorization: Bearer <token>` header. Server validates against config.json users list (same logic as `auth.js`).

## What Stays the Same

- Chat functionality: WebSocket, streaming, session management — unchanged
- Login flow — unchanged
- File ingestion — still via Claude prompts in chat (no upload UI)
- Dark mode — carries through all new pages via existing Tailwind dark mode setup
- User model — no changes to config.json or auth

## Component Structure

New components:
- `AppShell.jsx` — layout wrapper with sidebar nav + content area
- `Sidebar.jsx` — persistent navigation sidebar
- `DashboardView.jsx` — dashboard page
- `FilesView.jsx` — file management page with card grid
- `FileCard.jsx` — individual file card component
- `FileSlideOver.jsx` — slide-over panel for viewing document content
- `TagFilter.jsx` — tag chip filter bar

Modified components:
- `App.jsx` — add hash-based routing, wrap views in AppShell
- `ChatView.jsx` — integrate session sidebar as internal panel (no longer top-level)
- `LoginScreen.jsx` — redirect to `#/dashboard` after login instead of directly to chat

## Data Flow

1. On Dashboard/Files mount → `GET /api/files` → server reads user's INDEX.md → parses entries → returns JSON
2. File card click (document) → `GET /api/files/:path/content` → server reads markdown file → returns content → rendered in slide-over
3. File card click (web link) → `window.open(url, '_blank')`
4. File delete → confirm dialog → `DELETE /api/files/:path` → server deletes file + updates INDEX.md → refresh file list
5. Dashboard chat prompt submit → create new session → navigate to `#/chat` → send message via WebSocket
