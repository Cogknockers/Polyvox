"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import { PanelRightClose, PanelRightOpen } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import washoeCountyGeo from "@/lib/geo/washoe-county.json";
import { towns, washoeCounty } from "@/lib/geo/places";
import type { MapMarker, Office } from "@/lib/mock-data";
import { defaultLocation } from "@/lib/mock-data";
import { formatPercent } from "@/lib/format";
import { stageBadgeVariant, stageLabel, supporterProgress } from "@/lib/ui";
import { cn } from "@/lib/utils";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    typeof markerIcon2x === "string" ? markerIcon2x : markerIcon2x.src,
  iconUrl: typeof markerIcon === "string" ? markerIcon : markerIcon.src,
  shadowUrl: typeof markerShadow === "string" ? markerShadow : markerShadow.src,
});

type MapPanelProps = {
  markers: MapMarker[];
  offices: Office[];
  locationLabel: string;
  fitHeight?: boolean;
};

const ZOOM_THRESHOLD = 11;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function getNearestTownName(center: { lat: number; lng: number }) {
  let closest = towns[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  towns.forEach((town) => {
    const distance = haversineDistance(center, { lat: town.lat, lng: town.lng });
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = town;
    }
  });

  return closest?.name ?? washoeCounty.name;
}

function MapTitleOverlay({ title }: { title: string }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2">
      <div className="rounded-full border border-border bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur transition-all">
        {title}
      </div>
    </div>
  );
}

function MapTitleController({
  onTitleChange,
  onReady,
}: {
  onTitleChange: (title: string) => void;
  onReady: (recompute: (map: L.Map) => void) => void;
}) {
  const updateTitle = useCallback(
    (map: L.Map) => {
      const zoom = map.getZoom();
      if (zoom <= ZOOM_THRESHOLD) {
        onTitleChange(washoeCounty.name);
        return;
      }
      const center = map.getCenter();
      onTitleChange(getNearestTownName({ lat: center.lat, lng: center.lng }));
    },
    [onTitleChange]
  );

  const map = useMapEvents({
    zoomend: () => updateTitle(map),
    moveend: () => updateTitle(map),
  });

  useEffect(() => {
    updateTitle(map);
    onReady(updateTitle);
  }, [map, updateTitle, onReady]);

  return null;
}

function FitBoundsController({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [16, 16] });
  }, [map, bounds]);

  return null;
}

function MapResizeController({
  containerRef,
  onTitleRecompute,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  onTitleRecompute: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame: number | null = null;
    const invalidate = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        map.invalidateSize();
        onTitleRecompute(map);
      });
    };

    invalidate();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", invalidate);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("resize", invalidate);
      };
    }

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map, containerRef, onTitleRecompute]);

  return null;
}

function StageBadge({ stage }: { stage: MapMarker["stage"] }) {
  return (
    <Badge variant={stageBadgeVariant(stage)} className="rounded-full">
      {stageLabel(stage)}
    </Badge>
  );
}

export default function MapPanel({
  markers,
  offices,
  locationLabel,
  fitHeight = false,
}: MapPanelProps) {
  const highlightedOffices = [...offices]
    .sort((a, b) => b.supporters - a.supporters)
    .slice(0, 4);
  const countyBounds = useMemo(
    () => L.geoJSON(washoeCountyGeo as any).getBounds(),
    []
  );
  const [mapTitle, setMapTitle] = useState(washoeCounty.name);
  const [showMomentum, setShowMomentum] = useState(true);
  const mapHeightClass = fitHeight ? "h-full min-h-[260px]" : "h-72";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const titleRecomputeRef = useRef<(map: L.Map) => void>(() => {});

  return (
    <Card className={cn("shadow-sm", fitHeight && "h-full")}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg">Active locations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Live view of activations around {locationLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Live map</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMomentum((prev) => !prev)}
              aria-label={
                showMomentum ? "Collapse momentum panel" : "Expand momentum panel"
              }
            >
              {showMomentum ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "grid gap-4",
          showMomentum
            ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,1fr)]",
          fitHeight && "h-full",
        )}
      >
        <div
          ref={mapContainerRef}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border",
            fitHeight && "h-full",
          )}
        >
          <MapTitleOverlay title={mapTitle} />
          <MapContainer
            center={[defaultLocation.lat, defaultLocation.lng]}
            zoom={10}
            scrollWheelZoom
            className={cn("w-full", mapHeightClass)}
          >
            <FitBoundsController bounds={countyBounds} />
            <MapTitleController
              onTitleChange={setMapTitle}
              onReady={(recompute) => {
                titleRecomputeRef.current = recompute;
              }}
            />
            <MapResizeController
              containerRef={mapContainerRef}
              onTitleRecompute={(map) => titleRecomputeRef.current(map)}
            />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={washoeCountyGeo as any}
              style={{
                color: "var(--muted-foreground)",
                weight: 2,
                fillColor: "var(--muted)",
                fillOpacity: 0.05,
              }}
            />
            {markers.map((marker) => (
              <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                <Popup>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">{marker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {marker.summary}
                    </p>
                    <StageBadge stage={marker.stage} />
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {showMomentum ? (
          <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold">Top momentum</h3>
            <p className="text-xs text-muted-foreground">
              Supporter progress by office
            </p>
          </div>
          {highlightedOffices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No offices match these filters yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {highlightedOffices.map((office) => {
                const progress = supporterProgress(office);
                return (
                  <div key={office.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{office.name}</span>
                      <span className="text-muted-foreground">
                        {progress.label}
                      </span>
                    </div>
                    <Progress value={progress.value} />
                    <div className="flex items-center justify-between">
                      <StageBadge stage={office.stage} />
                      <span className="text-xs text-muted-foreground">
                        {formatPercent(office.supporters, office.supporterGoal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
