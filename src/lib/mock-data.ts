// lib/mock-data.ts
// Dummy data for Polyvox UI (Reno, NV default). No backend wiring.

export type ActivationStage = "DORMANT" | "SEEDLING" | "ROOTED";
export type OfficeType =
  | "MAYOR"
  | "CITY_COUNCIL"
  | "COUNTY_COMMISSION"
  | "GOVERNOR"
  | "STATE_SENATE"
  | "STATE_ASSEMBLY"
  | "SCHOOL_BOARD";
export type FeedKind = "CANDIDATE" | "COMMUNITY" | "FORUM";

export type JurisdictionKind = "CITY" | "COUNTY" | "STATE";

export interface Jurisdiction {
  id: string;
  name: string;
  kind: JurisdictionKind;
  state?: string;
}

export interface Office {
  id: string;
  jurisdictionId: string;
  officeType: OfficeType;
  name: string;
  stage: ActivationStage;
  supporters: number;
  supporterGoal: number;
}

export interface MapMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stage: ActivationStage;
  summary: string;
  officeIds: string[];
}

export interface SnapshotMetric {
  label: string;
  value: string | number;
  deltaLabel?: string;
  hint?: string;
}

export interface MetricPoint {
  date: string; // YYYY-MM-DD
  issues: number;
  comments: number;
  votes: number;
}

export interface ActivationPoint {
  label: string; // Wk1..Wk4 (or similar)
  dormant: number;
  seedling: number;
  rooted: number;
}

export interface IssueCategoryPoint {
  category: string;
  count: number;
}

export interface FeedItemBase {
  id: string;
  kind: FeedKind;
  title: string;
  author: string;
  roleTag?: string; // e.g. Candidate, Member, Moderator
  jurisdictionTag: string; // e.g. Reno, NV
  officeTag?: string; // e.g. Mayor
  createdAtISO: string;
  excerpt: string;
  stats?: {
    replies?: number;
    votes?: number;
  };
  badges?: string[]; // e.g. ["ROOTED", "Roads"]
}

export interface Issue {
  id: string;
  officeId: string;
  title: string;
  body: string;
  category: string;
  createdAtISO: string;
  author: string;
  repliesCount: number;
  votesCount: number;
}

export interface Comment {
  id: string;
  issueId: string;
  author: string;
  createdAtISO: string;
  body: string;
  votesCount: number;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAtISO: string;
  repliesCount: number;
  lastActivityISO: string;
  tags?: string[];
}

export interface ForumReply {
  id: string;
  threadId: string;
  author: string;
  createdAtISO: string;
  body: string;
}

export const defaultLocation = {
  label: "Reno, NV",
  lat: 39.5296,
  lng: -119.8138,
} as const;

// Simple time helpers so “latest posts” always look fresh
function isoHoursAgo(hours: number): string {
  const d = new Date(Date.now() - hours * 60 * 60 * 1000);
  return d.toISOString();
}
function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}
function yyyyMmDdDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const jurisdictions: Jurisdiction[] = [
  { id: "j-reno", name: "Reno", kind: "CITY", state: "NV" },
  { id: "j-sparks", name: "Sparks", kind: "CITY", state: "NV" },
  { id: "j-washoe", name: "Washoe County", kind: "COUNTY", state: "NV" },
  { id: "j-carson", name: "Carson City", kind: "CITY", state: "NV" },
  { id: "j-incline", name: "Incline Village", kind: "CITY", state: "NV" },
  { id: "j-slt", name: "South Lake Tahoe", kind: "CITY", state: "CA" },
  { id: "j-truckee", name: "Truckee", kind: "CITY", state: "CA" },
  { id: "j-fernley", name: "Fernley", kind: "CITY", state: "NV" },
  { id: "j-dayton", name: "Dayton", kind: "CITY", state: "NV" },
  { id: "j-vc", name: "Virginia City", kind: "CITY", state: "NV" },
  { id: "j-gardnerville", name: "Gardnerville", kind: "CITY", state: "NV" },
];

export const offices: Office[] = [
  {
    id: "o-reno-mayor",
    jurisdictionId: "j-reno",
    officeType: "MAYOR",
    name: "Mayor of Reno",
    stage: "ROOTED",
    supporters: 38,
    supporterGoal: 50,
  },
  {
    id: "o-reno-council",
    jurisdictionId: "j-reno",
    officeType: "CITY_COUNCIL",
    name: "Reno City Council",
    stage: "SEEDLING",
    supporters: 6,
    supporterGoal: 15,
  },
  {
    id: "o-sparks-mayor",
    jurisdictionId: "j-sparks",
    officeType: "MAYOR",
    name: "Mayor of Sparks",
    stage: "SEEDLING",
    supporters: 4,
    supporterGoal: 15,
  },
  {
    id: "o-washoe-commission",
    jurisdictionId: "j-washoe",
    officeType: "COUNTY_COMMISSION",
    name: "Washoe County Commission",
    stage: "ROOTED",
    supporters: 22,
    supporterGoal: 30,
  },
  {
    id: "o-carson-mayor",
    jurisdictionId: "j-carson",
    officeType: "MAYOR",
    name: "Carson City Chair (Demo)",
    stage: "DORMANT",
    supporters: 0,
    supporterGoal: 10,
  },
  {
    id: "o-washoe-school",
    jurisdictionId: "j-washoe",
    officeType: "SCHOOL_BOARD",
    name: "Washoe School Board",
    stage: "SEEDLING",
    supporters: 9,
    supporterGoal: 20,
  },
  {
    id: "o-nv-governor",
    jurisdictionId: "j-reno", // demo: treat as “visible locally”
    officeType: "GOVERNOR",
    name: "Nevada Governor",
    stage: "ROOTED",
    supporters: 120,
    supporterGoal: 200,
  },
  {
    id: "o-nv-senate",
    jurisdictionId: "j-reno",
    officeType: "STATE_SENATE",
    name: "NV State Senate (District Demo)",
    stage: "SEEDLING",
    supporters: 12,
    supporterGoal: 40,
  },
  {
    id: "o-nv-assembly",
    jurisdictionId: "j-reno",
    officeType: "STATE_ASSEMBLY",
    name: "NV State Assembly (District Demo)",
    stage: "DORMANT",
    supporters: 0,
    supporterGoal: 20,
  },
  {
    id: "o-fernley-mayor",
    jurisdictionId: "j-fernley",
    officeType: "MAYOR",
    name: "Mayor of Fernley",
    stage: "SEEDLING",
    supporters: 3,
    supporterGoal: 10,
  },
  {
    id: "o-truckee-council",
    jurisdictionId: "j-truckee",
    officeType: "CITY_COUNCIL",
    name: "Truckee Town Council",
    stage: "ROOTED",
    supporters: 18,
    supporterGoal: 25,
  },
  {
    id: "o-slt-council",
    jurisdictionId: "j-slt",
    officeType: "CITY_COUNCIL",
    name: "South Lake Tahoe City Council",
    stage: "SEEDLING",
    supporters: 5,
    supporterGoal: 20,
  },
];

export const markers: MapMarker[] = [
  {
    id: "m-reno",
    name: "Reno, NV",
    lat: 39.5296,
    lng: -119.8138,
    stage: "ROOTED",
    summary: "2 active offices • 1 rooted",
    officeIds: ["o-reno-mayor", "o-reno-council"],
  },
  {
    id: "m-sparks",
    name: "Sparks, NV",
    lat: 39.5349,
    lng: -119.7527,
    stage: "SEEDLING",
    summary: "1 office • seedling 4/15",
    officeIds: ["o-sparks-mayor"],
  },
  {
    id: "m-washoe",
    name: "Washoe County, NV",
    lat: 39.575,
    lng: -119.9,
    stage: "ROOTED",
    summary: "2 offices • 1 rooted",
    officeIds: ["o-washoe-commission", "o-washoe-school"],
  },
  {
    id: "m-carson",
    name: "Carson City, NV",
    lat: 39.1638,
    lng: -119.7674,
    stage: "DORMANT",
    summary: "1 office • dormant",
    officeIds: ["o-carson-mayor"],
  },
  {
    id: "m-incline",
    name: "Incline Village, NV",
    lat: 39.2513,
    lng: -119.9729,
    stage: "SEEDLING",
    summary: "community forming",
    officeIds: [],
  },
  {
    id: "m-slt",
    name: "South Lake Tahoe, CA",
    lat: 38.9399,
    lng: -119.9772,
    stage: "SEEDLING",
    summary: "1 office • seedling 5/20",
    officeIds: ["o-slt-council"],
  },
  {
    id: "m-truckee",
    name: "Truckee, CA",
    lat: 39.3279,
    lng: -120.1833,
    stage: "ROOTED",
    summary: "1 office • rooted 18/25",
    officeIds: ["o-truckee-council"],
  },
  {
    id: "m-fernley",
    name: "Fernley, NV",
    lat: 39.6077,
    lng: -119.2518,
    stage: "SEEDLING",
    summary: "1 office • seedling 3/10",
    officeIds: ["o-fernley-mayor"],
  },
  {
    id: "m-dayton",
    name: "Dayton, NV",
    lat: 39.2371,
    lng: -119.5929,
    stage: "SEEDLING",
    summary: "office activation requested",
    officeIds: [],
  },
  {
    id: "m-vc",
    name: "Virginia City, NV",
    lat: 39.3096,
    lng: -119.6496,
    stage: "DORMANT",
    summary: "not active yet",
    officeIds: [],
  },
  {
    id: "m-gardnerville",
    name: "Gardnerville, NV",
    lat: 38.9416,
    lng: -119.749,
    stage: "DORMANT",
    summary: "not active yet",
    officeIds: [],
  },
];

export const snapshotMetrics: SnapshotMetric[] = [
  { label: "Active offices (Rooted)", value: 3, hint: "Offices with enough local support to open fully." },
  { label: "Seedlings near you", value: 6, hint: "Spaces forming now. Support to help them take root." },
  { label: "Issues this week", value: 14, deltaLabel: "+3 vs last week", hint: "New issues posted in your area." },
  { label: "Comments today", value: 46, deltaLabel: "+11", hint: "Replies across issues and forums today." },
  { label: "Votes today", value: 128, deltaLabel: "+22", hint: "Civic signals across issues & comments." },
  { label: "Next debate", value: "Placeholder — coming soon", hint: "Live debates will appear here when enabled." },
];

// 14-day activity series (plausible, gently trending)
export const activitySeries: MetricPoint[] = [
  { date: yyyyMmDdDaysAgo(13), issues: 2, comments: 18, votes: 44 },
  { date: yyyyMmDdDaysAgo(12), issues: 1, comments: 16, votes: 40 },
  { date: yyyyMmDdDaysAgo(11), issues: 2, comments: 20, votes: 52 },
  { date: yyyyMmDdDaysAgo(10), issues: 3, comments: 22, votes: 57 },
  { date: yyyyMmDdDaysAgo(9), issues: 2, comments: 19, votes: 49 },
  { date: yyyyMmDdDaysAgo(8), issues: 4, comments: 26, votes: 66 },
  { date: yyyyMmDdDaysAgo(7), issues: 3, comments: 24, votes: 61 },
  { date: yyyyMmDdDaysAgo(6), issues: 2, comments: 21, votes: 55 },
  { date: yyyyMmDdDaysAgo(5), issues: 5, comments: 31, votes: 78 },
  { date: yyyyMmDdDaysAgo(4), issues: 4, comments: 29, votes: 73 },
  { date: yyyyMmDdDaysAgo(3), issues: 6, comments: 34, votes: 86 },
  { date: yyyyMmDdDaysAgo(2), issues: 5, comments: 32, votes: 82 },
  { date: yyyyMmDdDaysAgo(1), issues: 4, comments: 30, votes: 80 },
  { date: yyyyMmDdDaysAgo(0), issues: 6, comments: 36, votes: 92 },
];

export const activationSeries: ActivationPoint[] = [
  { label: "Wk1", dormant: 18, seedling: 3, rooted: 1 },
  { label: "Wk2", dormant: 16, seedling: 5, rooted: 2 },
  { label: "Wk3", dormant: 14, seedling: 7, rooted: 3 },
  { label: "Wk4", dormant: 13, seedling: 8, rooted: 4 },
];

export const issueCategorySeries: IssueCategoryPoint[] = [
  { category: "Housing", count: 18 },
  { category: "Safety", count: 12 },
  { category: "Roads", count: 15 },
  { category: "Schools", count: 10 },
  { category: "Water", count: 6 },
  { category: "Local Economy", count: 9 },
];

export const issueCategories = issueCategorySeries.map((item) => item.category);

export const feedItems: FeedItemBase[] = [
  {
    id: "f-001",
    kind: "CANDIDATE",
    title: "Reno Mayor: Budget priorities (draft)",
    author: "A. Martinez",
    roleTag: "Candidate",
    jurisdictionTag: "Reno, NV",
    officeTag: "Mayor",
    createdAtISO: isoHoursAgo(3),
    excerpt:
      "I’m proposing a baseline budget that prioritizes street maintenance, emergency response staffing, and transparent contract reporting. Draft outline inside.",
    stats: { replies: 14, votes: 52 },
    badges: ["ROOTED", "Budget"],
  },
  {
    id: "f-002",
    kind: "CANDIDATE",
    title: "Washoe Commission: Transparency pledge",
    author: "J. Kim",
    roleTag: "Candidate",
    jurisdictionTag: "Washoe County, NV",
    officeTag: "County Commission",
    createdAtISO: isoHoursAgo(7),
    excerpt:
      "If elected, I’ll publish meeting notes within 48 hours, require plain-language summaries for major votes, and support a public request tracker.",
    stats: { replies: 9, votes: 41 },
    badges: ["ROOTED", "Transparency"],
  },
  {
    id: "f-003",
    kind: "COMMUNITY",
    title: "Potholes on Sutro St — photos attached",
    author: "Resident",
    roleTag: "Community",
    jurisdictionTag: "Reno, NV",
    officeTag: "City Council",
    createdAtISO: isoHoursAgo(11),
    excerpt:
      "Multiple deep potholes near the intersection have caused tire damage. Added photos and exact coordinates. What’s the fastest reporting path?",
    stats: { replies: 18, votes: 67 },
    badges: ["Roads", "Evidence"],
  },
  {
    id: "f-004",
    kind: "COMMUNITY",
    title: "School board meeting recap",
    author: "Resident",
    roleTag: "Community",
    jurisdictionTag: "Washoe County, NV",
    officeTag: "School Board",
    createdAtISO: isoHoursAgo(18),
    excerpt:
      "Summary of last night’s agenda: staffing, transportation delays, and next steps on facility repairs. Key quotes + timestamps included.",
    stats: { replies: 12, votes: 39 },
    badges: ["Schools", "Summary"],
  },
  {
    id: "f-005",
    kind: "FORUM",
    title: "Should Polyvox require location verification?",
    author: "Member",
    roleTag: "Forum",
    jurisdictionTag: "Reno, NV",
    createdAtISO: isoDaysAgo(1),
    excerpt:
      "What’s the best balance between open access and local integrity? Should commenting require verification, or only voting and candidacy?",
    stats: { replies: 26, votes: 34 },
    badges: ["Governance"],
  },
  {
    id: "f-006",
    kind: "FORUM",
    title: "Write-in rules: Nevada overview (links)",
    author: "Member",
    roleTag: "Forum",
    jurisdictionTag: "Nevada",
    createdAtISO: isoDaysAgo(1),
    excerpt:
      "Sharing official links and a plain-language summary of how write-ins work in NV. If you have county-specific notes, add them here.",
    stats: { replies: 7, votes: 21 },
    badges: ["Write-ins", "Research"],
  },
  {
    id: "f-007",
    kind: "CANDIDATE",
    title: "Truckee Council: Wildfire mitigation plan",
    author: "S. Patel",
    roleTag: "Candidate",
    jurisdictionTag: "Truckee, CA",
    officeTag: "Town Council",
    createdAtISO: isoDaysAgo(2),
    excerpt:
      "My plan focuses on defensible space enforcement, evacuation routing improvements, and a public dashboard for mitigation projects by neighborhood.",
    stats: { replies: 8, votes: 28 },
    badges: ["ROOTED", "Safety"],
  },
  {
    id: "f-008",
    kind: "COMMUNITY",
    title: "Downtown safety: proposed steps",
    author: "Resident",
    roleTag: "Community",
    jurisdictionTag: "Reno, NV",
    officeTag: "Mayor",
    createdAtISO: isoDaysAgo(2),
    excerpt:
      "Proposing a pilot: better lighting on key blocks, a staffed resource hub, and transparent incident reporting. Looking for data sources to cite.",
    stats: { replies: 22, votes: 44 },
    badges: ["Safety", "Proposal"],
  },
  {
    id: "f-009",
    kind: "FORUM",
    title: "How to host a local debate (best practices)",
    author: "Moderator",
    roleTag: "Forum",
    jurisdictionTag: "Polyvox",
    createdAtISO: isoDaysAgo(3),
    excerpt:
      "Draft guidelines for timeboxing, topic selection from community issues, and moderation rules that protect disagreement while stopping abuse.",
    stats: { replies: 16, votes: 30 },
    badges: ["Debates", "Playbook"],
  },
  {
    id: "f-010",
    kind: "CANDIDATE",
    title: "Nevada Governor: public funding stance",
    author: "K. Nguyen",
    roleTag: "Candidate",
    jurisdictionTag: "Nevada",
    officeTag: "Governor",
    createdAtISO: isoDaysAgo(4),
    excerpt:
      "I support a small-donor matching model and stricter reporting timelines. Here’s how I’d phase it in without disadvantaging challengers.",
    stats: { replies: 19, votes: 57 },
    badges: ["ROOTED", "Reform"],
  },
  {
    id: "f-011",
    kind: "COMMUNITY",
    title: "Housing affordability thread (summary)",
    author: "Resident",
    roleTag: "Community",
    jurisdictionTag: "Reno, NV",
    createdAtISO: isoDaysAgo(5),
    excerpt:
      "Summarizing the strongest suggestions from the last 40 comments: zoning, permits, infill incentives, and tenant protections. Open to more data.",
    stats: { replies: 31, votes: 62 },
    badges: ["Housing", "Summary"],
  },
  {
    id: "f-012",
    kind: "FORUM",
    title: "Feature request: QR flyers per office",
    author: "Member",
    roleTag: "Forum",
    jurisdictionTag: "Polyvox",
    createdAtISO: isoDaysAgo(6),
    excerpt:
      "Can we generate a printable one-pager for each office with a QR code to the office page and a quick list of active candidates/issues?",
    stats: { replies: 11, votes: 25 },
    badges: ["UX", "Sharing"],
  },
];

export const issues: Issue[] = [
  {
    id: "i-001",
    officeId: "o-reno-mayor",
    title: "Downtown safety pilot: lighting and response",
    body:
      "Requesting a pilot around the river corridor with added lighting, late-night ambassadors, and a public response dashboard. Please share data sources we can cite.",
    category: "Safety",
    createdAtISO: isoHoursAgo(6),
    author: "Resident",
    repliesCount: 12,
    votesCount: 34,
  },
  {
    id: "i-002",
    officeId: "o-reno-council",
    title: "Sutro St potholes and resurfacing timeline",
    body:
      "Multiple reports of tire damage on Sutro St. Can the city publish a resurfacing timeline and interim fixes? Photos and locations attached.",
    category: "Roads",
    createdAtISO: isoHoursAgo(14),
    author: "Resident",
    repliesCount: 8,
    votesCount: 22,
  },
  {
    id: "i-003",
    officeId: "o-washoe-commission",
    title: "Housing supply update: permit backlog",
    body:
      "Looking for clarity on current permit backlog numbers and whether a temporary fast-track lane is viable for small projects under 20 units.",
    category: "Housing",
    createdAtISO: isoDaysAgo(2),
    author: "Member",
    repliesCount: 15,
    votesCount: 41,
  },
  {
    id: "i-004",
    officeId: "o-washoe-school",
    title: "School bus delays and communication gaps",
    body:
      "Families report late buses and inconsistent notifications. Please share the dispatch process and a plan for real-time updates.",
    category: "Schools",
    createdAtISO: isoDaysAgo(3),
    author: "Resident",
    repliesCount: 10,
    votesCount: 27,
  },
  {
    id: "i-005",
    officeId: "o-sparks-mayor",
    title: "Water restrictions: neighborhood schedule clarity",
    body:
      "The current watering schedule is confusing for mixed-use properties. Can we publish a clear map with address lookup?",
    category: "Water",
    createdAtISO: isoDaysAgo(4),
    author: "Resident",
    repliesCount: 5,
    votesCount: 13,
  },
  {
    id: "i-006",
    officeId: "o-truckee-council",
    title: "Small business permit fees for winter season",
    body:
      "Requesting a temporary fee relief program for local businesses impacted by the winter slowdown, plus a simple application checklist.",
    category: "Local Economy",
    createdAtISO: isoDaysAgo(5),
    author: "Member",
    repliesCount: 9,
    votesCount: 19,
  },
  {
    id: "i-007",
    officeId: "o-slt-council",
    title: "Pedestrian safety near lakefront crossings",
    body:
      "Several crosswalks near the lakefront feel unsafe at night. Propose flashing beacons and crosswalk repainting before summer traffic ramps.",
    category: "Safety",
    createdAtISO: isoDaysAgo(6),
    author: "Resident",
    repliesCount: 6,
    votesCount: 17,
  },
  {
    id: "i-008",
    officeId: "o-nv-governor",
    title: "Statewide housing innovation fund criteria",
    body:
      "If the housing fund is launched, what criteria should prioritize rural and mid-size cities? Suggest publishing a scoring rubric.",
    category: "Housing",
    createdAtISO: isoDaysAgo(7),
    author: "Member",
    repliesCount: 18,
    votesCount: 53,
  },
];

export const comments: Comment[] = [
  {
    id: "c-001",
    issueId: "i-001",
    author: "Member",
    createdAtISO: isoHoursAgo(4),
    body: "Happy to share recent crime reports. Also recommend adding emergency call boxes near the trail.",
    votesCount: 6,
  },
  {
    id: "c-002",
    issueId: "i-001",
    author: "Resident",
    createdAtISO: isoHoursAgo(2),
    body: "We should include a light audit map with dark zones flagged by block.",
    votesCount: 4,
  },
  {
    id: "c-003",
    issueId: "i-002",
    author: "Resident",
    createdAtISO: isoHoursAgo(10),
    body: "I can provide photos from last week. There are 3 major spots near the intersection.",
    votesCount: 3,
  },
  {
    id: "c-004",
    issueId: "i-003",
    author: "Member",
    createdAtISO: isoDaysAgo(1),
    body: "The county meeting notes mention a pilot, but no timeline yet. We should request a public dashboard.",
    votesCount: 7,
  },
  {
    id: "c-005",
    issueId: "i-004",
    author: "Resident",
    createdAtISO: isoDaysAgo(2),
    body: "Families in our area still get updates 20 minutes late. Maybe use SMS alerts for route changes.",
    votesCount: 5,
  },
  {
    id: "c-006",
    issueId: "i-005",
    author: "Member",
    createdAtISO: isoDaysAgo(3),
    body: "A searchable map would help a ton. I can help draft the copy if needed.",
    votesCount: 2,
  },
  {
    id: "c-007",
    issueId: "i-006",
    author: "Resident",
    createdAtISO: isoDaysAgo(4),
    body: "Seasonal fee relief would really help. We could tie it to a simple revenue threshold.",
    votesCount: 4,
  },
  {
    id: "c-008",
    issueId: "i-007",
    author: "Resident",
    createdAtISO: isoDaysAgo(5),
    body: "Crosswalk repainting is low cost and quick. Any data on near misses?",
    votesCount: 1,
  },
  {
    id: "c-009",
    issueId: "i-008",
    author: "Member",
    createdAtISO: isoDaysAgo(6),
    body: "Rural cities need weight for distance to services and construction costs. Happy to help draft criteria.",
    votesCount: 9,
  },
  {
    id: "c-010",
    issueId: "i-003",
    author: "Resident",
    createdAtISO: isoDaysAgo(2),
    body: "If a fast-track lane is added, we should publish service level targets.",
    votesCount: 3,
  },
  {
    id: "c-011",
    issueId: "i-004",
    author: "Member",
    createdAtISO: isoDaysAgo(2),
    body: "Parent groups can help test notifications. Add opt-in to build trust.",
    votesCount: 2,
  },
  {
    id: "c-012",
    issueId: "i-002",
    author: "Resident",
    createdAtISO: isoHoursAgo(8),
    body: "The city hotline said repairs are scheduled but no date. We should request a public list.",
    votesCount: 5,
  },
];

export const forumThreads: ForumThread[] = [
  {
    id: "t-001",
    title: "Should Polyvox require location verification?",
    body:
      "Looking for the right balance between open access and local integrity. Should voting require verification, or only candidacy and moderation tools?",
    author: "Member",
    createdAtISO: isoDaysAgo(3),
    repliesCount: 12,
    lastActivityISO: isoHoursAgo(5),
    tags: ["Governance", "Product"],
  },
  {
    id: "t-002",
    title: "Write-in rules: Nevada overview (links)",
    body:
      "Sharing official references and a plain-language summary of write-in rules. Add county-specific notes or corrections below.",
    author: "Member",
    createdAtISO: isoDaysAgo(4),
    repliesCount: 6,
    lastActivityISO: isoDaysAgo(1),
    tags: ["Research", "Elections"],
  },
  {
    id: "t-003",
    title: "How to host a local debate (best practices)",
    body:
      "Draft guidelines for timeboxing, topic selection, and moderation. Looking for examples from other cities and any templates.",
    author: "Moderator",
    createdAtISO: isoDaysAgo(6),
    repliesCount: 9,
    lastActivityISO: isoDaysAgo(2),
    tags: ["Debates", "Playbook"],
  },
  {
    id: "t-004",
    title: "Feature request: QR flyers per office",
    body:
      "Proposing printable one-pagers with QR codes for each office, including top issues, candidates, and activation status.",
    author: "Member",
    createdAtISO: isoDaysAgo(7),
    repliesCount: 4,
    lastActivityISO: isoDaysAgo(3),
    tags: ["UX", "Sharing"],
  },
];

export const forumReplies: ForumReply[] = [
  {
    id: "r-001",
    threadId: "t-001",
    author: "Member",
    createdAtISO: isoDaysAgo(2),
    body: "Maybe only require verification for voting and candidate posts. Keep read-only open.",
  },
  {
    id: "r-002",
    threadId: "t-001",
    author: "Resident",
    createdAtISO: isoDaysAgo(1),
    body: "Soft verification could work: optional badge for verified locals.",
  },
  {
    id: "r-003",
    threadId: "t-002",
    author: "Member",
    createdAtISO: isoDaysAgo(2),
    body: "Clark County is similar, but filing deadlines differ. I can add the official PDF.",
  },
  {
    id: "r-004",
    threadId: "t-003",
    author: "Moderator",
    createdAtISO: isoDaysAgo(3),
    body: "We should include a safe harbor section for community-led moderators.",
  },
  {
    id: "r-005",
    threadId: "t-003",
    author: "Member",
    createdAtISO: isoDaysAgo(2),
    body: "Happy to contribute a sample agenda and timing template.",
  },
  {
    id: "r-006",
    threadId: "t-004",
    author: "Member",
    createdAtISO: isoDaysAgo(4),
    body: "QR flyers would help at events. Add a short URL fallback too.",
  },
];

// Convenience helpers (optional)
export function getOfficesByStage(stage: ActivationStage): Office[] {
  return offices.filter((o) => o.stage === stage);
}

export function getFeedByKind(kind: FeedKind): FeedItemBase[] {
  return feedItems.filter((f) => f.kind === kind);
}

export function getMarkerById(id: string): MapMarker | undefined {
  return markers.find((m) => m.id === id);
}

export function getOfficeById(id: string): Office | undefined {
  return offices.find((office) => office.id === id);
}

export function getJurisdictionById(id: string): Jurisdiction | undefined {
  return jurisdictions.find((jurisdiction) => jurisdiction.id === id);
}

export function getIssuesByOfficeId(officeId: string): Issue[] {
  return issues
    .filter((issue) => issue.officeId === officeId)
    .slice()
    .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
}

export function getIssueById(issueId: string): Issue | undefined {
  return issues.find((issue) => issue.id === issueId);
}

export function getCommentsByIssueId(issueId: string): Comment[] {
  return comments
    .filter((comment) => comment.issueId === issueId)
    .slice()
    .sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
}

export function getThreadById(threadId: string): ForumThread | undefined {
  return forumThreads.find((thread) => thread.id === threadId);
}

export function getRepliesByThreadId(threadId: string): ForumReply[] {
  return forumReplies
    .filter((reply) => reply.threadId === threadId)
    .slice()
    .sort((a, b) => new Date(a.createdAtISO).getTime() - new Date(b.createdAtISO).getTime());
}

export const mockDashboardData = {
  defaultLocation,
  jurisdictions,
  offices,
  markers,
  snapshotMetrics,
  activitySeries,
  activationSeries,
  issueCategorySeries,
  feedItems,
} as const;
