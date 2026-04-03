# 🧠 Knowledge Base — Workshop Brainstorm

Base de connaissances collaborative pour agréger, indexer et exploiter les documents du projet via un agent IA.

Inspiré de [l'approche d'Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595) : pas de RAG complexe, juste des fichiers markdown bien structurés + un index intelligent que le LLM sait naviguer.

## Quick Start

### 1. Installation des dépendances

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt
```

> **Note** : Les scripts détectent automatiquement le `.venv` et se relancent avec le bon Python, même si tu oublies d'activer le venv.

### 2. Ajouter des documents

**Ajouter une page web :**
```bash
python scripts/add_url.py https://example.com/article --tags "architecture,api"
```

**Ajouter un PDF :**
```bash
python scripts/add_pdf.py ~/Documents/rapport.pdf --tags "market,strategy"
```

**Ajouter une note manuellement :**
Crée un fichier `.md` dans `sources/notes/` avec ce format :
```markdown
---
title: "Titre de la note"
added_date: 2026-04-03
type: note
tags: [tag1, tag2]
---

# Titre de la note

Contenu ici...
```

### 3. Régénérer l'index

```bash
python scripts/rebuild_index.py
```

### 4. Interroger la base avec l'agent IA

Ouvre une session avec Claude (ou un autre LLM) et utilise le prompt système dans `.prompts/system_prompt.md`. Donne-lui l'INDEX.md comme contexte, et pose tes questions !

**Exemples de questions :**
- "Quels sont les principaux arguments pour et contre une architecture microservices d'après nos sources ?"
- "Résume les 3 documents les plus pertinents sur le positionnement marché"
- "Croise les informations de nos sources sur le pricing et propose des options"

## Structure du repo

```
knowledge-base/
├── README.md              ← Ce fichier
├── INDEX.md               ← Index auto-généré (résumés + tags + liens)
├── sources/
│   ├── articles/          ← PDFs convertis en markdown
│   ├── web/               ← Pages web converties en markdown
│   └── notes/             ← Notes manuelles, CR de réunions
├── wiki/                  ← Synthèses thématiques générées par le LLM
├── scripts/
│   ├── add_url.py         ← Ajouter une URL
│   ├── add_pdf.py         ← Ajouter un PDF
│   └── rebuild_index.py   ← Régénérer l'index
└── .prompts/
    └── system_prompt.md   ← Prompt système pour l'agent IA
```

## Workflow recommandé

1. **Avant le workshop** : Chaque participant ajoute ses documents/URLs pertinents
2. **Rebuild l'index** : `python scripts/rebuild_index.py`
3. **Enrichir** : Demander au LLM de compléter les résumés dans INDEX.md
4. **Générer des wikis** : Demander au LLM de créer des synthèses thématiques dans `wiki/`
5. **Pendant le workshop** : Utiliser l'agent pour rechercher et croiser les connaissances en temps réel

## Utilisation avec Claude Code

Si tu utilises Claude Code, tu peux directement pointer vers ce repo et interagir :

```bash
cd knowledge-base
claude "Lis INDEX.md et résume les 5 documents les plus importants pour notre décision d'architecture"
```

## Contribuer

1. Clone le repo
2. Ajoute tes documents via les scripts
3. Commit et push
4. Les autres membres peuvent pull et interroger la base mise à jour
