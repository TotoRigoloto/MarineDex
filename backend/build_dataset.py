"""
MarineDex — Construction du dataset iNaturalist
================================================

Télécharge des photos pour chaque espèce de species_mapping.json depuis
l'API publique iNaturalist (licence CC, usage non-commercial autorisé).

Structure de sortie :
    dataset/
        Requin Baleine/
            00001.jpg
            00002.jpg
            ...
        Tortue Verte/
            ...

Utilisation :
    # Voir combien d'images sont disponibles sans télécharger
    python backend/build_dataset.py --dry-run

    # Télécharger 200 images/espèce (défaut)
    python backend/build_dataset.py

    # Seulement certaines espèces
    python backend/build_dataset.py --species "Requin Baleine" "Tortue Verte"

    # Changer le nombre cible
    python backend/build_dataset.py --per-species 100

    # Mettre à jour uniquement les espèces qui n'ont pas encore 150 images
    python backend/build_dataset.py --min-existing 150

Pré-requis :
    pip install requests tqdm Pillow

Notes légales :
    - Les photos iNaturalist sont sous diverses licences CC.
    - Ce dataset est réservé à l'entraînement du modèle MarineDex (usage
      associatif non-commercial). Ne pas redistribuer les photos brutes.
    - La qualité "research" garantit une identification humaine validée.
"""

import argparse
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests
from PIL import Image

# ── Tentative d'import tqdm (facultatif mais agréable) ──────────────────────
try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False
    print("[warn] tqdm non installé — pip install tqdm pour une barre de progression.")

# ── Constantes ───────────────────────────────────────────────────────────────
SCRIPT_DIR       = Path(__file__).resolve().parent
PROJECT_DIR      = SCRIPT_DIR.parent
MAPPING_PATH     = SCRIPT_DIR / "species_mapping.json"
DEFAULT_DATASET  = PROJECT_DIR / "dataset"
INAT_API_BASE    = "https://api.inaturalist.org/v1"

# Pause entre requêtes API (secondes) — max 100 req/min selon iNat
API_DELAY        = 0.7
# Pause entre téléchargements d'images
PHOTO_DELAY      = 0.3
# Timeout HTTP (secondes)
HTTP_TIMEOUT     = 20
# iNaturalist retourne max 200 observations par page
PER_PAGE         = 200
# Taille minimale image acceptée (évite les thumbnails cassés)
MIN_IMAGE_BYTES  = 5_000

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("marinedex.dataset")


# ── Session HTTP réutilisée ──────────────────────────────────────────────────
session = requests.Session()
session.headers.update({
    "User-Agent": "MarineDex-DatasetBuilder/1.0 (revosea.com; contact: contact@revosea.com)",
    "Accept": "application/json",
})


# ── Helpers iNaturalist ──────────────────────────────────────────────────────

def search_taxon_id(scientific_name: str) -> Optional[int]:
    """
    Cherche l'identifiant iNaturalist d'une espèce par son nom scientifique.
    Retourne le premier taxon_id de rang "species" trouvé, ou None.
    """
    url = f"{INAT_API_BASE}/taxa"
    params = {"q": scientific_name, "rank": "species", "per_page": 5}
    try:
        r = session.get(url, params=params, timeout=HTTP_TIMEOUT)
        r.raise_for_status()
        results = r.json().get("results", [])
        for taxon in results:
            if taxon.get("rank") == "species":
                log.info(f"  taxon trouvé : {taxon['name']} (id={taxon['id']})")
                return taxon["id"]
    except Exception as e:
        log.warning(f"  Erreur recherche taxon '{scientific_name}': {e}")
    return None


def fetch_observation_photos(taxon_id: int, max_photos: int) -> list[dict]:
    """
    Récupère une liste de dicts {url, obs_id} depuis iNaturalist.
    Ne retourne que les observations de grade 'research' avec photo.
    Pagine automatiquement jusqu'à atteindre max_photos.
    """
    photos = []
    page = 1
    while len(photos) < max_photos:
        url = f"{INAT_API_BASE}/observations"
        params = {
            "taxon_id":     taxon_id,
            "quality_grade": "research",
            "photos":        "true",
            "per_page":      PER_PAGE,
            "page":          page,
            "order_by":      "votes",  # les meilleures observations d'abord
            "order":         "desc",
        }
        try:
            r = session.get(url, params=params, timeout=HTTP_TIMEOUT)
            r.raise_for_status()
            data = r.json()
        except Exception as e:
            log.warning(f"  Erreur API page {page}: {e}")
            break

        results = data.get("results", [])
        if not results:
            break  # plus de données disponibles

        for obs in results:
            for photo in obs.get("photos", []):
                # Remplacer la taille "square" par "large" dans l'URL iNaturalist
                raw_url = photo.get("url", "")
                if not raw_url:
                    continue
                large_url = raw_url.replace("/square.", "/large.").replace("square.", "large.")
                photos.append({"url": large_url, "obs_id": obs["id"]})
                if len(photos) >= max_photos:
                    break
            if len(photos) >= max_photos:
                break

        # iNaturalist cap à 10 000 résultats
        total = data.get("total_results", 0)
        fetched_so_far = (page - 1) * PER_PAGE + len(results)
        if fetched_so_far >= total or fetched_so_far >= 10_000:
            break

        page += 1
        time.sleep(API_DELAY)

    return photos


def download_photo(url: str, dest_path: Path) -> bool:
    """
    Télécharge une photo vers dest_path.
    Retourne True si succès, False sinon.
    Vérifie que l'image est lisible par PIL.
    """
    try:
        r = session.get(url, timeout=HTTP_TIMEOUT, stream=True)
        r.raise_for_status()
        raw = r.content
        if len(raw) < MIN_IMAGE_BYTES:
            log.debug(f"  Image trop petite ({len(raw)} bytes) : {url}")
            return False
        # Vérification PIL : s'assure que c'est une image valide et la convertit en RGB
        img = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
        img.save(dest_path, "JPEG", quality=90)
        return True
    except Exception as e:
        log.debug(f"  Échec téléchargement {url}: {e}")
        return False


# ── Pipeline principal ───────────────────────────────────────────────────────

def process_species(
    entry: dict,
    dataset_dir: Path,
    per_species: int,
    min_existing: int,
    dry_run: bool,
) -> dict:
    """
    Traite une espèce : recherche taxon, collecte photos, télécharge.
    Retourne un résumé {fr, downloaded, skipped, existing, available}.
    """
    fr_name     = entry["fr"]
    sci_name    = entry["scientific"]
    taxon_id    = entry.get("taxon_id")
    species_dir = dataset_dir / fr_name

    # Compter les images déjà présentes
    existing = 0
    if species_dir.exists():
        existing = len(list(species_dir.glob("*.jpg")))

    summary = {
        "fr": fr_name, "downloaded": 0, "skipped": 0,
        "existing": existing, "available": 0,
    }

    if existing >= min_existing:
        log.info(f"  ✅ {fr_name} : {existing} images déjà présentes — ignoré")
        summary["skipped"] = 1
        return summary

    # Résoudre le taxon_id si absent du mapping
    if taxon_id is None:
        log.info(f"  🔍 {fr_name} : recherche taxon pour '{sci_name}'…")
        taxon_id = search_taxon_id(sci_name)
        time.sleep(API_DELAY)
        if taxon_id is None:
            log.warning(f"  ❌ {fr_name} : taxon introuvable sur iNaturalist")
            return summary

    log.info(f"  📡 {fr_name} (taxon {taxon_id}) : collecte jusqu'à {per_species} photos…")
    photos = fetch_observation_photos(taxon_id, max_photos=per_species + 50)  # marge pour les échecs
    time.sleep(API_DELAY)

    summary["available"] = len(photos)
    log.info(f"  → {len(photos)} URLs collectées")

    if dry_run:
        return summary

    # Créer le dossier espèce
    species_dir.mkdir(parents=True, exist_ok=True)

    # Télécharger jusqu'à per_species images
    target = per_species - existing
    downloaded = 0
    failed = 0
    iterator = tqdm(photos, desc=fr_name, unit="img", leave=False) if HAS_TQDM else photos

    for i, photo in enumerate(iterator):
        if downloaded >= target:
            break
        dest = species_dir / f"{existing + downloaded + 1:05d}.jpg"
        if dest.exists():
            downloaded += 1
            continue
        ok = download_photo(photo["url"], dest)
        if ok:
            downloaded += 1
        else:
            failed += 1
        time.sleep(PHOTO_DELAY)

    summary["downloaded"] = downloaded
    log.info(f"  ✅ {fr_name} : {downloaded} téléchargées, {failed} échecs")
    return summary


def main():
    parser = argparse.ArgumentParser(
        description="Construit le dataset MarineDex depuis iNaturalist."
    )
    parser.add_argument(
        "--dataset",
        default=str(DEFAULT_DATASET),
        help=f"Dossier de sortie du dataset (défaut : {DEFAULT_DATASET})",
    )
    parser.add_argument(
        "--mapping",
        default=str(MAPPING_PATH),
        help="Chemin vers species_mapping.json",
    )
    parser.add_argument(
        "--per-species",
        type=int,
        default=200,
        help="Nombre d'images cible par espèce (défaut : 200)",
    )
    parser.add_argument(
        "--min-existing",
        type=int,
        default=None,
        help="Ignorer les espèces qui ont déjà N images (défaut = --per-species)",
    )
    parser.add_argument(
        "--species",
        nargs="+",
        metavar="NOM",
        help='Restreindre à certaines espèces. Ex: --species "Requin Baleine" "Tortue Verte"',
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Afficher les statistiques de disponibilité sans télécharger",
    )
    args = parser.parse_args()

    # min_existing par défaut = per_species (on complète si on n'a pas assez)
    min_existing = args.min_existing if args.min_existing is not None else args.per_species

    # Charger le mapping
    mapping_path = Path(args.mapping)
    if not mapping_path.exists():
        sys.exit(f"❌ Mapping introuvable : {mapping_path}")
    with open(mapping_path, encoding="utf-8") as f:
        mapping = json.load(f)
    all_entries = mapping["species"]

    # Filtrer si --species fourni
    if args.species:
        selected = set(args.species)
        all_entries = [e for e in all_entries if e["fr"] in selected]
        if not all_entries:
            sys.exit(f"❌ Aucune espèce trouvée parmi : {args.species}")

    dataset_dir = Path(args.dataset)
    mode = "[DRY RUN] " if args.dry_run else ""

    print(f"\n🌊  MarineDex Dataset Builder  {mode}")
    print(f"   mapping     : {mapping_path}  ({len(all_entries)} espèces)")
    print(f"   dataset     : {dataset_dir}")
    print(f"   cible/espèce: {args.per_species} images")
    print(f"   seuil skip  : {min_existing} images existantes")
    print()

    summaries = []
    for i, entry in enumerate(all_entries, 1):
        log.info(f"[{i}/{len(all_entries)}] {entry['fr']}  ({entry['scientific']})")
        s = process_species(
            entry,
            dataset_dir=dataset_dir,
            per_species=args.per_species,
            min_existing=min_existing,
            dry_run=args.dry_run,
        )
        summaries.append(s)
        # Pause plus longue entre espèces pour ne pas stresser l'API
        time.sleep(API_DELAY * 2)

    # ── Rapport final ────────────────────────────────────────────────────────
    print("\n" + "─" * 60)
    print(f"{'Espèce':<40} {'Existant':>8} {'Dispo':>6} {'DL':>5}")
    print("─" * 60)
    total_dl = 0
    for s in sorted(summaries, key=lambda x: x["fr"]):
        mark = "✅" if s["skipped"] else ("📥" if s["downloaded"] > 0 else "⚠️ ")
        print(f"{mark} {s['fr']:<38} {s['existing']:>8} {s['available']:>6} {s['downloaded']:>5}")
        total_dl += s["downloaded"]
    print("─" * 60)
    print(f"{'TOTAL':>44} {total_dl:>5} téléchargées")

    if args.dry_run:
        print("\n[DRY RUN] Aucun fichier écrit. Lance sans --dry-run pour télécharger.")
    else:
        print(f"\n✅ Dataset disponible dans : {dataset_dir}")
        print("   Lance ensuite : python backend/train_model.py")


if __name__ == "__main__":
    main()
