from __future__ import annotations

import shutil
import zipfile
from pathlib import Path
from typing import Iterable

import requests


def download_file(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with open(dest, "wb") as handle:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    handle.write(chunk)


def extract_zip(zip_path: Path, extract_dir: Path) -> None:
    extract_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "r") as archive:
        archive.extractall(extract_dir)


def find_shapefile(root: Path) -> Path:
    matches = list(root.rglob("*.shp"))
    if not matches:
        raise FileNotFoundError(f"No shapefile found under {root}")
    if len(matches) > 1:
        matches.sort()
    return matches[0]


def find_shapefile_by_pattern(root: Path, pattern: str) -> Path:
    matches = list(root.rglob(pattern))
    if not matches:
        raise FileNotFoundError(f"No shapefile matching {pattern} under {root}")
    if len(matches) > 1:
        matches.sort()
    return matches[0]


def download_and_extract(url: str, raw_dir: Path) -> Path:
    raw_dir.mkdir(parents=True, exist_ok=True)
    filename = url.split("/")[-1]
    zip_path = raw_dir / filename
    extract_dir = raw_dir / zip_path.stem

    if not zip_path.exists():
        print(f"Downloading {url} -> {zip_path}")
        download_file(url, zip_path)
    else:
        print(f"Using cached download {zip_path}")

    if not extract_dir.exists():
        print(f"Extracting {zip_path} -> {extract_dir}")
        extract_zip(zip_path, extract_dir)
    else:
        print(f"Using existing extract dir {extract_dir}")

    return find_shapefile(extract_dir)


def clean_dir(path: Path, keep: Iterable[str] | None = None) -> None:
    if not path.exists():
        return
    keep_set = set(keep or [])
    for child in path.iterdir():
        if child.name in keep_set:
            continue
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()