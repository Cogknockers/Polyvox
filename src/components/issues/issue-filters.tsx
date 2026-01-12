"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ISSUE_CATEGORY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
  type IssueCategory,
  type IssueStatus,
} from "@/lib/types/issues";

type EntityOption = { id: string; name: string };

type IssueFiltersProps = {
  status: IssueStatus | null;
  category: IssueCategory | null;
  entityId: string | null;
  entities: EntityOption[];
  showEntity?: boolean;
};

export default function IssueFilters({
  status,
  category,
  entityId,
  entities,
  showEntity = true,
}: IssueFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusValue, setStatusValue] = useState<string>(status ?? "all");
  const [categoryValue, setCategoryValue] = useState<string>(category ?? "all");
  const [entityValue, setEntityValue] = useState<string>(entityId ?? "all");

  const entityOptions = useMemo(
    () => [{ id: "all", name: "All entities" }, ...entities],
    [entities],
  );

  useEffect(() => {
    setStatusValue(status ?? "all");
    setCategoryValue(category ?? "all");
    setEntityValue(entityId ?? "all");
  }, [status, category, entityId]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={statusValue}
        onValueChange={(value) => {
          setStatusValue(value);
          updateParam("status", value);
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {ISSUE_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryValue}
        onValueChange={(value) => {
          setCategoryValue(value);
          updateParam("category", value);
        }}
      >
        <SelectTrigger className="w-52">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {ISSUE_CATEGORY_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showEntity ? (
        <Select
          value={entityValue}
          onValueChange={(value) => {
            setEntityValue(value);
            updateParam("entity", value);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Entity" />
          </SelectTrigger>
          <SelectContent>
            {entityOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
