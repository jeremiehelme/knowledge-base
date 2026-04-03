#!/usr/bin/env python3
"""
add_url.py — Convertit une page web en fichier markdown et l'ajoute à la base de connaissances.

Usage:
    python scripts/add_url.py <url> [--tags tag1,tag2] [--title "Custom Title"]

Exemple:
    python scripts/add_url.py https://example.com/article --tags "architecture,microservices"
"""

import sys
from pathlib import Path

# Auto-détection du venv avant tout import de dépendance
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _venv_check import ensure_venv
ensure_venv()

import argparse
import os
import re
from datetime import datetime
from urllib.parse import urlparse

import trafilatura


def slugify(text: str) -> str:
    """Convertit un titre en slug pour le nom de fichier."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


def extract_content(url: str) -> dict:
    """Extrait le contenu d'une URL et le convertit en markdown."""
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        print(f"❌ Impossible de télécharger: {url}")
        sys.exit(1)

    # Extraire le texte en markdown
    content = trafilatura.extract(
        downloaded,
        output_format="markdown",
        include_links=True,
        include_images=False,
        include_tables=True,
    )

    if not content:
        print(f"❌ Impossible d'extraire le contenu de: {url}")
        sys.exit(1)

    # Extraire les métadonnées
    metadata = trafilatura.extract(
        downloaded,
        output_format="json",
        only_with_metadata=False,
    )

    title = None
    author = None
    date = None

    if metadata:
        import json
        try:
            meta = json.loads(metadata)
            title = meta.get("title")
            author = meta.get("author")
            date = meta.get("date")
        except json.JSONDecodeError:
            pass

    return {
        "content": content,
        "title": title or urlparse(url).netloc,
        "author": author,
        "date": date,
        "url": url,
    }


def save_as_markdown(data: dict, tags: list[str], custom_title: str | None, base_dir: Path) -> Path:
    """Sauvegarde le contenu extrait en fichier markdown avec front matter."""
    title = custom_title or data["title"]
    slug = slugify(title)
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f"{today}-{slug}.md"
    filepath = base_dir / "sources" / "web" / filename

    # Front matter YAML
    frontmatter_lines = [
        "---",
        f'title: "{title}"',
        f"source_url: {data['url']}",
        f"added_date: {today}",
        f"type: web",
    ]
    if data["author"]:
        frontmatter_lines.append(f'author: "{data["author"]}"')
    if data["date"]:
        frontmatter_lines.append(f"publication_date: {data['date']}")
    if tags:
        frontmatter_lines.append(f"tags: [{', '.join(tags)}]")
    frontmatter_lines.append("---")
    frontmatter = "\n".join(frontmatter_lines)

    full_content = f"{frontmatter}\n\n# {title}\n\n{data['content']}\n"

    filepath.write_text(full_content, encoding="utf-8")
    return filepath


def main():
    parser = argparse.ArgumentParser(description="Ajouter une URL à la base de connaissances")
    parser.add_argument("url", help="URL de la page à ajouter")
    parser.add_argument("--tags", default="", help="Tags séparés par des virgules (ex: architecture,backend)")
    parser.add_argument("--title", default=None, help="Titre personnalisé (optionnel)")
    args = parser.parse_args()

    # Trouver la racine du projet
    base_dir = Path(__file__).resolve().parent.parent
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]

    print(f"📥 Extraction de: {args.url}")
    data = extract_content(args.url)

    filepath = save_as_markdown(data, tags, args.title, base_dir)
    print(f"✅ Sauvegardé: {filepath.relative_to(base_dir)}")
    print(f"   Titre: {data['title']}")
    print(f"   Mots: ~{len(data['content'].split())}")
    print()
    print("💡 N'oublie pas de lancer: python scripts/rebuild_index.py")


if __name__ == "__main__":
    main()
