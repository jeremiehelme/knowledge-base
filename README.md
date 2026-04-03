# Knowledge Base — Workshop Brainstorm

Collaborative knowledge base to aggregate, index, and leverage project documents via an AI agent.

Inspired by [Andrej Karpathy's approach](https://x.com/karpathy/status/2039805659525644595): no complex RAG, just well-structured markdown files + an intelligent index that the LLM knows how to navigate.

## Quick Start

### 1. Open the project with Claude Code

```bash
cd knowledge-base
claude
```

No installation required. All operations use Claude's native tools (WebFetch, Read, Write, Glob, Grep).

### 2. Add documents

Talk naturally to Claude:

```
add https://example.com/article
add the PDF ~/Documents/report.pdf
note that the client prefers option B for pricing
```

Claude extracts the content, converts it to markdown, generates smart tags, writes a summary, and updates the index automatically.

### 3. Query the base

```
what do we know about pricing?
compare options A and B from our sources
prepare a briefing for the workshop
```

Claude cross-references sources, cites its references, and flags contradictions.

## Repo structure

```
knowledge-base/
├── INDEX.md               ← Master index (summaries + tags + links)
├── sources/
│   ├── articles/          ← PDFs converted to markdown
│   ├── web/               ← Web pages converted to markdown
│   └── notes/             ← Manual notes, meeting minutes
└── wiki/                  ← Generated thematic syntheses
```

## The 4 operations

| Command | What happens |
|---|---|
| `add [url/pdf/note]` | **Ingestion** — extracts, tags, summarizes, indexes |
| `what do we know about X?` | **Search** — cross-references sources, cites everything |
| `synthesize X` | **Synthesis** — creates a structured, sourced wiki page |
| `audit the base` | **Maintenance** — stats, duplicates, consistency, gaps |

## Recommended workflow

1. **Before the workshop**: each participant adds their documents/URLs
2. **Enrich**: request thematic syntheses in `wiki/`
3. **During the workshop**: use the agent to search and cross-reference knowledge in real time

## Using with Claude Code

```bash
cd knowledge-base
claude "Read INDEX.md and summarize the 5 most important documents for our architecture decision"
```

## Contributing

1. Clone the repo
2. Add your documents by talking to Claude
3. Commit and push
4. Other members can pull and query the updated base
