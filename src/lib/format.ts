// lib/format.ts
export function formatCompactNumber(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(value);
  } catch {
    return String(value);
  }
}

export function formatPercent(numerator: number, denominator: number): string {
  if (!denominator || denominator <= 0) return "0%";
  const pct = Math.round((numerator / denominator) * 100);
  return `${pct}%`;
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  // Future timestamps (shouldn't happen, but handle)
  if (diffSec < 0) return "just now";

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diffSec < 20) return "just now";
  if (diffSec < minute) return `${diffSec}s ago`;
  if (diffSec < hour) return `${Math.floor(diffSec / minute)}m ago`;
  if (diffSec < day) return `${Math.floor(diffSec / hour)}h ago`;
  if (diffSec < week) return `${Math.floor(diffSec / day)}d ago`;

  // Fallback to short date for older items
  return formatDateShort(iso);
}

export function formatCountyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "County";
  if (/county$/i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed} County`;
}
