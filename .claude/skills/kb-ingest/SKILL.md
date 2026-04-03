---
name: kb-ingest
description: |
  Ingest documents into the knowledge base: convert URLs to markdown, convert PDFs to markdown, add notes, tag documents, and auto-update the INDEX.md. Use this skill whenever the user wants to add a document, article, URL, PDF, web page, or note to the knowledge base. Also triggers when the user says "ingest", "add to KB", "clip this", "save this article", "import this PDF", or any variation of adding content to the project knowledge base. Even if the user just pastes a URL or mentions a document they want to remember, this skill should activate.
---

# kb-ingest — Document ingestion into the knowledge base

You are an agent specialized in adding documents to a markdown-based knowledge base, inspired by Andrej Karpathy's approach.

## Base structure

The knowledge base is organized as follows in the current directory:

```
sources/
├── articles/    ← PDFs converted to markdown
├── web/         ← Web pages converted to markdown
└── notes/       ← Manual notes, meeting minutes
INDEX.md          ← Master index with summaries and tags
```

## How to ingest a document

### 1. Identify the document type

The user may provide:
- **A URL** → Extract web content and convert to markdown
- **A PDF file** → Extract text and convert to markdown
- **Raw text / a note** → Create a markdown file directly
- **Multiple documents at once** → Process them one by one

### 2. Convert to markdown

For each document, create a markdown file with this format:

```markdown
---
title: "Document title"
source_url: https://... (if applicable)
source_file: name.pdf (if applicable)
added_date: YYYY-MM-DD
type: web | pdf | note
tags: [tag1, tag2, tag3]
author: "Author" (if known)
publication_date: YYYY-MM-DD (if known)
---

# Document title

[Extracted/converted content here]
```

**File naming**: `YYYY-MM-DD-title-as-slug.md`

**Location**:
- URLs / web pages → `sources/web/`
- PDFs → `sources/articles/`
- Notes / raw text → `sources/notes/`

### 3. Content extraction

**For URLs**: use WebFetch to retrieve the page, then convert to clean markdown:
- Remove navigation, sidebars, cookie banners, footers, ads — keep only editorial content
- Preserve structure: headings, lists, tables, code blocks, links
- For very cluttered pages, focus on content within `<article>` or `<main>`

**For tweets/X posts**: X blocks direct scraping. The oembed API (`publish.twitter.com/oembed`) and syndication (`cdn.syndication.twimg.com`) truncate "Note Tweets" (long tweets) to ~275 characters. The reliable method:
1. First try `https://threadreaderapp.com/thread/{tweet_id}.html` via WebFetch — this is the most reliable source for full text of long tweets and threads.
2. As fallback, try oembed: `https://publish.twitter.com/oembed?url={tweet_url}` — sufficient for short tweets (<280 characters).
3. If the `note_tweet` field is present in the syndication response, it's a long tweet and Thread Reader App is needed.

**For PDFs**: use the Read tool which natively supports PDF files:
- For large PDFs (>10 pages), read in page ranges (e.g., `pages: "1-10"`, then `"11-20"`)
- Structure the markdown with `## Page N` headings for navigation
- If Read fails (scanned PDF without OCR), inform the user and suggest OCR alternatives

**For YouTube videos**: ask the user to paste the transcript, or attempt to retrieve subtitles via known transcript endpoints.

**For notes**: ask the user for the content or title, and create the file directly.

### Error handling

| Situation | Action |
|---|---|
| WebFetch fails (timeout, 403, 404) | Inform the user, suggest trying later or providing content manually as a note |
| Unusable HTML (too much noise, no clear content) | Ask the user to paste the article text directly |
| Unreadable PDF (scanned without OCR, encrypted) | Inform the user, suggest an OCR tool or manual text extraction |
| Content behind a paywall / login | Inform the user, suggest saving as PDF first or pasting the content |
| Extraction too short (<50 words) | Warn that extraction seems incomplete, ask to verify |
| Duplicate detected (same URL in INDEX.md) | Warn the user, ask whether to update existing or create a new entry |

### 4. Smart tagging

When the user doesn't provide tags, suggest 3-5 based on the content. Tags should be:
- Lowercase, no spaces (use hyphens)
- Consistent with existing tags in INDEX.md (read it first to see tags already in use)
- Specific enough to be useful for search

### 5. Update INDEX.md

After each ingestion, update `INDEX.md`:

1. Read the current INDEX.md
2. Add an entry for the new document in the right category
3. Include: title, date, tags, word count, and a **2-3 sentence summary** that you write yourself after reading the content
4. If the document is related to other documents in the base, mention cross-references

The summary is crucial — it's what allows the search agent to know if the document is relevant without reading it entirely.

### 6. Confirm to the user

After ingestion, display a recap:
- Document title
- Created file path
- Assigned tags
- Word count
- Generated summary

## Batch ingestion

If the user provides multiple URLs or documents at once, process them sequentially and display a summary table at the end:

| # | Title | Type | Tags | Words |
|---|-------|------|------|-------|
| 1 | ...   | web  | ...  | ...   |
| 2 | ...   | pdf  | ...  | ...   |

## Best practices

- Always read INDEX.md first to know existing tags and maintain consistency
- **Duplicate detection before ingestion**:
  1. Search `source_url` in INDEX.md — exact match = definite duplicate
  2. Compare slugified title — match = likely duplicate
  3. If duplicate found: show the existing entry to the user and ask:
     - **Skip** (don't add)
     - **Update** (replace content, keep same file)
     - **Add anyway** (different angle on the same topic)
- For very long content (> 10000 words), add an executive summary at the top of the markdown file in addition to the summary in the index
- Preserve tables, lists, and structure from the original document as much as possible
