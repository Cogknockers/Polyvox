"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const HELP_LINKS = [
  { label: "Overview", href: "/help" },
  { label: "What is Polyvox", href: "/help/what-is-polyvox" },
  { label: "How Polyvox works", href: "/help/how-polyvox-works" },
  { label: "Jurisdictions", href: "/help/jurisdictions" },
  { label: "Issues and Evidence", href: "/help/issues-and-evidence" },
  { label: "Public Entities and Tagging", href: "/help/entities-and-tagging" },
  { label: "Clusters and Escalation", href: "/help/clusters-and-escalation" },
  { label: "Solutions and Change", href: "/help/solutions-and-change" },
  { label: "Candidates and Leadership", href: "/help/candidates-and-leadership" },
  { label: "Notifications and Safety", href: "/help/notifications-and-safety" },
  { label: "Reputation & Trust", href: "/help/reputation-trust" },
  { label: "Glossary", href: "/help/glossary" },
  { label: "FAQ", href: "/help/faq" },
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
