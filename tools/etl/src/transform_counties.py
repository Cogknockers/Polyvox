from __future__ import annotations

from pathlib import Path
from typing import Any

import geopandas as gpd
from shapely.geometry import MultiPolygon, Polygon

from .config import ETLConfig


def process_counties(config: ETLConfig, shapefile_path: Path) -> tuple[list[dict[str, Any]], list[Path]]:
    print(f"Reading counties from {shapefile_path}")
    gdf = gpd.read_file(shapefile_path)

    if gdf.crs is None or gdf.crs.to_string() != "EPSG:4326":
        gdf = gdf.to_crs("EPSG:4326")

    if config.simplify_tolerance > 0:
        gdf["geometry"] = gdf["geometry"].simplify(
            config.simplify_tolerance, preserve_topology=True
        )

    gdf["statefp"] = gdf["STATEFP"].astype(str)
    gdf["countyfp"] = gdf["COUNTYFP"].astype(str)
    gdf["fips"] = gdf["statefp"] + gdf["countyfp"]
    gdf["name"] = gdf["NAME"].astype(str)

    out_dir = config.out_dir / "counties" / str(config.year)
    out_dir.mkdir(parents=True, exist_ok=True)

    records: list[dict[str, Any]] = []
    geojson_paths: list[Path] = []

    def to_wkt(geom) -> str | None:
        if geom is None or geom.is_empty:
            return None
        return f"SRID=4326;{geom.wkt}"

    def to_multipolygon(geom):
        if geom is None or geom.is_empty:
            return None
        if geom.geom_type == "MultiPolygon":
            return geom
        if geom.geom_type == "Polygon":
            return MultiPolygon([geom])
        if hasattr(geom, "geoms"):
            polygons = [g for g in geom.geoms if g.geom_type == "Polygon"]
            if polygons:
                return MultiPolygon(polygons)
        return geom

    for idx, row in gdf.iterrows():
        fips = row["fips"]
        geometry = to_multipolygon(row.geometry)
        if geometry is None:
            continue
        centroid = geometry.representative_point()
        minx, miny, maxx, maxy = geometry.bounds

        storage_path = f"counties/{config.year}/{fips}.geojson"
        output_path = out_dir / f"{fips}.geojson"

        county_gdf = gpd.GeoDataFrame(
            [
                {
                    "fips": fips,
                    "statefp": row["statefp"],
                    "countyfp": row["countyfp"],
                    "name": row["name"],
                    "geometry": geometry,
                }
            ],
            geometry="geometry",
            crs="EPSG:4326",
        )

        county_gdf.to_file(output_path, driver="GeoJSON")

        records.append(
            {
                "fips": fips,
                "statefp": row["statefp"],
                "countyfp": row["countyfp"],
                "name": row["name"],
                "geom": to_wkt(geometry),
                "centroid": to_wkt(centroid),
                "bbox": [
                    minx,
                    miny,
                    maxx,
                    maxy,
                ],
                "storage_path": storage_path,
                "source_year": config.year,
            }
        )
        geojson_paths.append(output_path)

    return records, geojson_paths
