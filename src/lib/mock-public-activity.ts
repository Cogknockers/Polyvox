export type PublicActivityItem = {
  id: string;
  type: "post" | "comment" | "issue" | "vote";
  title: string;
  excerpt: string;
  created_at: string;
  href: string;
};

export const mockPublicActivity: PublicActivityItem[] = [
  {
    id: "act-001",
    type: "issue",
    title: "Raised: Downtown safety pilot",
    excerpt: "Requested a pilot around lighting, ambassadors, and a response dashboard.",
    created_at: "2026-01-10T09:12:00Z",
    href: "/issue/i-001",
  },
  {
    id: "act-002",
    type: "comment",
    title: "Commented on: Downtown safety steps",
    excerpt: "Added context from the last city council meeting.",
    created_at: "2026-01-09T18:40:00Z",
    href: "/issue/i-004",
  },
  {
    id: "act-003",
    type: "post",
    title: "Posted: Write-in rules overview",
    excerpt: "Shared official links and a plain-language summary for Nevada.",
    created_at: "2026-01-08T15:05:00Z",
    href: "/forums/t-002",
  },
  {
    id: "act-004",
    type: "vote",
    title: "Upvoted: School bus delays update",
    excerpt: "Supported a request for real-time notifications.",
    created_at: "2026-01-07T20:22:00Z",
    href: "/issue/i-004",
  },
];
