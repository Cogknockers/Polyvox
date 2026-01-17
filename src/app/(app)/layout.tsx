import "leaflet/dist/leaflet.css";

import type { ReactNode } from "react";

import AppFooter from "@/components/app/app-footer";
import AppHeaderShell from "@/components/app/app-header-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col">
        <AppHeaderShell showFilters={false} />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </div>
    </div>
  );
}
