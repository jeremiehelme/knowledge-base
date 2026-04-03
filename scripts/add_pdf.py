#!/usr/bin/env python3
"""
add_pdf.py — Convertit un PDF en fichier markdown et l'ajoute à la base de connaissances.

Usage:
    python scripts/add_pdf.py <chemin_pdf> [--tags tag1,tag2] [--title "Custom Title"]

Exemple:
    python scripts/add_pdf.py ~/Documents/rapport.pdf --tags "market,analysis" --title "Étude de marché Q1"
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

try:
    import pymupdf  # PyMuPDF
except ImportError:
    import fitz as pymupdf  # ancien nom du package


def slugify(text: str) -> str:
    """Convertit un titre en slug pour le nom de fichier."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text[:80]


def extract_pdf_content(pdf_path: Path) -> dict:
    """Extrait le texte d'un PDF et le convertit en markdown."""
    doc = pymupdf.open(str(pdf_path))

    pages = []
    total_words = 0

    for page_num, page in enumerate(doc, 1):
        text = page.get_text("text")
        if text.strip():
            pages.append(f"## Page {page_num}\n\n{text.strip()}")
            total_words += len(text.split())

    doc.close()

    if not pages:
        print(f"❌ Aucun texte extractible dans: {pdf_path}")
        sys.exit(1)

    return {
        "content": "\n\n---\n\n".join(pages),
        "page_count": len(pages),
        "word_count": total_words,
        "filename": pdf_path.name,
    }


def save_as_markdown(data: dict, title: str, tags: list[str], base_dir: Path) -> Path:
    """Sauvegarde le contenu extrait en fichier markdown avec front matter."""
    slug = slugify(title)
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f"{today}-{slug}.md"
    filepath = base_dir / "sources" / "articles" / filename

    # Front matter YAML
    frontmatter_lines = [
        "---",
        f'title: "{title}"',
        f"source_file: {data['filename']}",
        f"added_date: {today}",
        f"type: pdf",
        f"pages: {data['page_count']}",
    ]
    if tags:
        frontmatter_lines.append(f"tags: [{', '.join(tags)}]")
    frontmatter_lines.append("---")
    frontmatter = "\n".join(frontmatter_lines)

    full_content = f"{frontmatter}\n\n# {title}\n\n{data['content']}\n"

    filepath.write_text(full_content, encoding="utf-8")
    return filepath


def main():
    parser = argparse.ArgumentParser(description="Ajouter un PDF à la base de connaissances")
    parser.add_argument("pdf_path", help="Chemin vers le fichier PDF")
    parser.add_argument("--tags", default="", help="Tags séparés par des virgules")
    parser.add_argument("--title", default=None, help="Titre personnalisé (sinon utilise le nom du fichier)")
    args = parser.parse_args()

    pdf_path = Path(args.pdf_path).resolve()
    if not pdf_path.exists():
        print(f"❌ Fichier non trouvé: {pdf_path}")
        sys.exit(1)

    base_dir = Path(__file__).resolve().parent.parent
    tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    title = args.title or pdf_path.stem.replace("-", " ").replace("_", " ").title()

    print(f"📄 Extraction de: {pdf_path.name}")
    data = extract_pdf_content(pdf_path)

    filepath = save_as_markdown(data, title, tags, base_dir)
    print(f"✅ Sauvegardé: {filepath.relative_to(base_dir)}")
    print(f"   Titre: {title}")
    print(f"   Pages: {data['page_count']}")
    print(f"   Mots: ~{data['word_count']}")
    print()
    print("💡 N'oublie pas de lancer: python scripts/rebuild_index.py")


if __name__ == "__main__":
    main()
