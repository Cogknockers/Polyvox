export type IssueStatus =
  | "reported"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "disputed";

export type IssueCategory =
  | "infrastructure"
  | "safety"
  | "housing"
  | "education"
  | "budget"
  | "transparency"
  | "health"
  | "environment"
  | "other";

export const ISSUE_STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: "reported", label: "Reported" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "disputed", label: "Disputed" },
];

export const ISSUE_CATEGORY_OPTIONS: { value: IssueCategory; label: string }[] =
  [
    { value: "infrastructure", label: "Infrastructure" },
    { value: "safety", label: "Safety" },
    { value: "housing", label: "Housing" },
    { value: "education", label: "Education" },
    { value: "budget", label: "Budget" },
    { value: "transparency", label: "Transparency" },
    { value: "health", label: "Health" },
    { value: "environment", label: "Environment" },
    { value: "other", label: "Other" },
  ];

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> =
  Object.fromEntries(
    ISSUE_STATUS_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<IssueStatus, string>;

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> =
  Object.fromEntries(
    ISSUE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<IssueCategory, string>;
