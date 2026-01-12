import type { ReactNode } from "react";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";
import HelpSidebar from "@/components/help/help-sidebar";

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeaderShell showFilters={false} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-lg border border-border bg-card p-4">
            <HelpSidebar />
          </aside>
          <section className="space-y-6">{children}</section>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
