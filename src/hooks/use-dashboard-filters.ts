"use client";

import * as React from "react";
import type { DashboardFilters, FeedTab } from "@/lib/filters";
import { defaultDashboardFilters } from "@/lib/filters";

type PersistMode = "none" | "localStorage";

const LS_KEY = "polyvox.dashboard.filters.v1";
const LS_TAB_KEY = "polyvox.dashboard.feedTab.v1";

function safeParseJSON<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function useDashboardFilters(options?: {
  persist?: PersistMode;
  initial?: DashboardFilters;
  initialFeedTab?: FeedTab;
}) {
  const persist = options?.persist ?? "localStorage";
  const initial = options?.initial ?? defaultDashboardFilters;
  const initialFeedTab = options?.initialFeedTab ?? "all";

  const [filters, setFilters] = React.useState<DashboardFilters>(initial);
  const [feedTab, setFeedTab] = React.useState<FeedTab>(initialFeedTab);
  const [locationLabel, setLocationLabel] = React.useState<string>("Reno, NV");

  // Hydrate from localStorage once
  React.useEffect(() => {
    if (persist !== "localStorage") return;

    const stored = safeParseJSON<DashboardFilters>(localStorage.getItem(LS_KEY));
    if (stored) setFilters(stored);

    const storedTab = localStorage.getItem(LS_TAB_KEY) as FeedTab | null;
    if (storedTab) setFeedTab(storedTab);
  }, [persist]);

  // Persist changes
  React.useEffect(() => {
    if (persist !== "localStorage") return;
    localStorage.setItem(LS_KEY, JSON.stringify(filters));
  }, [filters, persist]);

  React.useEffect(() => {
    if (persist !== "localStorage") return;
    localStorage.setItem(LS_TAB_KEY, feedTab);
  }, [feedTab, persist]);

  const updateStage = React.useCallback((stage: DashboardFilters["stage"]) => {
    setFilters((f) => ({ ...f, stage }));
  }, []);

  const updateOfficeType = React.useCallback(
    (officeType: DashboardFilters["officeType"]) => {
      setFilters((f) => ({ ...f, officeType }));
    },
    []
  );

  const updateActiveOnly = React.useCallback(
    (activeOnly: DashboardFilters["activeOnly"]) => {
      setFilters((f) => ({ ...f, activeOnly }));
    },
    []
  );

  const resetFilters = React.useCallback(() => {
    setFilters(defaultDashboardFilters);
  }, []);

  return {
    // state
    filters,
    feedTab,
    locationLabel,

    // setters
    setFilters,
    setFeedTab,
    setLocationLabel,

    // helpers
    updateStage,
    updateOfficeType,
    updateActiveOnly,
    resetFilters,
  };
}
