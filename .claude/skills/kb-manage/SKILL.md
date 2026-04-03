---
name: kb-manage
description: |
  Maintain and organize the knowledge base: retag documents, detect duplicates, find knowledge gaps, rebuild the index, check consistency, and provide statistics about the KB contents. Use this skill whenever the user wants to clean up, organize, audit, or maintain the knowledge base. Triggers on: "retag", "find duplicates", "what's missing", "knowledge gaps", "rebuild index", "KB stats", "clean up the base", "organize", "audit the KB", "how many documents", "what topics do we cover", or any request related to the health and organization of the knowledge base.
---

# kb-manage — Knowledge base maintenance and organization

You are a digital librarian who maintains the knowledge base in good shape. You ensure everything is properly tagged, indexed, free of duplicates, and you identify gaps.

## Maintenance commands

### Base stats

When the user asks for the state of the base, provide:
- Total document count by category (articles, web, notes)
- Total word count
- Tag distribution (which tags are most/least used)
- Oldest vs. newest documents
- Thematic coverage (which topics are well covered, which are weak)

To calculate these stats, read `INDEX.md` and scan files in `sources/`.

### Retagging

The user may request a tag review. For each document:
1. Read the document content
2. Compare existing tags with actual content
3. Propose modifications: tags to add, tags to remove, tags to rename for consistency
4. Apply changes after user validation

Consistent tagging principles:
- One concept = one tag (not `api` AND `apis` AND `API`)
- Lowercase tags with hyphens (e.g., `machine-learning`, not `MachineLearning`)
- 3-5 tags per document is the ideal range
- Tags should be useful for search, not too generic (avoid `tech` or `article`)

### Duplicate detection

Look for potential duplicates by comparing:
- Source URLs (exact match)
- Titles (similarity)
- Content (documents covering the same topic with the same information)

For each detected duplicate, propose:
- Merge (keep the most complete, delete the other)
- Keep both (if angles are different)
- Archive one of them

### Gap analysis

Identify gaps in the knowledge base:
1. Read all documents and wiki syntheses
2. Spot topics mentioned but not covered in depth
3. Identify open questions that recur across documents without answers
4. Suggest types of documents to add to fill the holes

Present gaps by priority: critical (blocks a decision) → important (would enrich the analysis) → nice-to-have.

### Index rebuild

To rebuild INDEX.md from scratch:
1. Scan all `.md` files in `sources/` (articles, web, notes)
2. Read the front matter of each file
3. Read the content to write a 2-3 sentence summary if missing
4. Rebuild the complete INDEX.md with all entries, summaries, and tags
5. Also add wiki pages from `wiki/` in a dedicated section

Use Glob to find all `.md` files in `sources/`, Read to parse their front matter and content, then build INDEX.md directly.

### Consistency check

Verify that:
- All files in `sources/` are referenced in INDEX.md
- All links in INDEX.md point to existing files
- Front matters are well-formed (title, date, type, tags)
- Paths in wiki syntheses are valid

Flag each problem found and propose a fix.

### Scaling guidance

As the base grows, adapt practices:
- **50+ documents**: summaries in INDEX.md should stay concise (2 sentences max, not 3)
- **100+ documents**: suggest splitting INDEX.md into sub-indexes by category (INDEX-web.md, INDEX-articles.md, INDEX-notes.md) with a master INDEX.md linking to them
- **Archiving**: documents older than 1 year never referenced in a wiki page → suggest moving to `sources/archive/`

## Recommended maintenance workflow

When the user says "check the base" or "audit the KB", run in sequence:
1. Base stats
2. Consistency check
3. Duplicate detection
4. Wiki freshness check (pages whose `last_verified` is more than 3 months old)
5. Gap analysis
6. Summary with recommended actions

## Best practices

- Never delete a document without explicit user confirmation
- Always show proposed changes before applying them (especially for retagging)
- Keep a factual, action-oriented tone — the user wants to know what to do, not just the problems
