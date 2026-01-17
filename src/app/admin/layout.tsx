import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/authz";
import AppHeaderShell from "@/components/app/app-header-shell";
import AdminShell from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeaderShell showFilters={false} sheetMode="admin" />
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
