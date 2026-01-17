import type { DashboardFilters } from "@/lib/filters";
import type { ActivationStage, OfficeType } from "@/lib/mock-data";

export function toStageFilter(value: string): DashboardFilters["stage"] {
  if (value === "ALL") return "ALL";
  return value as ActivationStage;
}

export function toOfficeTypeFilter(value: string): DashboardFilters["officeType"] {
  if (value === "ALL") return "ALL";
  return value as OfficeType;
}

export function toActiveOnlyFilter(value: string): DashboardFilters["activeOnly"] {
  if (value === "ALL") return "ALL";
  return "ACTIVE_ONLY";
}
