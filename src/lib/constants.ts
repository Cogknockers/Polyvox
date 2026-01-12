// src/lib/constants.ts
import type { ActivationStage, FeedKind, OfficeType, Office } from "./mock-data";

/** App-wide defaults (UI only; backend can override later) */
export const DEFAULT_LOCATION_LABEL = "Reno, NV" as const;
export const ROOTED_THRESHOLD_DEFAULT = 10 as const;

/** Sorting helpers */
export const STAGE_SORT_ORDER: Record<ActivationStage, number> = {
  ROOTED: 0,
  SEEDLING: 1,
  DORMANT: 2,
};

export const FEED_KIND_SORT_ORDER: Record<FeedKind, number> = {
  CANDIDATE: 0,
  COMMUNITY: 1,
  FORUM: 2,
};

export const OFFICE_TYPE_SORT_ORDER: Record<OfficeType, number> = {
  MAYOR: 0,
  CITY_COUNCIL: 1,
  COUNTY_COMMISSION: 2,
  SCHOOL_BOARD: 3,
  STATE_SENATE: 4,
  STATE_ASSEMBLY: 5,
  GOVERNOR: 6,
};

/** Human-friendly labels */
export const STAGE_LABELS: Record<ActivationStage, string> = {
  DORMANT: "Dormant",
  SEEDLING: "Seedling",
  ROOTED: "Rooted",
};

export const FEED_KIND_LABELS: Record<FeedKind, string> = {
  CANDIDATE: "Candidates",
  COMMUNITY: "Community",
  FORUM: "Forums",
};

export const OFFICE_TYPE_LABELS: Record<OfficeType, string> = {
  MAYOR: "Mayor",
  CITY_COUNCIL: "City Council",
  COUNTY_COMMISSION: "County Commission",
  GOVERNOR: "Governor",
  STATE_SENATE: "State Senate",
  STATE_ASSEMBLY: "State Assembly",
  SCHOOL_BOARD: "School Board",
};

/** Normalizers (safe fallbacks for future values) */
export function normalizeOfficeTypeLabel(value: string): string {
  // If it matches a known OfficeType, return the canonical label.
  if ((value as OfficeType) in OFFICE_TYPE_LABELS) {
    return OFFICE_TYPE_LABELS[value as OfficeType];
  }
  // Fallback: "STATE_SENATE" -> "State Senate"
  return value
    .toLowerCase()
    .split("_")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function normalizeStageLabel(value: string): string {
  if ((value as ActivationStage) in STAGE_LABELS) {
    return STAGE_LABELS[value as ActivationStage];
  }
  return normalizeOfficeTypeLabel(value);
}

export function normalizeFeedKindLabel(value: string): string {
  if ((value as FeedKind) in FEED_KIND_LABELS) {
    return FEED_KIND_LABELS[value as FeedKind];
  }
  return normalizeOfficeTypeLabel(value);
}

/** Utility sorter: stage first, then office type, then name */
export function sortOfficesByStageThenTypeThenName(a: Office, b: Office): number {
  const sA = STAGE_SORT_ORDER[a.stage] ?? 999;
  const sB = STAGE_SORT_ORDER[b.stage] ?? 999;
  if (sA !== sB) return sA - sB;

  const tA = OFFICE_TYPE_SORT_ORDER[a.officeType] ?? 999;
  const tB = OFFICE_TYPE_SORT_ORDER[b.officeType] ?? 999;
  if (tA !== tB) return tA - tB;

  return a.name.localeCompare(b.name);
}

/** Dashboard filter options */
export const DASHBOARD_FILTERS = {
  stage: [
    { value: "ALL", label: "All stages" },
    { value: "ROOTED", label: STAGE_LABELS.ROOTED },
    { value: "SEEDLING", label: STAGE_LABELS.SEEDLING },
    { value: "DORMANT", label: STAGE_LABELS.DORMANT },
  ] as const,
  officeType: [
    { value: "ALL", label: "All offices" },
    { value: "MAYOR", label: OFFICE_TYPE_LABELS.MAYOR },
    { value: "CITY_COUNCIL", label: OFFICE_TYPE_LABELS.CITY_COUNCIL },
    { value: "COUNTY_COMMISSION", label: OFFICE_TYPE_LABELS.COUNTY_COMMISSION },
    { value: "SCHOOL_BOARD", label: OFFICE_TYPE_LABELS.SCHOOL_BOARD },
    { value: "STATE_SENATE", label: OFFICE_TYPE_LABELS.STATE_SENATE },
    { value: "STATE_ASSEMBLY", label: OFFICE_TYPE_LABELS.STATE_ASSEMBLY },
    { value: "GOVERNOR", label: OFFICE_TYPE_LABELS.GOVERNOR },
  ] as const,
  activeOnly: [
    { value: "ACTIVE_ONLY", label: "Active only" },
    { value: "ALL", label: "All" },
  ] as const,
} as const;

/** Dashboard tabs */
export const DASHBOARD_TABS = {
  insights: [
    { value: "activity", label: "Activity" },
    { value: "activation", label: "Activation" },
    { value: "issues", label: "Issues" },
  ] as const,
  feed: [
    { value: "all", label: "All" },
    { value: "candidates", label: "Candidates" },
    { value: "community", label: "Community" },
    { value: "forums", label: "Forums" },
  ] as const,
} as const;

/** Misc UI copy (microcopy aligned with Polyvox tone) */
export const UI_COPY = {
  location: {
    change: "Change location",
    useMyLocation: "Use my location",
    placeholder: "Search city, county, or state…",
  },
  map: {
    title: "Active locations",
    hint: "Select a marker to preview offices and activity.",
  },
  feed: {
    title: "Latest activity",
    empty: "No recent activity yet.",
  },
  insights: {
    title: "Insights",
    empty: "Not enough data to display insights yet.",
  },
} as const;
