import type { SupabaseClient } from "@supabase/supabase-js";

import { formatCountyName } from "@/lib/format";

export type DashboardUpdateType = "post" | "issue" | "status";

export type DashboardUpdateItem = {
  id: string;
  type: DashboardUpdateType;
  title: string;
  sourceLabel: string;
  createdAt: string;
  href: string;
};

type GetUpdatesInput = {
  supabase: SupabaseClient;
  followedJurisdictionIds: string[];
  followedEntityIds: string[];
  page: number;
  pageSize: number;
};

type JurisdictionRow = {
  id: string;
  name: string | null;
  external_id: string | null;
};

type EntityRow = {
  id: string;
  name: string;
  jurisdiction_id: string;
};

type PostRow = {
  id: string;
  title: string;
  created_at: string;
  jurisdiction_id: string;
};

type IssueRow = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  jurisdiction_id: string;
  entity_id: string | null;
};

const DAYS_WINDOW = 7;
const FETCH_LIMIT = 50;

export async function getDashboardUpdates({
  supabase,
  followedJurisdictionIds,
  followedEntityIds,
  page,
  pageSize,
}: GetUpdatesInput) {
  const since = new Date(Date.now() - DAYS_WINDOW * 24 * 60 * 60 * 1000).toISOString();

  const entityMap = new Map<string, EntityRow>();
  if (followedEntityIds.length > 0) {
    const { data: entities } = await supabase
      .from("public_entities")
      .select("id,name,jurisdiction_id")
      .in("id", followedEntityIds);
    (entities ?? []).forEach((entity) => entityMap.set(entity.id, entity as EntityRow));
  }

  const jurisdictionIds = new Set<string>(followedJurisdictionIds);
  entityMap.forEach((entity) => jurisdictionIds.add(entity.jurisdiction_id));

  const jurisdictionMap = new Map<string, JurisdictionRow>();
  if (jurisdictionIds.size > 0) {
    const { data: jurisdictions } = await supabase
      .from("jurisdictions")
      .select("id,name,external_id")
      .in("id", Array.from(jurisdictionIds));
    (jurisdictions ?? []).forEach((jurisdiction) =>
      jurisdictionMap.set(jurisdiction.id, jurisdiction as JurisdictionRow),
    );
  }

  const items: DashboardUpdateItem[] = [];
  const issueSeen = new Set<string>();
  const statusSeen = new Set<string>();

  if (followedJurisdictionIds.length > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id,title,created_at,jurisdiction_id")
      .in("jurisdiction_id", followedJurisdictionIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    (posts ?? []).forEach((post) => {
      const jurisdiction = jurisdictionMap.get(post.jurisdiction_id);
      const countyLabel = jurisdiction?.name
        ? formatCountyName(jurisdiction.name)
        : "County";
      items.push({
        id: post.id,
        type: "post",
        title: post.title,
        sourceLabel: countyLabel,
        createdAt: post.created_at,
        href: `/post/${post.id}`,
      });
    });
  }

  if (followedJurisdictionIds.length > 0) {
    const { data: issues } = await supabase
      .from("issues")
      .select("id,title,created_at,updated_at,jurisdiction_id,entity_id")
      .in("jurisdiction_id", followedJurisdictionIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    (issues ?? []).forEach((issue) => {
      if (issueSeen.has(issue.id)) return;
      issueSeen.add(issue.id);
      const jurisdiction = jurisdictionMap.get(issue.jurisdiction_id);
      const countyLabel = jurisdiction?.name
        ? formatCountyName(jurisdiction.name)
        : "County";
      items.push({
        id: issue.id,
        type: "issue",
        title: issue.title,
        sourceLabel: countyLabel,
        createdAt: issue.created_at,
        href: `/issue/${issue.id}`,
      });

      addStatusUpdate(issue, countyLabel, items, statusSeen);
    });
  }

  if (followedEntityIds.length > 0) {
    const { data: issues } = await supabase
      .from("issues")
      .select("id,title,created_at,updated_at,jurisdiction_id,entity_id")
      .in("entity_id", followedEntityIds)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(FETCH_LIMIT);

    (issues ?? []).forEach((issue) => {
      if (!issueSeen.has(issue.id)) {
        issueSeen.add(issue.id);
        const entity = issue.entity_id ? entityMap.get(issue.entity_id) : null;
        const jurisdiction = jurisdictionMap.get(issue.jurisdiction_id);
        const countyLabel = jurisdiction?.name
          ? formatCountyName(jurisdiction.name)
          : "County";
        const sourceLabel = entity?.name
          ? `${entity.name} · ${countyLabel}`
          : countyLabel;

        items.push({
          id: issue.id,
          type: "issue",
          title: issue.title,
          sourceLabel,
          createdAt: issue.created_at,
          href: `/issue/${issue.id}`,
        });
      }

      const jurisdiction = jurisdictionMap.get(issue.jurisdiction_id);
      const countyLabel = jurisdiction?.name
        ? formatCountyName(jurisdiction.name)
        : "County";
      addStatusUpdate(issue, countyLabel, items, statusSeen);
    });
  }

  const sorted = items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: sorted.slice(start, end),
    hasNextPage: sorted.length > end,
    currentPage: page,
  };
}

function addStatusUpdate(
  issue: IssueRow,
  countyLabel: string,
  items: DashboardUpdateItem[],
  statusSeen: Set<string>,
) {
  const updatedAt = new Date(issue.updated_at).getTime();
  const createdAt = new Date(issue.created_at).getTime();
  if (Number.isNaN(updatedAt) || Number.isNaN(createdAt)) return;
  if (updatedAt - createdAt < 10 * 60 * 1000) return;
  if (statusSeen.has(issue.id)) return;
  statusSeen.add(issue.id);

  items.push({
    id: issue.id,
    type: "status",
    title: issue.title,
    sourceLabel: countyLabel,
    createdAt: issue.updated_at,
    href: `/issue/${issue.id}`,
  });
}
