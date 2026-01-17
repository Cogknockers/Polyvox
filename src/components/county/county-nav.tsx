"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CountyNavProps = {
  fips: string;
  canModerate?: boolean;
  className?: string;
  actions?: ReactNode;
};

export default function CountyNav({
  fips,
  canModerate = false,
  className,
  actions,
}: CountyNavProps) {
  const pathname = usePathname();
  const base = `/county/${fips}`;

  const links = [
    { label: "Feed", href: base },
    { label: "Issues", href: `${base}/issues` },
    { label: "Offices", href: `${base}/offices` },
    { label: "Entities", href: `${base}/entities` },
    canModerate ? { label: "Moderation", href: `${base}/moderation` } : null,
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {links.map((link) => {
          const isActive =
            link.href === base
              ? pathname === base
              : pathname?.startsWith(link.href);
          return (
            <Button
              key={link.href}
              variant={isActive ? "secondary" : "ghost"}
              asChild
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          );
        })}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
