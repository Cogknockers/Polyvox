"use client";

import * as React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DASHBOARD_FILTERS } from "@/lib/constants";
import type { DashboardFilters } from "@/lib/filters";
import { toOfficeTypeFilter, toStageFilter } from "@/lib/filter-adapters";
import { useDashboardFilters } from "@/hooks/use-dashboard-filters";

function countActiveFilterChips(filters: DashboardFilters): number {
  let count = 0;
  if (filters.stage !== "ALL") count++;
  if (filters.officeType !== "ALL") count++;
  if (filters.activeOnly === "ACTIVE_ONLY") count++;
  return count;
}

export function FiltersDropdown(props: { className?: string }) {
  const {
    filters,
    updateStage,
    updateOfficeType,
    updateActiveOnly,
    resetFilters,
  } = useDashboardFilters();

  const chips = countActiveFilterChips(filters);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className={props.className}>
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {chips > 0 && (
            <Badge variant="default" className="ml-2 px-1.5 py-0">
              {chips}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[320px] p-3">
        <div className="flex items-center justify-between">
          <DropdownMenuLabel className="p-0">Filters</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 px-2"
            title="Reset filters"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>

        <DropdownMenuSeparator />

        <div className="space-y-4 py-2">
          {/* Active only */}
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <Label className="text-sm">Active only</Label>
              <p className="text-xs text-muted-foreground">
                Hide dormant offices and inactive locations.
              </p>
            </div>
            <Switch
              checked={filters.activeOnly === "ACTIVE_ONLY"}
              onCheckedChange={(checked) =>
                updateActiveOnly(checked ? "ACTIVE_ONLY" : "ALL")
              }
              aria-label="Active only"
            />
          </div>

          <Separator />

          {/* Stage */}
          <div className="space-y-2">
            <Label className="text-sm">Stage</Label>
            <Select
              value={filters.stage}
              onValueChange={(val) => updateStage(toStageFilter(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_FILTERS.stage.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Office type */}
          <div className="space-y-2">
            <Label className="text-sm">Office type</Label>
            <Select
              value={filters.officeType}
              onValueChange={(val) => updateOfficeType(toOfficeTypeFilter(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All offices" />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_FILTERS.officeType.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Chips preview */}
        <div className="flex flex-wrap gap-2 pt-2">
          {filters.activeOnly === "ACTIVE_ONLY" && (
            <Badge variant="secondary">Active only</Badge>
          )}
          {filters.stage !== "ALL" && (
            <Badge variant="secondary">Stage: {filters.stage}</Badge>
          )}
          {filters.officeType !== "ALL" && (
            <Badge variant="secondary">Office: {filters.officeType}</Badge>
          )}
          {chips === 0 && (
            <p className="text-xs text-muted-foreground">
              No filters applied.
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
