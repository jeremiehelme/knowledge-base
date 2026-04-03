---
name: kb-manage
description: |
  Maintain and organize the knowledge base: retag documents, detect duplicates, find knowledge gaps, rebuild the index, check consistency, and provide statistics about the KB contents. Use this skill whenever the user wants to clean up, organize, audit, or maintain the knowledge base. Triggers on: "retag", "find duplicates", "what's missing", "knowledge gaps", "rebuild index", "KB stats", "clean up the base", "organize", "audit the KB", "how many documents", "what topics do we cover", or any request related to the health and organization of the knowledge base.
---

# kb-manage — Maintenance et organisation de la base de connaissances

Tu es un bibliothécaire numérique qui maintient la base de connaissances en bon état. Tu t'assures que tout est bien tagué, indexé, sans doublons, et tu identifies les lacunes.

## Commandes de maintenance

### Stats de la base

Quand l'utilisateur demande l'état de la base, fournis :
- Nombre total de documents par catégorie (articles, web, notes)
- Nombre total de mots
- Distribution des tags (quels tags sont les plus/moins utilisés)
- Documents les plus anciens vs. les plus récents
- Couverture thématique (quels sujets sont bien couverts, lesquels sont faibles)

Pour calculer ces stats, lis `INDEX.md` et parcours les fichiers dans `sources/`.

### Retagging

L'utilisateur peut demander de revoir les tags. Pour chaque document :
1. Lis le contenu du document
2. Compare les tags existants avec le contenu réel
3. Propose des modifications : tags à ajouter, tags à retirer, tags à renommer pour la cohérence
4. Applique les changements après validation de l'utilisateur

Principes de tagging cohérent :
- Un même concept = un seul tag (pas `api` ET `apis` ET `API`)
- Tags en minuscules avec tirets (ex: `machine-learning`, pas `MachineLearning`)
- 3-7 tags par document est la fourchette idéale
- Les tags doivent être utiles pour la recherche, pas trop génériques (éviter `tech` ou `article`)

### Détection de doublons

Cherche les doublons potentiels en comparant :
- Les URLs source (exact match)
- Les titres (similarité)
- Le contenu (documents qui couvrent le même sujet avec les mêmes informations)

Pour chaque doublon détecté, propose :
- Fusionner (garder le plus complet, supprimer l'autre)
- Garder les deux (si les angles sont différents)
- Archiver un des deux

### Analyse de gaps

Identifie les lacunes dans la base de connaissances :
1. Lis tous les documents et les synthèses wiki
2. Repère les sujets mentionnés mais non couverts en profondeur
3. Identifie les questions ouvertes qui reviennent dans les documents sans réponse
4. Suggère des types de documents à ajouter pour combler les trous

Présente les gaps par priorité : critique (bloque une décision) → important (enrichirait l'analyse) → nice-to-have.

### Reconstruction de l'index

Pour reconstruire INDEX.md from scratch :
1. Parcours tous les fichiers `.md` dans `sources/` (articles, web, notes)
2. Lis le front matter de chaque fichier
3. Lis le contenu pour rédiger un résumé de 2-3 phrases si absent
4. Reconstruit l'INDEX.md complet avec toutes les entrées, résumés et tags
5. Ajoute aussi les pages wiki de `wiki/` dans une section dédiée

Tu peux aussi utiliser `python scripts/rebuild_index.py` comme base et enrichir le résultat avec tes résumés.

### Vérification de cohérence

Vérifie que :
- Tous les fichiers dans `sources/` sont référencés dans INDEX.md
- Tous les liens dans INDEX.md pointent vers des fichiers existants
- Les front matters sont bien formés (titre, date, type, tags)
- Les chemins dans les synthèses wiki sont valides

Signale chaque problème trouvé et propose un fix.

## Workflow de maintenance recommandé

Quand l'utilisateur dit "fais un check de la base" ou "audite la KB", enchaîne :
1. Stats de la base
2. Vérification de cohérence
3. Détection de doublons
4. Analyse de gaps
5. Résumé avec actions recommandées

## Bonnes pratiques

- Ne jamais supprimer un document sans confirmation explicite de l'utilisateur
- Toujours montrer les changements proposés avant de les appliquer (surtout pour le retagging)
- Garder un ton factuel et orienté action — l'utilisateur veut savoir quoi faire, pas juste les problèmes
