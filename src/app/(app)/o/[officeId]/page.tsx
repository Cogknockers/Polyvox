"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import IssueCreateDialog from "@/components/app/issue-create-dialog";
import IssueList from "@/components/app/issue-list";
import OfficeHeader from "@/components/app/office-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactNumber } from "@/lib/format";
import {
  getIssuesByOfficeId,
  getJurisdictionById,
  getOfficeById,
  type Issue,
} from "@/lib/mock-data";

function getParamId(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function OfficePage() {
  const params = useParams();
  const officeId = getParamId(params.officeId);
  const office = officeId ? getOfficeById(officeId) : undefined;
  const jurisdiction = office
    ? getJurisdictionById(office.jurisdictionId)
    : undefined;

  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    if (officeId) {
      setIssues(getIssuesByOfficeId(officeId));
    }
  }, [officeId]);

  const actionLabel = useMemo(() => {
    if (!office) return "Activate this office";
    if (office.stage === "DORMANT") return "Activate this office";
    if (office.stage === "SEEDLING") return "Support activation";
    return "Participate";
  }, [office]);

  const issueTotals = useMemo(() => {
    return issues.reduce(
      (acc, issue) => {
        acc.replies += issue.repliesCount;
        acc.votes += issue.votesCount;
        return acc;
      },
      { replies: 0, votes: 0 }
    );
  }, [issues]);

  if (!office) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-12">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              This office could not be found in the demo data.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>

      <OfficeHeader
        office={office}
        jurisdiction={jurisdiction}
        actionLabel={actionLabel}
        onAction={() => {}}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                This is a demo office page. Activation status and supporter
                progress are shown here, along with community issues that need
                attention.
              </p>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Supporters
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCompactNumber(office.supporters)} / {office.supporterGoal}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Issues
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCompactNumber(issues.length)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Votes
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCompactNumber(issueTotals.votes)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Keep this space for upcoming office notes, candidate updates, or
                public schedules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Issues</h2>
              <p className="text-sm text-muted-foreground">
                Track local issues and community input for this office.
              </p>
            </div>
            <IssueCreateDialog
              officeId={office.id}
              onCreate={(issue) => setIssues((prev) => [issue, ...prev])}
            />
          </div>
          <IssueList issues={issues} />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Candidates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Candidate profiles and statements will appear here once
                onboarding begins.
              </p>
              <Button variant="outline">Notify me</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About this office</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                This office is responsible for citywide operations, strategic
                initiatives, and coordination with community departments.
              </p>
              <Separator />
              <p>
                In future milestones, we will add official office descriptions,
                election dates, and verified contacts.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
