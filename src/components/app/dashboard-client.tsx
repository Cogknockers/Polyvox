"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import AppHeader from "@/components/app/app-header";
import AppSidebar from "@/components/app/app-sidebar";
import CivicFeed from "@/components/app/civic-feed";
import DevEntityTagTester from "@/components/app/dev-tag-button";
import InsightsPanel from "@/components/app/insights-panel";
import SnapshotCards from "@/components/app/snapshot-cards";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";
import { computeDashboardView } from "@/lib/filters";
import { mockDashboardData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MapPanel = dynamic(() => import("@/components/app/map-panel"), {
  ssr: false,
  loading: () => (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </CardContent>
    </Card>
  ),
});

type DashboardClientProps = {
  isAdmin?: boolean;
  myCountyFips?: string | null;
};

export default function DashboardClient({
  isAdmin = false,
  myCountyFips = null,
}: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    filters,
    feedTab,
    locationLabel,
    updateStage,
    updateOfficeType,
    updateActiveOnly,
    resetFilters,
    setFeedTab,
  } = useDashboardFilters({ persist: "localStorage" });

  const view = computeDashboardView(mockDashboardData, filters, feedTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="h-16 border-b border-border" />
        <div className="w-full pb-10 pt-6 lg:pl-[260px]">
          <div className="hidden lg:block" />
          <main className="min-w-0 px-6 lg:px-6 lg:pr-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
              <div className="grid gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="space-y-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-52" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-72 w-full rounded-2xl" />
                  </CardContent>
                </Card>
                <div className="grid gap-3 md:grid-cols-3">
                  {[0, 1, 2].map((item) => (
                    <Card key={item} className="shadow-sm">
                      <CardHeader>
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-6 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <div className="grid gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        locationLabel={locationLabel}
        filters={filters}
        onStageChange={updateStage}
        onOfficeTypeChange={updateOfficeType}
        onActiveOnlyChange={updateActiveOnly}
        onResetFilters={resetFilters}
        isAdmin={isAdmin}
        myCountyFips={myCountyFips}
      />
      <div
        className={cn(
          "w-full pb-10 pt-6",
          sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]",
        )}
      >
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <main className="min-w-0 px-6 lg:px-6 lg:pr-6">
          <div className="mb-6">
            <DevEntityTagTester />
          </div>
          <div className="grid gap-6 lg:hidden">
            <div className="grid gap-6">
              <MapPanel
                markers={view.markers}
                offices={view.offices}
                locationLabel={locationLabel}
              />
              <SnapshotCards metrics={mockDashboardData.snapshotMetrics} />
            </div>
            <div className="grid gap-6">
              <InsightsPanel
                activitySeries={mockDashboardData.activitySeries}
                activationSeries={mockDashboardData.activationSeries}
                issueCategorySeries={mockDashboardData.issueCategorySeries}
              />
              <CivicFeed
                items={view.feedItems}
                feedTab={feedTab}
                onTabChange={setFeedTab}
              />
            </div>
          </div>
          <div className="hidden lg:block">
            <ResizablePanelGroup
              direction="horizontal"
              className="flex w-full gap-6"
              autoSaveId="dashboard-main-split"
            >
              <ResizablePanel defaultSize={62} minSize={45}>
                <ResizablePanelGroup
                  direction="vertical"
                  className="min-h-[720px]"
                  style={{ height: "calc(100vh - 260px)" }}
                  autoSaveId="dashboard-map-split"
                >
                  <ResizablePanel defaultSize={60} minSize={40}>
                    <MapPanel
                      markers={view.markers}
                      offices={view.offices}
                      locationLabel={locationLabel}
                      fitHeight
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={40} minSize={25}>
                    <div className="h-full overflow-auto">
                      <SnapshotCards metrics={mockDashboardData.snapshotMetrics} />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={38} minSize={28}>
                <div className="grid gap-6">
                  <InsightsPanel
                    activitySeries={mockDashboardData.activitySeries}
                    activationSeries={mockDashboardData.activationSeries}
                    issueCategorySeries={mockDashboardData.issueCategorySeries}
                  />
                  <CivicFeed
                    items={view.feedItems}
                    feedTab={feedTab}
                    onTabChange={setFeedTab}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </main>
      </div>
    </div>
  );
}
