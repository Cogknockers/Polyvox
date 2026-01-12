export type PostType = "DISCUSSION" | "QUESTION" | "ANNOUNCEMENT";

export const POST_TYPE_LABELS: Record<PostType, string> = {
  DISCUSSION: "Discussion",
  QUESTION: "Question",
  ANNOUNCEMENT: "Announcement",
};

export const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: "DISCUSSION", label: "Discussion" },
  { value: "QUESTION", label: "Question" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
];

export function normalizePostType(value: string | null | undefined): PostType {
  const upper = (value ?? "DISCUSSION").toUpperCase();
  if (upper === "QUESTION") return "QUESTION";
  if (upper === "ANNOUNCEMENT") return "ANNOUNCEMENT";
  return "DISCUSSION";
}
