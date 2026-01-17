"use client";

import Link from "next/link";
import { Menu, Shield } from "lucide-react";

import PolyvoxLogo from "@/components/brand/polyvox-logo";
import FiltersDropdown from "@/components/app/filters-dropdown";
import { AppSidebarNav } from "@/components/app/app-sidebar";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar";
import ProfileMenu from "@/components/app/profile-menu";
import NotificationsMenu from "@/components/notifications/notifications-menu";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { defaultDashboardFilters, type DashboardFilters } from "@/lib/filters";

export type AppHeaderProps = {
  locationLabel?: string;
  filters?: DashboardFilters;
  onStageChange?: (stage: DashboardFilters["stage"]) => void;
  onOfficeTypeChange?: (officeType: DashboardFilters["officeType"]) => void;
  onActiveOnlyChange?: (activeOnly: DashboardFilters["activeOnly"]) => void;
  onResetFilters?: () => void;
  showFilters?: boolean;
  isAdmin?: boolean;
  myCountyFips?: string | null;
  sheetMode?: "app" | "admin";
};

export default function AppHeader({
  locationLabel = "Reno, NV",
  filters = defaultDashboardFilters,
  onStageChange = () => {},
  onOfficeTypeChange = () => {},
  onActiveOnlyChange = () => {},
  onResetFilters = () => {},
  showFilters = true,
  isAdmin = false,
  myCountyFips = null,
  sheetMode = "app",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex w-full items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>{sheetMode === "admin" ? "Admin" : "Polyvox"}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {sheetMode === "admin" ? <AdminSidebarNav /> : <AppSidebarNav />}
              </div>
            </SheetContent>
          </Sheet>
          <PolyvoxLogo variant="app" size="sm" />
          {showFilters ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Button variant="outline" className="h-9 px-3 text-sm">
                {locationLabel}
              </Button>
              <FiltersDropdown
                filters={filters}
                onStageChange={onStageChange}
                onOfficeTypeChange={onOfficeTypeChange}
                onActiveOnlyChange={onActiveOnlyChange}
                onReset={onResetFilters}
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {showFilters ? (
            <div className="flex items-center gap-2 lg:hidden">
              <Button variant="outline" className="h-9 px-3 text-sm">
                {locationLabel}
              </Button>
              <FiltersDropdown
                filters={filters}
                onStageChange={onStageChange}
                onOfficeTypeChange={onOfficeTypeChange}
                onActiveOnlyChange={onActiveOnlyChange}
                onReset={onResetFilters}
              />
            </div>
          ) : null}
          <Button variant="ghost" className="hidden h-9 px-3 text-sm sm:inline-flex" asChild>
            <Link href="/help">Help</Link>
          </Button>
          {myCountyFips ? (
            <Button
              variant="ghost"
              className="hidden h-9 px-3 text-sm md:inline-flex"
              asChild
            >
              <Link href={`/county/${myCountyFips}`}>My county</Link>
            </Button>
          ) : null}
          <Button variant="ghost" className="hidden h-9 px-3 text-sm sm:inline-flex" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <NotificationsMenu />
          <ThemeToggle />
          {isAdmin ? (
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link href="/admin" aria-label="Admin">
                <Shield className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
