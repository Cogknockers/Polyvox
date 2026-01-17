"use client";

import * as React from "react";
import { Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DASHBOARD_FILTERS } from "@/lib/constants";
import type { DashboardFilters } from "@/lib/filters";
import { toActiveOnlyFilter, toOfficeTypeFilter, toStageFilter } from "@/lib/filter-adapters";

type FiltersDropdownProps = {
  filters: DashboardFilters;
  onStageChange: (stage: DashboardFilters["stage"]) => void;
  onOfficeTypeChange: (officeType: DashboardFilters["officeType"]) => void;
  onActiveOnlyChange: (activeOnly: DashboardFilters["activeOnly"]) => void;
  onReset?: () => void;
};

export default function FiltersDropdown({
  filters,
  onStageChange,
  onOfficeTypeChange,
  onActiveOnlyChange,
  onReset,
}: FiltersDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="h-9 gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-[1000] w-80 p-4" align="end">
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard filters
        </DropdownMenuLabel>
        <div className="mt-4 grid gap-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="active-only" className="text-sm font-medium">
              Active only
            </Label>
            <Switch
              id="active-only"
              checked={filters.activeOnly === "ACTIVE_ONLY"}
              onCheckedChange={(checked) =>
                onActiveOnlyChange(toActiveOnlyFilter(checked ? "ACTIVE_ONLY" : "ALL"))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Stage</Label>
            <Select
              value={filters.stage}
              onValueChange={(value) => onStageChange(toStageFilter(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_FILTERS.stage.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Office type</Label>
            <Select
              value={filters.officeType}
              onValueChange={(value) => onOfficeTypeChange(toOfficeTypeFilter(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Office type" />
              </SelectTrigger>
              <SelectContent>
                {DASHBOARD_FILTERS.officeType.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Search</Label>
            <Input placeholder="Search offices..." />
          </div>
        </div>
        <DropdownMenuSeparator className="my-4" />
        <Button className="w-full" onClick={onReset} variant="secondary">
          Reset filters
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
