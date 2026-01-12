"use client";

import { cn } from "@/lib/utils";

const badgeClassMap: Record<string, string> = {
  none: "",
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  gray: "bg-gray-500",
};

export default function AvatarBadge({ badgeColor }: { badgeColor?: string | null }) {
  if (!badgeColor || badgeColor === "none") return null;
  const colorClass = badgeClassMap[badgeColor] ?? "";
  if (!colorClass) return null;

  return (
    <span
      className={cn(
        "absolute right-0 top-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
        colorClass,
      )}
      aria-hidden="true"
    />
  );
}
