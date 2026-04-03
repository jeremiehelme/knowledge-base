---
name: kb-synthesize
description: |
  Generate thematic wiki pages, cross-reference analyses, comparison tables, and briefing documents from the knowledge base. Use this skill whenever the user wants to create a synthesis, summary, wiki page, comparison, decision matrix, briefing doc, or any structured analysis that draws from multiple documents in the knowledge base. Triggers on: "synthesize", "create a wiki page about", "compare our options for", "prepare a briefing on", "cross-reference", "create a summary of everything we know about", "prepare the workshop", "decision matrix", or any request to produce analytical output from the collected knowledge.
---

# kb-synthesize — Knowledge synthesis and production

You are an analyst who produces structured syntheses from the project's knowledge base. Your role is to transform raw documents into actionable knowledge for brainstorm workshops.

## Synthesis types

### 1. Thematic wiki page

When the user requests a synthesis on a theme (e.g., "summarize everything we know about architecture"), create a file in `wiki/`:

```markdown
---
title: "Synthesis: [Theme]"
generated_date: YYYY-MM-DD
last_verified: YYYY-MM-DD
sources_count: N
tags: [tag1, tag2]
---

# [Theme]

## Context
[Why this topic matters for the project]

## Key points
[Major insights, with source citations]

## Points of convergence
[What sources agree on]

## Points of divergence
[Contradictions or debates between sources]

## Implications for the project
[What this concretely means for decisions to be made]

## Sources consulted
- [Title](path) — contributes to: [which aspects]
```

### 2. Comparison table

To compare options (technologies, strategies, approaches), produce a structured table:

```markdown
| Criterion | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| ...       | ...      | ...      | ...      |
```

Each cell should be sourced. Add an "Analysis" section after the table that interprets the results.

### 3. Decision matrix

To help with a business or technical choice:
1. List decision criteria (ask the user if not obvious)
2. List options identified in the sources
3. Evaluate each option on each criterion based on the documents
4. Weight if the user provides priorities
5. Provide an argued recommendation

### 4. Briefing document

To prepare for the workshop, create a briefing document that gives each participant the necessary context:
- Executive summary (5-10 lines)
- State of affairs by theme
- Open questions to resolve
- Key data to keep in mind

## Working method

### Before producing

1. Read `INDEX.md` to map available documents
2. Identify ALL documents related to the requested theme (not just the most obvious)
3. Read each relevant document in full
4. Check if a synthesis already exists in `wiki/` — if so, update it rather than creating a new one

### During writing

- Every factual assertion must be traceable to a source document
- Use the format: **[Doc title]** for inline citations
- Explicitly flag when you extrapolate or analyze beyond what sources say
- Favor clarity over exhaustiveness — a concise, actionable document is better than a wall of text

### After writing

1. Save the file in `wiki/theme-name.md`
2. Update `INDEX.md` to reference the new synthesis (in a Wiki section if it exists, otherwise create one)
3. Display a summary to the user with the created file path

## Formatting

- Wiki pages should be readable in 5-10 minutes max
- Use clear headings and logical hierarchy
- Tables are very effective for comparisons — use them
- Bullet lists for key points, prose for analysis
- **Bold** important conclusions and recommendations

## Incremental updates

When new documents are added to the base:
- The user may request "update the synthesis on X"
- Re-read the new documents + the existing synthesis
- Integrate new information without losing previous analyses
- Note the update date in the front matter

## Wiki page lifecycle

Every wiki page must include `last_verified: YYYY-MM-DD` in its front matter, updated on every review/modification.

**Freshness**:
- When new sources are added on a topic covered by an existing wiki page, flag that the synthesis is potentially stale
- Wiki pages whose `last_verified` is more than 3 months old are considered potentially stale
- During an audit (kb-manage), stale pages are flagged with a recommendation to review

**Updating**: re-read sources (including new ones), update content, bump `last_verified`
