"""Application configuration.

Every setting can be overridden with an environment variable (see .env.example),
so the same code runs locally and on a deployed host.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# backend/app/config.py -> backend/ -> DVD_Project/
BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BACKEND_DIR.parent


# Where the raw CSVs may live, in priority order. `data/raw` is this repo's layout
# (see data/raw/readme.md); the others cover the shared-folder checkouts.
DATA_DIR_CANDIDATES = (
    BACKEND_DIR / "data" / "raw",
    BACKEND_DIR / "data",
    PROJECT_ROOT / "data" / "raw",
    PROJECT_ROOT / "data",
    PROJECT_ROOT / "dvd-project-main" / "Project Dataset",
    PROJECT_ROOT / "Project Dataset",
)


def _has_dataset(directory: Path) -> bool:
    """True if `orders_dataset.csv` sits in this folder or one level below it."""
    if not directory.is_dir():
        return False
    return any(directory.glob("orders_dataset.csv")) or any(
        directory.glob("*/orders_dataset.csv")
    )


def _resolve_data_dir() -> Path:
    """Find the raw CSVs, so the API runs from a fresh clone with no configuration."""
    override = os.getenv("DATA_DIR")
    if override:
        return Path(override).expanduser()
    for candidate in DATA_DIR_CANDIDATES:
        if _has_dataset(candidate):
            return candidate
    return DATA_DIR_CANDIDATES[0]  # nothing found: report the expected location


DATA_DIR = _resolve_data_dir()

# Enriched tables are pickled here so restarts take ~1s instead of re-reading 120 MB of CSVs.
CACHE_DIR = Path(os.getenv("CACHE_DIR", BACKEND_DIR / "cache")).expanduser()

# Build the enriched tables on startup instead of on the first request.
EAGER_LOAD = os.getenv("EAGER_LOAD", "true").lower() in {"1", "true", "yes"}

# Comma-separated list of browser origins allowed to call the API.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://dvd-project-fawn.vercel.app",
    ).split(",")
    if origin.strip()
]


def ecommerce_dir() -> Path:
    """Path to the E-Commerce CSVs.

    The shared folder name has a trailing space ("E-Commerce Dataset "), so we
    match case-insensitively on the prefix instead of hardcoding it.
    """
    return _find_subdir("e-commerce")


def funnel_dir() -> Path:
    """Path to the Marketing Funnel CSVs."""
    return _find_subdir("marketing funnel")


def _find_subdir(prefix: str) -> Path:
    if not DATA_DIR.is_dir():
        raise FileNotFoundError(
            f"Dataset folder not found: {DATA_DIR}. Put the raw CSVs there (see "
            "data/raw/readme.md) or set DATA_DIR to the folder holding them."
        )
    for child in sorted(DATA_DIR.iterdir()):
        if child.is_dir() and child.name.strip().lower().startswith(prefix):
            return child
    # Flat layout: all CSVs sit directly in DATA_DIR.
    return DATA_DIR
