// lib/ui.ts
import type { ActivationStage, FeedKind, Office } from "./mock-data";

export function stageLabel(stage: ActivationStage): string {
  switch (stage) {
    case "ROOTED":
      return "Rooted";
    case "SEEDLING":
      return "Seedling";
    case "DORMANT":
      return "Dormant";
    default:
      return "Unknown";
  }
}

// Suggested shadcn Badge variants: "default" | "secondary" | "destructive" | "outline"
// We'll map stage to something consistent.
// - Rooted: default (primary-ish feel)
// - Seedling: secondary (neutral emphasis)
// - Dormant: outline (quiet)
export function stageBadgeVariant(
  stage: ActivationStage
): "default" | "secondary" | "destructive" | "outline" {
  switch (stage) {
    case "ROOTED":
      return "default";
    case "SEEDLING":
      return "secondary";
    case "DORMANT":
      return "outline";
    default:
      return "outline";
  }
}

export function stageHint(stage: ActivationStage): string {
  switch (stage) {
    case "ROOTED":
      return "This office is active and fully open for participation.";
    case "SEEDLING":
      return "This office is forming. Support activation to help it take root.";
    case "DORMANT":
      return "This office hasn’t been activated yet.";
    default:
      return "";
  }
}

export function kindLabel(kind: FeedKind): string {
  switch (kind) {
    case "CANDIDATE":
      return "Candidate";
    case "COMMUNITY":
      return "Community";
    case "FORUM":
      return "Forum";
    default:
      return "Post";
  }
}

// Utility for progress display on offices
export function supporterProgress(office: Pick<Office, "supporters" | "supporterGoal">): {
  value: number;
  label: string;
} {
  const goal = office.supporterGoal || 0;
  const supporters = office.supporters || 0;
  const value = goal > 0 ? Math.min(100, Math.round((supporters / goal) * 100)) : 0;
  return { value, label: `${supporters}/${goal}` };
}
