"use client";

import type { ReactNode } from "react";

import { useState } from "react";

import AdminSidebar from "@/components/admin/admin-sidebar";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "w-full pb-10 pt-6 pr-6 pl-0",
        sidebarCollapsed ? "lg:pl-[88px]" : "lg:pl-[260px]",
      )}
    >
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main className="min-w-0 px-6 lg:px-6">{children}</main>
    </div>
  );
}
