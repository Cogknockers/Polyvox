import Link from "next/link";
import {
  Bookmark,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MessageSquareText,
  Settings,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Explore", href: "/dashboard", icon: Compass, badge: "New" },
  { label: "Offices", href: "/dashboard", icon: Building2 },
  { label: "Issues", href: "/dashboard", icon: MessageSquareText, badge: "12" },
  { label: "Forums", href: "/dashboard", icon: Users },
  { label: "Saved", href: "/dashboard", icon: Bookmark },
  { label: "Settings", href: "/settings", icon: Settings },
];

type AppSidebarNavProps = {
  className?: string;
  collapsed?: boolean;
};

export function AppSidebarNav({ className, collapsed = false }: AppSidebarNavProps) {
  return (
    <nav className={cn("grid gap-1", className)}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            title={item.label}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <span className={cn("flex items-center gap-2", collapsed && "gap-0")}>
              <Icon className={cn("h-4 w-4", collapsed && "h-8 w-8")} />
              <span className={cn(collapsed && "sr-only")}>{item.label}</span>
            </span>
            {!collapsed && item.badge ? (
              <Badge variant="secondary" className="rounded-full">
                {item.badge}
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 hidden h-[calc(100vh-64px)] flex-col border-r border-border bg-card px-3 py-0 lg:flex",
        collapsed ? "w-[88px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-2",
          collapsed && "justify-center"
        )}
      >
        {!collapsed ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Navigation
          </p>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      {!collapsed ? <Separator className="my-3" /> : null}
      <ScrollArea className={cn("h-full pr-2", collapsed && "pr-0")}>
        <div className="grid gap-4">
          <div>
            <AppSidebarNav collapsed={collapsed} />
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
