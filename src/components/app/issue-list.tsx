"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRelativeTime } from "@/lib/format";
import type { Issue } from "@/lib/mock-data";
import { issueCategories } from "@/lib/mock-data";

const ALL_CATEGORIES = "ALL";

type IssueListProps = {
  issues: Issue[];
};

export default function IssueList({ issues }: IssueListProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL_CATEGORIES);

  const filtered = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return issues
      .filter((issue) =>
        category === ALL_CATEGORIES ? true : issue.category === category
      )
      .filter((issue) => {
        if (!lowered) return true;
        return (
          issue.title.toLowerCase().includes(lowered) ||
          issue.body.toLowerCase().includes(lowered)
        );
      })
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAtISO).getTime() -
          new Date(a.createdAtISO).getTime()
      );
  }, [issues, query, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search issues"
          className="md:max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="md:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {issueCategories.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No issues found.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((issue) => {
            const excerpt =
              issue.body.length > 140
                ? `${issue.body.slice(0, 140)}...`
                : issue.body;

            return (
              <Link key={issue.id} href={`/issue/${issue.id}`}>
                <Card className="transition hover:-translate-y-0.5 hover:border-foreground/20">
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{issue.category}</Badge>
                      <span>{formatRelativeTime(issue.createdAtISO)}</span>
                      <span>Replies {issue.repliesCount}</span>
                      <span>Votes {issue.votesCount}</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {issue.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{excerpt}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
