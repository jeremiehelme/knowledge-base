"""
Helper pour vérifier et guider l'utilisateur sur l'activation du venv.
Importé au début de chaque script.
"""

import subprocess
import sys
from pathlib import Path


def ensure_venv():
    """
    Vérifie si on tourne dans le venv du projet.
    Si non, relance le script avec le Python du venv.
    """
    base_dir = Path(__file__).resolve().parent.parent
    venv_python = base_dir / ".venv" / "bin" / "python"

    # Déjà dans le venv ? OK
    if hasattr(sys, "real_prefix") or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix):
        return

    # Le venv existe ? On relance avec
    if venv_python.exists():
        result = subprocess.run([str(venv_python)] + sys.argv, cwd=str(base_dir))
        sys.exit(result.returncode)

    # Pas de venv du tout
    print("❌ Pas de virtual environment détecté.")
    print("   Crée-le d'abord :")
    print()
    print("   python3 -m venv .venv")
    print("   source .venv/bin/activate")
    print("   pip install -r scripts/requirements.txt")
    sys.exit(1)
