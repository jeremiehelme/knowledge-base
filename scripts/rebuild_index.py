#!/usr/bin/env python3
"""
rebuild_index.py — Parcourt tous les fichiers sources et (re)génère INDEX.md.

Ce script lit le front matter YAML de chaque fichier markdown dans sources/
et construit un index structuré par catégorie, avec résumés et tags.

Usage:
    python scripts/rebuild_index.py

L'INDEX.md généré peut ensuite être enrichi par un LLM pour ajouter des résumés
plus détaillés et des liens croisés entre documents.
"""

import re
import sys
from datetime import datetime
from pathlib import Path


def parse_frontmatter(filepath: Path) -> dict:
    """Parse le front matter YAML simplifié d'un fichier markdown."""
    content = filepath.read_text(encoding="utf-8")
    meta = {"filepath": str(filepath)}

    # Extraire le front matter entre ---
    match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
    if not match:
        # Pas de front matter, utiliser le nom du fichier
        meta["title"] = filepath.stem.replace("-", " ").title()
        meta["type"] = "unknown"
        meta["tags"] = []
        meta["word_count"] = len(content.split())
        meta["first_lines"] = " ".join(content.split()[:50])
        return meta

    fm_text = match.group(1)

    # Parser les champs simples
    for line in fm_text.split("\n"):
        if ":" in line:
            key, _, value = line.partition(":")
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key == "tags":
                # Parse [tag1, tag2, tag3]
                tags_match = re.search(r"\[(.*?)\]", value)
                if tags_match:
                    meta["tags"] = [t.strip() for t in tags_match.group(1).split(",") if t.strip()]
                else:
                    meta["tags"] = []
            else:
                meta[key] = value

    if "tags" not in meta:
        meta["tags"] = []

    # Extraire le body (après le front matter)
    body = content[match.end():].strip()
    meta["word_count"] = len(body.split())
    # Premiers ~50 mots comme aperçu
    meta["first_lines"] = " ".join(body.split()[:50])

    return meta


def build_index(base_dir: Path) -> str:
    """Construit le contenu de l'INDEX.md."""
    sources_dir = base_dir / "sources"
    categories = {
        "articles": ("📄 Articles & PDFs", sources_dir / "articles"),
        "web": ("🌐 Pages Web", sources_dir / "web"),
        "notes": ("📝 Notes & Comptes-rendus", sources_dir / "notes"),
    }

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    total_docs = 0
    total_words = 0
    all_tags = set()
    sections = []

    for cat_key, (cat_title, cat_dir) in categories.items():
        if not cat_dir.exists():
            continue

        files = sorted(cat_dir.glob("*.md"), reverse=True)
        if not files:
            continue

        entries = []
        for f in files:
            meta = parse_frontmatter(f)
            total_docs += 1
            total_words += meta.get("word_count", 0)
            all_tags.update(meta.get("tags", []))

            title = meta.get("title", f.stem)
            tags_str = ", ".join(f"`{t}`" for t in meta.get("tags", []))
            date = meta.get("added_date", "")
            word_count = meta.get("word_count", 0)
            preview = meta.get("first_lines", "")[:150]
            rel_path = f.relative_to(base_dir)

            entry = f"### [{title}]({rel_path})\n"
            entry += f"- **Date ajout**: {date} | **Mots**: ~{word_count}"
            if tags_str:
                entry += f" | **Tags**: {tags_str}"
            entry += "\n"
            if meta.get("source_url"):
                entry += f"- **Source**: {meta['source_url']}\n"
            if preview:
                entry += f"- **Aperçu**: {preview}...\n"
            entry += f"- **Résumé LLM**: _À compléter par l'agent IA_\n"
            entries.append(entry)

        section = f"## {cat_title}\n\n" + "\n".join(entries)
        sections.append(section)

    # Tags index
    tags_section = ""
    if all_tags:
        tags_section = "## 🏷️ Index par Tags\n\n"
        for tag in sorted(all_tags):
            tags_section += f"- `{tag}`\n"
        tags_section += "\n"

    # Assemblage final
    index = f"""# 📚 INDEX — Base de Connaissances

> Dernière mise à jour: {now}
> Documents: {total_docs} | Mots total: ~{total_words:,}

---

{tags_section}{"---" if tags_section else ""}

{chr(10).join(sections)}

---

## 🤖 Notes pour l'Agent IA

Quand tu recherches dans cette base :
1. Lis d'abord cet INDEX.md pour identifier les documents pertinents
2. Consulte ensuite les documents spécifiques via leur chemin relatif
3. Croise les informations de plusieurs sources quand c'est pertinent
4. Cite toujours tes sources avec le titre et le chemin du document

Pour enrichir cet index, lance : `python scripts/rebuild_index.py`
Puis demande à l'agent IA de compléter les résumés marqués "_À compléter_".
"""

    return index


def main():
    base_dir = Path(__file__).resolve().parent.parent
    index_content = build_index(base_dir)

    index_path = base_dir / "INDEX.md"
    index_path.write_text(index_content, encoding="utf-8")

    print(f"✅ INDEX.md régénéré: {index_path}")
    print()
    print("💡 Prochaine étape: demande à l'agent IA de compléter les résumés.")


if __name__ == "__main__":
    main()
