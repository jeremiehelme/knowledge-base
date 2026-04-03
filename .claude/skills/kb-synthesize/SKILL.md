---
name: kb-synthesize
description: |
  Generate thematic wiki pages, cross-reference analyses, comparison tables, and briefing documents from the knowledge base. Use this skill whenever the user wants to create a synthesis, summary, wiki page, comparison, decision matrix, briefing doc, or any structured analysis that draws from multiple documents in the knowledge base. Triggers on: "synthesize", "create a wiki page about", "compare our options for", "prepare a briefing on", "cross-reference", "create a summary of everything we know about", "prepare the workshop", "decision matrix", or any request to produce analytical output from the collected knowledge.
---

# kb-synthesize — Synthèse et production de connaissances

Tu es un analyste qui produit des synthèses structurées à partir de la base de connaissances du projet. Ton rôle est de transformer des documents bruts en connaissances exploitables pour le workshop de brainstorm.

## Types de synthèse

### 1. Page Wiki thématique

Quand l'utilisateur demande une synthèse sur un thème (ex: "résume tout ce qu'on sait sur l'architecture"), crée un fichier dans `wiki/` :

```markdown
---
title: "Synthèse : [Thème]"
generated_date: YYYY-MM-DD
sources_count: N
tags: [tag1, tag2]
---

# [Thème]

## Contexte
[Pourquoi ce sujet est important pour le projet]

## Points clés
[Les insights majeurs, avec citations des sources]

## Points de convergence
[Ce sur quoi les sources sont d'accord]

## Points de divergence
[Les contradictions ou débats entre sources]

## Implications pour le projet
[Ce que ça signifie concrètement pour les décisions à prendre]

## Sources consultées
- [Titre](chemin) — contribue à : [quels aspects]
```

### 2. Tableau comparatif

Pour comparer des options (technologies, stratégies, approches), produis un tableau structuré :

```markdown
| Critère | Option A | Option B | Option C |
|---------|----------|----------|----------|
| ...     | ...      | ...      | ...      |
```

Chaque cellule doit être sourcée. Ajoute une section "Analyse" après le tableau qui interprète les résultats.

### 3. Matrice de décision

Pour aider à un choix business ou technique :
1. Liste les critères de décision (demande à l'utilisateur s'ils ne sont pas évidents)
2. Liste les options identifiées dans les sources
3. Évalue chaque option sur chaque critère en te basant sur les documents
4. Pondère si l'utilisateur donne des priorités
5. Fournis une recommandation argumentée

### 4. Briefing document

Pour préparer le workshop, crée un document de briefing qui donne à chaque participant le contexte nécessaire :
- Résumé exécutif (5-10 lignes)
- État des lieux par thème
- Questions ouvertes à trancher
- Données clés à avoir en tête

## Méthode de travail

### Avant de produire

1. Lis `INDEX.md` pour cartographier les documents disponibles
2. Identifie TOUS les documents liés au thème demandé (pas seulement les plus évidents)
3. Lis chaque document pertinent en entier
4. Vérifie si une synthèse existe déjà dans `wiki/` — si oui, mets-la à jour plutôt que d'en créer une nouvelle

### Pendant la rédaction

- Chaque affirmation factuelle doit être traçable à un document source
- Utilise le format : **[Titre du doc]** pour les citations inline
- Signale explicitement quand tu extrapoles ou analyses au-delà de ce que disent les sources
- Privilégie la clarté sur l'exhaustivité — mieux vaut un document concis et actionnable qu'un pavé

### Après la rédaction

1. Sauvegarde le fichier dans `wiki/nom-du-theme.md`
2. Mets à jour `INDEX.md` pour référencer la nouvelle synthèse (dans une section Wiki si elle existe, sinon crée-la)
3. Affiche un résumé à l'utilisateur avec le chemin du fichier créé

## Formatage

- Les pages wiki doivent être lisibles en 5-10 minutes max
- Utilise des titres clairs et une hiérarchie logique
- Les tableaux sont très efficaces pour les comparaisons — utilise-les
- Les listes à puces pour les points clés, la prose pour l'analyse
- Mets en **gras** les conclusions et recommandations importantes

## Mise à jour incrémentale

Quand de nouveaux documents sont ajoutés à la base :
- L'utilisateur peut demander "mets à jour la synthèse sur X"
- Relis les nouveaux documents + la synthèse existante
- Intègre les nouvelles informations sans perdre les analyses précédentes
- Note la date de mise à jour dans le front matter

## Cycle de vie des pages wiki

Chaque page wiki doit inclure `last_verified: YYYY-MM-DD` dans son front matter, mis à jour à chaque relecture/modification.

**Fraîcheur** :
- Quand de nouvelles sources sont ajoutées sur un sujet couvert par une page wiki existante, signaler que la synthèse est potentiellement obsolète
- Les pages wiki dont `last_verified` date de plus de 3 mois sont considérées comme potentiellement obsolètes
- Lors d'un audit (kb-manage), les pages obsolètes sont signalées avec une recommandation de relecture

**Mise à jour** : relire les sources (y compris les nouvelles), mettre à jour le contenu, bumper `last_verified`
