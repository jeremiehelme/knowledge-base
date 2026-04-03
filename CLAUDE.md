# Knowledge Base — Instructions for Claude

You work in a project knowledge base structured as markdown files, inspired by Andrej Karpathy's approach. This base is used to aggregate, index, and leverage project documents for brainstorm workshops and business/technical decisions.

## Project structure

```
INDEX.md              ← Master index: summaries, tags, and links for each document
sources/
├── articles/         ← PDFs converted to markdown
├── web/              ← Web pages converted to markdown
└── notes/            ← Manual notes, meeting minutes
wiki/                 ← Generated thematic syntheses
```

## Core principle

**INDEX.md is the entry point for everything.** Read it first for every task. It contains summaries and tags for all documents — it's your map of the territory.

## How to interpret user requests

### Document ingestion

When the user says things like:
- "add [url]", "ingest this page", "clip this article", "save this link"
- "add this PDF", "import this document"
- "note that...", "add a note about..."

→ Read the skill `.claude/skills/kb-ingest/SKILL.md` and follow its instructions.

In short: convert the content to markdown, save in the right subfolder of `sources/`, tag intelligently (consistent with existing tags in INDEX.md), write a summary, and update INDEX.md.

### Search and questions

When the user says things like:
- "what do we know about X?", "search Y in the base", "find docs about Z"
- "what are our sources on...", "what info do we have about..."
- Any question whose answer could be found in the collected documents

→ Read the skill `.claude/skills/kb-search/SKILL.md` and follow its instructions.

In short: read INDEX.md, identify relevant documents, read them in depth, cross-reference sources, and always cite where the info comes from.

### Syntheses and analyses

When the user says things like:
- "synthesize...", "create a wiki page about..."
- "compare options for...", "decision matrix for..."
- "prepare a briefing for the workshop"

→ Read the skill `.claude/skills/kb-synthesize/SKILL.md` and follow its instructions.

In short: produce a structured, sourced document in `wiki/`, update INDEX.md.

### Base maintenance

When the user says things like:
- "audit the base", "KB stats", "how many docs do we have?"
- "retag the documents", "find duplicates", "what's missing?"
- "rebuild the index"

→ Read the skill `.claude/skills/kb-manage/SKILL.md` and follow its instructions.

## General rules

- **Always cite sources** using the format: **[Title]** (`sources/category/file.md`)
- **Never invent** information that is not in the documents
- **Tag consistency**: before tagging, read INDEX.md to see existing tags and reuse them
- **Markdown front matter**: every source file has a YAML front matter (title, date, type, tags)
- **No external dependencies**: all operations (ingestion, search, synthesis, maintenance) use Claude's native tools (WebFetch, Read, Write, Edit, Glob, Grep)

## Skill responsibilities

| Responsibility | Owner skill |
|---|---|
| Create files in sources/ | kb-ingest |
| Update INDEX.md (add entry) | kb-ingest |
| Rebuild INDEX.md from scratch | kb-manage |
| Create/update wiki/ pages | kb-synthesize |
| Verify index consistency | kb-manage |
| Read and cross-reference sources | kb-search |

## Natural command examples

| What the user says | What you do |
|---|---|
| `add https://example.com/article` | Ingestion → skill kb-ingest |
| `add the PDF report.pdf` | Ingestion → skill kb-ingest |
| `what do we know about pricing?` | Search → skill kb-search |
| `compare React vs Vue from our sources` | Synthesis → skill kb-synthesize |
| `prepare the workshop briefing` | Synthesis → skill kb-synthesize |
| `how many docs do we have?` | Maintenance → skill kb-manage |
| `what topics aren't covered?` | Maintenance → skill kb-manage (gap analysis) |
