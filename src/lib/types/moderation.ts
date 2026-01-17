export type ReportStatus = "new" | "reviewing" | "resolved" | "dismissed";

export const REPORT_STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> =
  Object.fromEntries(
    REPORT_STATUS_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<ReportStatus, string>;

export function normalizeReportStatus(
  value: string | null | undefined,
): ReportStatus {
  if (value === "reviewing") return "reviewing";
  if (value === "resolved") return "resolved";
  if (value === "dismissed") return "dismissed";
  return "new";
}
