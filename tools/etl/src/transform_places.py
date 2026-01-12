from __future__ import annotations

from pathlib import Path
from typing import Any

import geopandas as gpd
from .config import ETLConfig


def process_places(config: ETLConfig, shapefile_path: Path) -> list[dict[str, Any]]:
    print(f"Reading places from {shapefile_path}")
    gdf = gpd.read_file(shapefile_path)

    if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    gdf["geoid"] = gdf["GEOID"].astype(str)
    gdf["name"] = gdf["NAME"].astype(str)
    gdf["statefp"] = gdf["STATEFP"].astype(str)

    records: list[dict[str, Any]] = []

    def to_wkt(geom) -> str | None:
        if geom is None or geom.is_empty:
            return None
        return f"SRID=4326;{geom.wkt}"

    rep_points = gdf.geometry.representative_point()

    for idx, row in gdf.iterrows():
        point = rep_points.loc[idx]
        records.append(
            {
                "id": row["geoid"],
                "name": row["name"],
                "statefp": row["statefp"],
                "geom": to_wkt(point),
                "source_year": config.year,
            }
        )

    return records
