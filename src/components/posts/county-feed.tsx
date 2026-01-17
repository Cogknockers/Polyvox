"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import CreatePostDialog from "@/components/posts/create-post-dialog";
import PostCard, { type PostCardItem } from "@/components/posts/post-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POST_TYPE_OPTIONS, type PostType } from "@/lib/posts";

type CountyFeedProps = {
  posts: PostCardItem[];
  jurisdictionId: string;
  countyFips: string;
  canPost: boolean;
  entities?: Array<{ id: string; name: string }>;
  currentPage: number;
  hasNextPage: boolean;
  typeFilter?: "discussion" | "question" | "announcement" | null;
};

const FILTER_OPTIONS: Array<{ value: "ALL" | PostType; label: string }> = [
  { value: "ALL", label: "All" },
  ...POST_TYPE_OPTIONS,
];

export default function CountyFeed({
  posts,
  jurisdictionId,
  countyFips,
  canPost,
  entities,
  currentPage,
  hasNextPage,
  typeFilter,
}: CountyFeedProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | PostType>(() => {
    if (typeFilter === "discussion") return "DISCUSSION";
    if (typeFilter === "question") return "QUESTION";
    if (typeFilter === "announcement") return "ANNOUNCEMENT";
    return "ALL";
  });
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filteredPosts = useMemo(() => {
    if (filter === "ALL") return posts;
    return posts.filter((post) => post.type === filter);
  }, [filter, posts]);

  useEffect(() => {
    if (typeFilter === "discussion") {
      setFilter("DISCUSSION");
    } else if (typeFilter === "question") {
      setFilter("QUESTION");
    } else if (typeFilter === "announcement") {
      setFilter("ANNOUNCEMENT");
    } else {
      setFilter("ALL");
    }
  }, [typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(value) => {
              const nextValue = value as "ALL" | PostType;
              setFilter(nextValue);
              const params = new URLSearchParams(searchParams.toString());
              if (nextValue === "ALL") {
                params.delete("type");
              } else {
                params.set("type", nextValue.toLowerCase());
              }
              params.delete("page");
              const query = params.toString();
              router.push(query ? `${pathname}?${query}` : pathname);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter type" />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CreatePostDialog
          jurisdictionId={jurisdictionId}
          countyFips={countyFips}
          canPost={canPost}
          entities={entities}
          onCreated={() => router.refresh()}
        />
      </div>

      {filteredPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No posts yet. Be the first to start a discussion.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              canVote={canPost}
              countyFips={countyFips}
              taggedEntity={
                post.entityId && post.entityName
                  ? {
                      name: post.entityName,
                      href: `/county/${countyFips}/entities/${post.entityId}`,
                    }
                  : undefined
              }
              notifyEntity={
                post.entityId && post.entityName
                  ? {
                      id: post.entityId,
                      name: post.entityName,
                      jurisdictionId,
                      postId: post.id,
                      canNotify: canPost,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {currentPage <= 1 ? (
          <Button variant="outline" disabled>
            Prev
          </Button>
        ) : (
          <Button variant="outline" asChild>
            <Link href={buildPageHref(searchParams, pathname, currentPage - 1)}>
              Prev
            </Link>
          </Button>
        )}
        {hasNextPage ? (
          <Button variant="outline" asChild>
            <Link href={buildPageHref(searchParams, pathname, currentPage + 1)}>
              Next
            </Link>
          </Button>
        ) : (
          <Button variant="outline" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function buildPageHref(
  searchParams: URLSearchParams,
  pathname: string,
  page: number,
) {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
