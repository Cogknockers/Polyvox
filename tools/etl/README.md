# Polyvox GIS ETL

This ETL tool downloads authoritative US Census TIGER/Cartographic Boundary data, simplifies geometry, writes per-county GeoJSON, uploads files to Supabase Storage, and upserts county/place metadata into Postgres/PostGIS.

## Prerequisites
- Python 3.11 (recommended)
- Supabase project with PostGIS enabled
- Supabase tables: `public_entities`, `public_entity_contacts`, `entity_mentions`, `email_outbox` (for app)
- ETL tables expected:
  - `public.counties` (fips, statefp, countyfp, name, geom, centroid, bbox, storage_path, source_year)
  - `public.places` (id, name, statefp, geom, source_year)

### Windows notes for geopandas
Geopandas can be heavy on Windows. Recommended options:
- **Conda**: `conda install -c conda-forge geopandas`
- **Pip** with prebuilt wheels: ensure `pip` is up to date and use Python 3.11.

## Setup (Windows PowerShell)
```powershell
cd M:\Polyvox\tools\etl
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Environment
Copy `.env.example` to `.env.local` and fill in values:
```powershell
Copy-Item .env.example .env.local
```

Required variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET` (default: `geo`)
- `SKIP_BUCKET_CHECKS` (optional: `true` to skip bucket list/create checks)
- `DATA_YEAR` (default: 2024)
- `SIMPLIFY_TOLERANCE` (default: 0.005)
- `DOWNLOAD_COUNTIES_URL` (optional override)
- `DOWNLOAD_PLACES_URL` (optional override)

## Run
You can use the PowerShell helper:
```powershell
.\run.ps1 --year 2024 --simplify 0.005
```

Or run directly:
```powershell
python -m src.etl --year 2024 --simplify 0.005
```

Flags:
- `--skip-download`
- `--skip-upload`
- `--skip-db`
- `--print-config` (print resolved config and exit)

## Outputs
- Raw downloads in `tools/etl/data/raw`
- Per-county GeoJSON in `tools/etl/data/out/counties/<year>/<fips>.geojson`
- Storage uploads in bucket `geo` (path `counties/<year>/<fips>.geojson`)

## Troubleshooting
- **Bucket not found**: The ETL will attempt to create the bucket if missing (default: public). You can also create it manually in Supabase Storage and ensure `SUPABASE_BUCKET` matches. Set `SKIP_BUCKET_CHECKS=true` to skip bucket checks after manual creation.
- **Missing GDAL/Fiona/Shapely**: Use conda or ensure pip wheels are available for your Python version.
- **Permission errors on upload**: Make sure the Supabase storage bucket exists and the service role key is correct.
- **PostGIS errors**: Confirm PostGIS is enabled and table columns accept GeoJSON input.

## Notes
- This ETL is idempotent: it upserts by `fips` for counties and `id` for places.
- County geometries are simplified with `preserve_topology=True`.
- All data is reprojected to EPSG:4326.
