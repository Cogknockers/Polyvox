"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  REPORT_STATUS_OPTIONS,
  type ReportStatus,
} from "@/lib/types/moderation";

type ModerationFiltersProps = {
  status: ReportStatus | null;
};

export default function ModerationFilters({ status }: ModerationFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(status ?? "all");

  useEffect(() => {
    setValue(status ?? "all");
  }, [status]);

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    const params = new URLSearchParams(searchParams.toString());
    if (nextValue === "all") {
      params.delete("status");
    } else {
      params.set("status", nextValue);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All statuses</SelectItem>
        {REPORT_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
