# Knowledge Base — Workshop Brainstorm

Base de connaissances collaborative pour agreger, indexer et exploiter les documents d'un projet via un agent IA.

Inspire de [l'approche d'Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595) : pas de RAG complexe, juste des fichiers markdown bien structures + un index intelligent que le LLM sait naviguer.

## Quick Start

### 1. Ouvrir le projet avec Claude Code

```bash
cd knowledge-base
claude
```

Aucune installation requise. Toutes les operations utilisent les outils natifs de Claude (WebFetch, Read, Write, Glob, Grep).

### 2. Ajouter des documents

Parle naturellement a Claude :

```
ajoute https://example.com/article
ajoute le PDF ~/Documents/rapport.pdf
note que le client prefere l'option B pour le pricing
```

Claude extrait le contenu, le convertit en markdown, genere des tags intelligents, redige un resume, et met a jour l'index automatiquement.

### 3. Interroger la base

```
que sait-on sur le pricing ?
compare les options A et B selon nos sources
prepare un briefing pour le workshop
```

Claude croise les sources, cite ses references, et signale les contradictions.

## Structure du repo

```
knowledge-base/
├── INDEX.md               ← Index maitre (resumes + tags + liens)
├── sources/
│   ├── articles/          ← PDFs convertis en markdown
│   ├── web/               ← Pages web converties en markdown
│   └── notes/             ← Notes manuelles, CR de reunions
└── wiki/                  ← Syntheses thematiques generees
```

## Les 4 operations

| Commande | Ce qui se passe |
|---|---|
| `ajoute [url/pdf/note]` | **Ingestion** — extrait, tague, resume, indexe |
| `que sait-on sur X ?` | **Recherche** — croise les sources, cite tout |
| `fais une synthese sur X` | **Synthese** — cree une page wiki structuree et sourcee |
| `audite la base` | **Maintenance** — stats, doublons, coherence, gaps |

## Workflow recommande

1. **Avant le workshop** : chaque participant ajoute ses documents/URLs
2. **Enrichir** : demander des syntheses thematiques dans `wiki/`
3. **Pendant le workshop** : utiliser l'agent pour rechercher et croiser les connaissances en temps reel

## Utilisation avec Claude Code

```bash
cd knowledge-base
claude "Lis INDEX.md et resume les 5 documents les plus importants pour notre decision d'architecture"
```

## Contribuer

1. Clone le repo
2. Ajoute tes documents en parlant a Claude
3. Commit et push
4. Les autres membres peuvent pull et interroger la base mise a jour
