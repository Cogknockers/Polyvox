from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

DEFAULT_BUCKET = "geo"


def default_counties_url(year: int) -> str:
    return (
        f"https://www2.census.gov/geo/tiger/GENZ{year}/shp/"
        f"cb_{year}_us_county_500k.zip"
    )


def default_places_url(year: int) -> str:
    return (
        f"https://www2.census.gov/geo/tiger/GENZ{year}/shp/"
        f"cb_{year}_us_place_500k.zip"
    )


@dataclass(frozen=True)
class ETLConfig:
    base_dir: Path
    data_dir: Path
    raw_dir: Path
    out_dir: Path
    year: int
    simplify_tolerance: float
    supabase_url: str
    supabase_key: str
    supabase_bucket: str
    skip_bucket_checks: bool
    counties_url: str
    places_url: str


def load_config(base_dir: Path, year: int | None, simplify: float | None) -> ETLConfig:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")

    data_year = year or int(os.getenv("DATA_YEAR", "2024"))
    simplify_value = simplify if simplify is not None else float(os.getenv("SIMPLIFY_TOLERANCE", "0"))

    bucket_env = os.getenv("SUPABASE_BUCKET")
    bucket = bucket_env if bucket_env else DEFAULT_BUCKET

    counties_url = os.getenv("DOWNLOAD_COUNTIES_URL") or default_counties_url(data_year)
    places_url = os.getenv("DOWNLOAD_PLACES_URL") or default_places_url(data_year)
    skip_bucket_checks = os.getenv("SKIP_BUCKET_CHECKS", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "y",
    }

    data_dir = base_dir / "data"
    raw_dir = data_dir / "raw"
    out_dir = data_dir / "out"

    return ETLConfig(
        base_dir=base_dir,
        data_dir=data_dir,
        raw_dir=raw_dir,
        out_dir=out_dir,
        year=data_year,
        simplify_tolerance=simplify_value,
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        supabase_bucket=bucket,
        skip_bucket_checks=skip_bucket_checks,
        counties_url=counties_url,
        places_url=places_url,
    )
