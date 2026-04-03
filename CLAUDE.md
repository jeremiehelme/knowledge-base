# Knowledge Base — Instructions pour Claude

Tu travailles dans une base de connaissances projet structurée en fichiers markdown, inspirée de l'approche d'Andrej Karpathy. Cette base sert à agréger, indexer et exploiter les documents d'un projet pour préparer des workshops de brainstorm et prendre des décisions business et techniques.

## Structure du projet

```
INDEX.md              ← Index maître : résumés, tags et liens de chaque document
sources/
├── articles/         ← PDFs convertis en markdown
├── web/              ← Pages web converties en markdown
└── notes/            ← Notes manuelles, CR de réunions
wiki/                 ← Synthèses thématiques générées
.prompts/             ← Prompt système de référence
```

## Principe fondamental

**INDEX.md est le point d'entrée de tout.** Lis-le en premier pour chaque tâche. Il contient les résumés et tags de tous les documents — c'est ta carte du territoire.

## Comment interpréter les demandes de l'utilisateur

### Ingestion de documents

Quand l'utilisateur dit des choses comme :
- "ajoute [url]", "ingère cette page", "clip cet article", "sauvegarde ce lien"
- "ajoute ce PDF", "importe ce document"
- "note que...", "ajoute une note sur..."

→ Lis la skill `.claude/skills/kb-ingest/SKILL.md` et suis ses instructions.

En résumé : convertis le contenu en markdown, sauvegarde dans le bon sous-dossier de `sources/`, tague intelligemment (en cohérence avec les tags existants dans INDEX.md), rédige un résumé, et mets à jour INDEX.md.

### Recherche et questions

Quand l'utilisateur dit des choses comme :
- "que sait-on sur X ?", "cherche Y dans la base", "trouve les docs sur Z"
- "quelles sont nos sources sur...", "qu'est-ce qu'on a comme info sur..."
- Toute question dont la réponse pourrait se trouver dans les documents collectés

→ Lis la skill `.claude/skills/kb-search/SKILL.md` et suis ses instructions.

En résumé : lis INDEX.md, identifie les documents pertinents, lis-les en profondeur, croise les sources, et cite toujours d'où vient l'info.

### Synthèses et analyses

Quand l'utilisateur dit des choses comme :
- "fais une synthèse sur...", "crée une page wiki sur..."
- "compare les options pour...", "matrice de décision sur..."
- "prépare un briefing pour le workshop"

→ Lis la skill `.claude/skills/kb-synthesize/SKILL.md` et suis ses instructions.

En résumé : produis un document structuré et sourcé dans `wiki/`, mets à jour INDEX.md.

### Maintenance de la base

Quand l'utilisateur dit des choses comme :
- "audite la base", "stats de la KB", "combien de docs on a ?"
- "retague les documents", "trouve les doublons", "qu'est-ce qui manque ?"
- "reconstruis l'index"

→ Lis la skill `.claude/skills/kb-manage/SKILL.md` et suis ses instructions.

## Règles générales

- **Toujours citer les sources** avec le format : **[Titre]** (`sources/categorie/fichier.md`)
- **Ne jamais inventer** d'information qui n'est pas dans les documents
- **Cohérence des tags** : avant de tagger, lis INDEX.md pour voir les tags existants et les réutiliser
- **Markdown front matter** : chaque fichier source a un front matter YAML (title, date, type, tags)
- **Pas de dépendance externe** : toutes les opérations (ingestion, recherche, synthèse, maintenance) utilisent les outils natifs de Claude (WebFetch, Read, Write, Edit, Glob, Grep)

## Exemples de commandes naturelles

| Ce que dit l'utilisateur | Ce que tu fais |
|---|---|
| `ajoute https://example.com/article` | Ingestion → skill kb-ingest |
| `ajoute le PDF rapport.pdf` | Ingestion → skill kb-ingest |
| `que sait-on sur le pricing ?` | Recherche → skill kb-search |
| `compare React vs Vue selon nos sources` | Synthèse → skill kb-synthesize |
| `prépare le briefing du workshop` | Synthèse → skill kb-synthesize |
| `combien de docs on a ?` | Maintenance → skill kb-manage |
| `quels sujets ne sont pas couverts ?` | Maintenance → skill kb-manage (gap analysis) |
