from __future__ import annotations

from pathlib import Path
from typing import Iterable

from supabase import create_client
from storage3.exceptions import StorageApiError

from .config import ETLConfig


def create_supabase_client(config: ETLConfig):
    url = config.supabase_url
    if not url.endswith("/"):
        url = f"{url}/"
    return create_client(url, config.supabase_key)


def _raise_if_error(result, context: str) -> None:
    error = None
    if isinstance(result, dict):
        error = result.get("error")
    else:
        error = getattr(result, "error", None)

    if error:
        message = getattr(error, "message", None) or str(error)
        raise RuntimeError(f"{context}: {message}")


def _bucket_names(raw) -> set[str]:
    if raw is None:
        return set()
    if isinstance(raw, list):
        names = []
        for item in raw:
            if isinstance(item, dict):
                names.append(item.get("name"))
            else:
                names.append(getattr(item, "name", None))
        return {name for name in names if name}
    if isinstance(raw, dict):
        return {raw.get("name")} if raw.get("name") else set()
    return set()


def ensure_bucket_exists(client, bucket: str) -> None:
    if not bucket or not isinstance(bucket, str):
        raise RuntimeError("SUPABASE_BUCKET must be a non-empty string.")

    try:
        buckets = client.storage.list_buckets()
        names = _bucket_names(buckets)
        if bucket in names:
            return
    except StorageApiError as exc:
        if exc.status == 403:
            print("Bucket listing forbidden by RLS. Skipping existence check.")
            return
        raise

    print(f"Bucket '{bucket}' not found. Creating it...")
    try:
        result = client.storage.create_bucket(bucket, options={"public": True})
        _raise_if_error(result, f"Failed to create bucket '{bucket}'")
    except StorageApiError as exc:
        if exc.status == 403 and "row-level security" in exc.message.lower():
            print("Bucket creation blocked by RLS. Assuming bucket exists.")
            return
        raise


def upload_geojson_files(config: ETLConfig, paths: Iterable[Path]) -> None:
    client = create_supabase_client(config)
    bucket = config.supabase_bucket
    if config.skip_bucket_checks:
        print("Skipping bucket existence checks (SKIP_BUCKET_CHECKS enabled).")
    else:
        ensure_bucket_exists(client, bucket)

    for path in paths:
        storage_path = f"counties/{config.year}/{path.name}"
        print(f"Uploading {path} -> {storage_path}")
        with open(path, "rb") as handle:
            result = client.storage.from_(bucket).upload(
                storage_path,
                handle,
                {
                    "content-type": "application/geo+json",
                    "upsert": "true",
                },
            )
        _raise_if_error(result, f"Upload failed for {storage_path}")


def chunked(items: list[dict], size: int) -> Iterable[list[dict]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def upsert_counties(config: ETLConfig, records: list[dict]) -> None:
    if not records:
        return

    client = create_supabase_client(config)
    for chunk in chunked(records, 500):
        response = client.table("counties").upsert(chunk, on_conflict="fips").execute()
        _raise_if_error(response, "County upsert failed")


def upsert_places(config: ETLConfig, records: list[dict]) -> None:
    if not records:
        return

    client = create_supabase_client(config)
    for chunk in chunked(records, 500):
        response = client.table("places").upsert(chunk, on_conflict="id").execute()
        _raise_if_error(response, "Place upsert failed")
