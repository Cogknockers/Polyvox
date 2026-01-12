from __future__ import annotations

import argparse
from pathlib import Path

from dotenv import load_dotenv

from .config import load_config
from .download import download_and_extract, find_shapefile_by_pattern
from .supabase_io import upload_geojson_files, upsert_counties, upsert_places
from .transform_counties import process_counties
from .transform_places import process_places


def load_env(base_dir: Path) -> None:
    load_dotenv(base_dir / ".env", override=True)
    load_dotenv(base_dir / ".env.local", override=True)


def resolve_shapefile(raw_dir: Path, pattern: str) -> Path:
    return find_shapefile_by_pattern(raw_dir, pattern)

def print_config(config) -> None:
    print("ETL config (sanity check):")
    print(f"  supabase_url: {config.supabase_url}")
    print(f"  bucket: {config.supabase_bucket}")
    print(f"  year: {config.year}")
    print(f"  simplify_tolerance: {config.simplify_tolerance}")
    print(f"  skip_bucket_checks: {config.skip_bucket_checks}")
    print(f"  raw_dir: {config.raw_dir}")
    print(f"  out_dir: {config.out_dir}")
    print(f"  counties_url: {config.counties_url}")
    print(f"  places_url: {config.places_url}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Polyvox GIS ETL")
    parser.add_argument("--year", type=int, default=None, help="Census year")
    parser.add_argument("--simplify", type=float, default=None, help="Simplify tolerance")
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--skip-upload", action="store_true")
    parser.add_argument("--skip-db", action="store_true")
    parser.add_argument("--print-config", action="store_true", help="Print resolved config and exit")

    args = parser.parse_args()

    base_dir = Path(__file__).resolve().parents[1]
    load_env(base_dir)

    config = load_config(base_dir, args.year, args.simplify)
    if args.print_config:
        print_config(config)
        return

    if args.skip_download:
        counties_pattern = f"cb_{config.year}_us_county_*.shp"
        places_pattern = f"cb_{config.year}_us_place_*.shp"
        counties_path = resolve_shapefile(config.raw_dir, counties_pattern)
        places_path = resolve_shapefile(config.raw_dir, places_pattern)
    else:
        counties_path = download_and_extract(config.counties_url, config.raw_dir)
        places_path = download_and_extract(config.places_url, config.raw_dir)

    county_records, county_geojson_paths = process_counties(config, counties_path)
    place_records = process_places(config, places_path)

    if not args.skip_upload:
        upload_geojson_files(config, county_geojson_paths)
    else:
        print("Skipping storage upload")

    if not args.skip_db:
        upsert_counties(config, county_records)
        upsert_places(config, place_records)
    else:
        print("Skipping database upserts")


if __name__ == "__main__":
    main()
