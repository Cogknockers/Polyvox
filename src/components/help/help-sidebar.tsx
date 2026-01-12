"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const HELP_LINKS = [
  { label: "Overview", href: "/help" },
  { label: "Reputation & Trust", href: "/help/reputation-trust" },
  { label: "Glossary", href: "/help/glossary" },
];

export default function HelpSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {HELP_LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
