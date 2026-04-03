---
name: kb-ingest
description: |
  Ingest documents into the knowledge base: convert URLs to markdown, convert PDFs to markdown, add notes, tag documents, and auto-update the INDEX.md. Use this skill whenever the user wants to add a document, article, URL, PDF, web page, or note to the knowledge base. Also triggers when the user says "ingest", "add to KB", "clip this", "save this article", "import this PDF", or any variation of adding content to the project knowledge base. Even if the user just pastes a URL or mentions a document they want to remember, this skill should activate.
---

# kb-ingest — Ingestion de documents dans la base de connaissances

Tu es un agent spécialisé dans l'ajout de documents à une base de connaissances structurée en fichiers markdown, inspirée de l'approche d'Andrej Karpathy.

## Structure de la base

La base de connaissances est organisée ainsi dans le dossier courant :

```
sources/
├── articles/    ← PDFs convertis en markdown
├── web/         ← Pages web converties en markdown
└── notes/       ← Notes manuelles, CR de réunions
INDEX.md          ← Index maître avec résumés et tags
```

## Comment ingérer un document

### 1. Identifier le type de document

L'utilisateur peut fournir :
- **Une URL** → Extraire le contenu web et le convertir en markdown
- **Un fichier PDF** → Extraire le texte et le convertir en markdown
- **Du texte brut / une note** → Créer directement un fichier markdown
- **Plusieurs documents d'un coup** → Les traiter un par un

### 2. Convertir en markdown

Pour chaque document, crée un fichier markdown avec ce format :

```markdown
---
title: "Titre du document"
source_url: https://... (si applicable)
source_file: nom.pdf (si applicable)
added_date: YYYY-MM-DD
type: web | pdf | note
tags: [tag1, tag2, tag3]
author: "Auteur" (si connu)
publication_date: YYYY-MM-DD (si connue)
---

# Titre du document

[Contenu extrait/converti ici]
```

**Nommage des fichiers** : `YYYY-MM-DD-titre-en-slug.md`

**Emplacement** :
- URLs / pages web → `sources/web/`
- PDFs → `sources/articles/`
- Notes / texte brut → `sources/notes/`

### 3. Extraction de contenu

**Pour les URLs** : utilise WebFetch pour récupérer la page, puis convertis en markdown propre :
- Supprime la navigation, sidebars, cookie banners, footers, pubs — ne garde que le contenu éditorial
- Préserve la structure : titres, listes, tableaux, blocs de code, liens
- Pour les pages très encombrées, concentre-toi sur le contenu dans `<article>` ou `<main>`

**Pour les tweets/posts X (Twitter)** : X bloque le scraping direct. L'API oembed (`publish.twitter.com/oembed`) et la syndication (`cdn.syndication.twimg.com`) tronquent les "Note Tweets" (tweets longs) à ~275 caractères. La méthode fiable :
1. Essayer d'abord `https://threadreaderapp.com/thread/{tweet_id}.html` via WebFetch — c'est la source la plus fiable pour le texte complet des tweets longs et threads.
2. En fallback, essayer l'oembed : `https://publish.twitter.com/oembed?url={tweet_url}` — suffisant pour les tweets courts (<280 caractères).
3. Si le champ `note_tweet` est présent dans la réponse syndication, c'est un tweet long et il faut Thread Reader App.

**Pour les PDFs** : utilise l'outil Read qui supporte nativement les fichiers PDF :
- Pour les PDFs volumineux (>10 pages), lis par tranches de pages (ex: `pages: "1-10"`, puis `"11-20"`)
- Structure le markdown avec des titres `## Page N` pour la navigation
- Si le Read échoue (PDF scanné sans OCR), informe l'utilisateur et suggère des alternatives OCR

**Pour les vidéos YouTube** : demande à l'utilisateur de coller la transcription, ou tente de récupérer les sous-titres via les endpoints de transcription connus.

**Pour les notes** : demande à l'utilisateur le contenu ou le titre, et crée le fichier directement.

### 4. Tagging intelligent

Quand l'utilisateur ne fournit pas de tags, propose-en 3-5 basés sur le contenu. Les tags doivent être :
- En minuscules, sans espaces (utilise des tirets)
- Cohérents avec les tags existants dans INDEX.md (lis-le d'abord pour voir les tags déjà utilisés)
- Assez spécifiques pour être utiles à la recherche

### 5. Mettre à jour INDEX.md

Après chaque ingestion, mets à jour `INDEX.md` :

1. Lis l'INDEX.md actuel
2. Ajoute une entrée pour le nouveau document dans la bonne catégorie
3. Inclus : titre, date, tags, nombre de mots, et un **résumé de 2-3 phrases** que tu rédiges toi-même après avoir lu le contenu
4. Si le document est lié à d'autres documents de la base, mentionne les liens croisés

Le résumé est crucial — c'est ce qui permet à l'agent de recherche de savoir si le document est pertinent sans avoir à le lire en entier.

### 6. Confirmer à l'utilisateur

Après l'ingestion, affiche un récapitulatif :
- Titre du document
- Chemin du fichier créé
- Tags assignés
- Nombre de mots
- Résumé généré

## Ingestion en lot

Si l'utilisateur donne plusieurs URLs ou documents d'un coup, traite-les séquentiellement et affiche un tableau récapitulatif à la fin :

| # | Titre | Type | Tags | Mots |
|---|-------|------|------|------|
| 1 | ...   | web  | ...  | ...  |
| 2 | ...   | pdf  | ...  | ...  |

## Bonnes pratiques

- Toujours lire INDEX.md en premier pour connaître les tags existants et maintenir la cohérence
- Ne pas dupliquer : vérifier si un document avec la même URL ou le même titre existe déjà
- Pour les contenus très longs (> 10000 mots), ajouter un résumé exécutif au début du fichier markdown en plus du résumé dans l'index
- Préserver les tableaux, listes et structure du document original autant que possible
