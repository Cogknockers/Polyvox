// src/lib/filters.ts
import type {
  ActivationStage,
  FeedKind,
  Office,
  OfficeType,
  MapMarker,
  FeedItemBase,
} from "./mock-data";
import { STAGE_SORT_ORDER, OFFICE_TYPE_SORT_ORDER } from "./constants";

export type StageFilter = ActivationStage | "ALL";
export type OfficeTypeFilter = OfficeType | "ALL";
export type ActiveOnlyFilter = "ACTIVE_ONLY" | "ALL";
export type FeedTab = "all" | "candidates" | "community" | "forums";

export interface DashboardFilters {
  stage: StageFilter;
  officeType: OfficeTypeFilter;
  activeOnly: ActiveOnlyFilter;
}

/** Default filter set for dashboard */
export const defaultDashboardFilters: DashboardFilters = {
  stage: "ALL",
  officeType: "ALL",
  activeOnly: "ACTIVE_ONLY",
};

/** Office is considered “active” if it is not dormant */
export function isOfficeActive(office: Pick<Office, "stage">): boolean {
  return office.stage !== "DORMANT";
}

/** Sort offices: stage → type → name (fallback-safe) */
export function sortOffices(a: Office, b: Office): number {
  const sA = STAGE_SORT_ORDER[a.stage] ?? 999;
  const sB = STAGE_SORT_ORDER[b.stage] ?? 999;
  if (sA !== sB) return sA - sB;

  const tA = OFFICE_TYPE_SORT_ORDER[a.officeType] ?? 999;
  const tB = OFFICE_TYPE_SORT_ORDER[b.officeType] ?? 999;
  if (tA !== tB) return tA - tB;

  return a.name.localeCompare(b.name);
}

/** Apply stage/officeType/activeOnly filters to offices */
export function filterOffices(offices: Office[], filters: DashboardFilters): Office[] {
  return offices
    .filter((o) => (filters.stage === "ALL" ? true : o.stage === filters.stage))
    .filter((o) =>
      filters.officeType === "ALL" ? true : o.officeType === filters.officeType
    )
    .filter((o) => (filters.activeOnly === "ACTIVE_ONLY" ? isOfficeActive(o) : true))
    .slice()
    .sort(sortOffices);
}

/**
 * Filter markers so the map reflects the filtered office set.
 * Strategy:
 * - If a marker has officeIds, include it if ANY of those offices survive filtering.
 * - If marker has no officeIds, include it only if activeOnly is ALL (so it doesn't clutter).
 * - Marker stage becomes the "max stage" among included offices (ROOTED > SEEDLING > DORMANT)
 */
export function filterMarkers(
  markers: MapMarker[],
  allOffices: Office[],
  filteredOffices: Office[],
  filters: DashboardFilters
): MapMarker[] {
  const filteredOfficeIds = new Set(filteredOffices.map((o) => o.id));
  const officeById = new Map(allOffices.map((o) => [o.id, o]));

  const stageRank = (s: ActivationStage) => {
    // Higher = more active for marker aggregation
    switch (s) {
      case "ROOTED":
        return 3;
      case "SEEDLING":
        return 2;
      case "DORMANT":
        return 1;
      default:
        return 0;
    }
  };

  const stageFromRank = (r: number): ActivationStage => {
    if (r >= 3) return "ROOTED";
    if (r === 2) return "SEEDLING";
    return "DORMANT";
  };

  return markers
    .map((m) => {
      if (!m.officeIds?.length) {
        // markers with no offices are informational
        if (filters.activeOnly === "ACTIVE_ONLY") return null;
        return m;
      }

      const surviving = m.officeIds.filter((id) => filteredOfficeIds.has(id));
      if (!surviving.length) return null;

      // aggregate stage across surviving offices
      const ranks = surviving
        .map((id) => officeById.get(id)?.stage)
        .filter(Boolean)
        .map((s) => stageRank(s as ActivationStage));

      const aggRank = ranks.length ? Math.max(...ranks) : stageRank(m.stage);
      const aggStage = stageFromRank(aggRank);

      return {
        ...m,
        stage: aggStage,
        summary: `${surviving.length} office${surviving.length === 1 ? "" : "s"} • ${aggStage.toLowerCase()}`,
        officeIds: surviving,
      } satisfies MapMarker;
    })
    .filter(Boolean) as MapMarker[];
}

/** Feed filtering by tab */
export function filterFeed(items: FeedItemBase[], tab: FeedTab): FeedItemBase[] {
  const kindMap: Record<Exclude<FeedTab, "all">, FeedKind> = {
    candidates: "CANDIDATE",
    community: "COMMUNITY",
    forums: "FORUM",
  };

  const filtered =
    tab === "all" ? items : items.filter((i) => i.kind === kindMap[tab]);

  // newest first
  return filtered.slice().sort((a, b) => {
    const tA = new Date(a.createdAtISO).getTime();
    const tB = new Date(b.createdAtISO).getTime();
    return tB - tA;
  });
}

/** Convenience function for dashboard pages */
export function computeDashboardView<T extends { offices: Office[]; markers: MapMarker[]; feedItems: FeedItemBase[] }>(
  data: T,
  filters: DashboardFilters,
  feedTab: FeedTab
): {
  offices: Office[];
  markers: MapMarker[];
  feedItems: FeedItemBase[];
} {
  const officesFiltered = filterOffices(data.offices, filters);
  const markersFiltered = filterMarkers(data.markers, data.offices, officesFiltered, filters);
  const feedFiltered = filterFeed(data.feedItems, feedTab);

  return {
    offices: officesFiltered,
    markers: markersFiltered,
    feedItems: feedFiltered,
  };
}
